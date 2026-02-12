"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const ws_1 = require("ws");
const twilio_1 = __importDefault(require("twilio"));
const elevenlabs_1 = require("./elevenlabs");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// WebSocket server for Twilio media streams
const wss = new ws_1.WebSocketServer({ server, path: "/media-stream" });
// Twilio client
const twilioClient = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check
app.get("/", (req, res) => {
    res.send("AI Voice Agent Server Running");
});
// Twilio webhook - returns TwiML for the call
app.post("/voice", (req, res) => {
    console.log("📞 Received voice webhook");
    const response = new twilio_1.default.twiml.VoiceResponse();
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
function handleTwilioConnection(twilioWs) {
    let streamSid = null;
    let elevenLabsWs = null;
    twilioWs.on('message', (data) => {
        const message = JSON.parse(data);
        switch (message.event) {
            case 'connected':
                console.log('📞 Twilio stream connected');
                break;
            case 'start':
                streamSid = message.start.streamSid;
                console.log('🎙️ Call started - StreamSid:', streamSid);
                // Connect to ElevenLabs
                elevenLabsWs = (0, elevenlabs_1.connectToElevenLabs)(process.env.ELEVENLABS_AGENT_ID, process.env.ELEVENLABS_API_KEY);
                // Set up bidirectional audio bridge
                setupElevenLabsHandlers(elevenLabsWs, twilioWs, streamSid);
                break;
            case 'media':
                // Forward caller's audio to ElevenLabs
                if (elevenLabsWs?.readyState === ws_1.WebSocket.OPEN) {
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
function setupElevenLabsHandlers(elevenLabsWs, twilioWs, streamSid) {
    elevenLabsWs.on('message', (data) => {
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
                console.log('👤 User:', message.user_transcription_event.user_transcript);
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
async function makeCall(to) {
    try {
        const call = await twilioClient.calls.create({
            to: to,
            from: process.env.TWILIO_PHONE_NUMBER,
            url: `${process.env.NGROK_URL}/voice`,
        });
        console.log(`Call initiated! SID: ${call.sid}`);
    }
    catch (error) {
        console.error("Error making call:", error);
    }
}
// Endpoint to trigger the outbound call
app.get("/make-call", (req, res) => {
    makeCall(process.env.MY_PHONE_NUMBER);
    res.send("Call initiated");
});
// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket endpoint: ws://localhost:${PORT}/media-stream`);
});
