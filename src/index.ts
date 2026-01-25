import "dotenv/config";
import express, { Request, Response } from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import twilio from "twilio";

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
wss.on("connection", (ws: WebSocket) => {
    console.log("Twilio media stream connected");

    let streamSid: string | null = null;
    let callSid: string | null = null;

    ws.on("message", (data: Buffer) => {
        const message = JSON.parse(data.toString());

        switch (message.event) {
            case "connected":
                console.log("Stream connected");
                break;
            
            case "start":
                streamSid = message.start.streamSid;
                callSid = message.start.callSid;
                console.log(`Stream started - StreamSid: ${streamSid}`);
                console.log(`CallSid: ${callSid}`);
                console.log("Custom Parameters:", message.start.customParameters);
                break;

            case "media":
                // This is where audio data comes in
                // message.media.payload = base64 encoded audio (mulaw, 8000hz)
                console.log(`Receiving audio chunk #${message.media.chunk}`);
                // Later: forward this to ElevenLabs
                break;

            case "stop":
                console.log("Stream stopped");
                break;
            
            default:
                console.log(`Unknown event: ${message.event}`);
        }
    });

    ws.on("close", () => {
        console.log("WebSocket connection closed");
    });

    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
});

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
