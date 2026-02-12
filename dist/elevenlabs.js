"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToElevenLabs = connectToElevenLabs;
const ws_1 = __importDefault(require("ws"));
function connectToElevenLabs(agentId, apiKey) {
    const url = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;
    const ws = new ws_1.default(url, {
        headers: {
            'xi-api-key': apiKey,
        },
    });
    ws.on('open', () => {
        console.log('✅ Connected to ElevenLabs');
        // 🔥 IMPORTANT: Force Twilio-compatible audio (μ-law 8kHz)
        ws.send(JSON.stringify({
            type: 'conversation_initiation_client_data',
            conversation_config_override: {
                agent: {
                    language: 'en',
                },
                audio: {
                    input_format: 'ulaw_8000',
                    output_format: 'ulaw_8000',
                },
                tts: {
                    output_format: 'ulaw_8000',
                },
            },
        }));
    });
    ws.on('error', (error) => {
        console.error('❌ ElevenLabs WebSocket error:', error);
    });
    ws.on('close', () => {
        console.log('🔌 ElevenLabs disconnected');
    });
    return ws;
}
