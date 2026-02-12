import WebSocket from 'ws';

export function connectToElevenLabs(agentId: string, apiKey: string): WebSocket {
    const url = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;

    const ws = new WebSocket(url, {
        headers: {
            'xi-api-key': apiKey,
        },
    });

    ws.on('open', () => {
        console.log('✅ Connected to ElevenLabs');

        // 🔥 IMPORTANT: Force Twilio-compatible audio (μ-law 8kHz)
        ws.send(
            JSON.stringify({
                type: 'conversation_initiation_client_data',
                // conversation_config_override: {
                //     agent: {
                //         language: 'en',
                //     },
                // },
            })
        );
    });

    ws.on('error', (error) => {
        console.error('❌ ElevenLabs WebSocket error:', error);
    });

    ws.on('close', (code, reason) => {
        console.log(`🔌 ElevenLabs disconnected with code: ${code}, reason: ${reason}`);
    });

    // Keep-alive ping
    const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
        } else {
            clearInterval(pingInterval);
        }
    }, 10000); // Ping every 10 seconds

    ws.on('close', () => clearInterval(pingInterval));

    return ws;
}
