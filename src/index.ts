import "dotenv/config";
import express, { Request, Response } from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import twilio from "twilio";
import { connectToElevenLabs } from './elevenlabs';

const app = express();
const server = createServer(app);

// WebSocket server for Twilio media streams
const wss = new WebSocketServer({ server, path: "/media-stream" });

// Twilio client
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req: Request, res: Response) => {
    res.send("AI Voice Agent Server Running");
});

// Twilio webhook - returns TwiML for the call
app.post("/voice", (req: Request, res: Response) => {
    const response = new twilio.twiml.VoiceResponse();

    // Say something first
    response.say("Hello! This is your AI voice agent. Let me connect you.");

    // Connect to bidirectional stream
    const connect = response.connect();
    connect.stream({
        url: `wss://${req.headers.host}/media-stream`
    });

    res.type("text/xml");
    res.send(response.toString());
});

// Handle WebSocket connections from Twilio
wss.on('connection', handleTwilioConnection);


function handleTwilioConnection(twilioWs: WebSocket) {
    let streamSid: string | null = null;
    let elevenLabsWs: WebSocket | null = null;

    twilioWs.on('message', (data: string) => {
        const message = JSON.parse(data);

        switch (message.event) {
            case 'connected':
                console.log('📞 Twilio stream connected');
                break;

            case 'start':
                streamSid = message.start.streamSid;
                console.log('🎙️ Call started - StreamSid:', streamSid);

                // Connect to ElevenLabs
                elevenLabsWs = connectToElevenLabs(
                    process.env.ELEVENLABS_AGENT_ID!,
                    process.env.ELEVENLABS_API_KEY!
                );

                // Set up bidirectional audio bridge
                setupElevenLabsHandlers(elevenLabsWs, twilioWs, streamSid!);
                break;

            case 'media':
                // Forward caller's audio to ElevenLabs
                if (elevenLabsWs?.readyState === WebSocket.OPEN) {
                    elevenLabsWs.send(JSON.stringify({
                        user_audio_chunk: message.media.payload
                    }));
                }
                break;

            case 'stop':
                console.log('🛑 Call ended');
                elevenLabsWs?.close();
                break;
        }

    });


    twilioWs.on('close', () => {
        elevenLabsWs?.close();
    });
}

function setupElevenLabsHandlers(
    elevenLabsWs: WebSocket,
    twilioWs: WebSocket,
    streamSid: string
) {

    elevenLabsWs.on('message', (data: string) => {
        const message = JSON.parse(data);


        switch (message.type) {
            case 'audio':
                // Send AI audio back to caller
                if (message.audio_event?.audio_base_64) {
                    twilioWs.send(JSON.stringify({
                        event: 'media',
                        streamSid: streamSid,
                        media: {
                            payload: message.audio_event.audio_base_64
                        }
                    }));
                }
                break;

            case 'user_transcript':
                console.log('👤 User:', message.user_transcription_event.user_transcript
                );
                break;

            case 'agent_response':
                console.log('🤖 AI:', message.agent_response_event?.agent_response);
                break;

            case 'conversation_initiation_metadata':
                const meta = message.conversation_initiation_metadata_event;
                console.log(`✅ ElevenLabs ready (in: ${meta.user_input_audio_format}, out: ${meta.agent_output_audio_format})`);
                break;


        }
    });

    elevenLabsWs.on('error', (error) => {
        console.error('❌ ElevenLabs error:', error);
    });

    elevenLabsWs.on('close', () => {
        console.log('🔌 ElevenLabs disconnected');
    });
}




// Function to make outbound call
async function makeCall(to: string): Promise<void> {
    try {
        const call = await twilioClient.calls.create({
            to: to,
            from: process.env.TWILIO_PHONE_NUMBER!,
            url: `${process.env.NGROK_URL}/voice`,
        });
        console.log(`Call initiated! SID: ${call.sid}`);
    } catch (error) {
        console.error("Error making call:", error);
    }
}

// Endpoint to trigger the outbound call
app.get("/make-call", (req: Request, res: Response) => {
    makeCall(process.env.MY_PHONE_NUMBER!);
    res.send("Call initiated");
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket endpoint: ws://localhost:${PORT}/media-stream`);
});
