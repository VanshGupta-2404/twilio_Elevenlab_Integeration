# AI Voice Agent with Twilio & ElevenLabs

This project implements an AI-powered voice agent using Twilio for telephony and ElevenLabs for conversational AI. It allows you to make and receive calls where an AI assistant converses with the caller in natural language.

## Features

-   **Inbound & Outbound Calls**: Handle incoming calls and initiate outbound calls via Twilio.
-   **Real-time AI Conversation**: Integrates with ElevenLabs Conversational AI for low-latency voice interactions.
-   **WebSocket Streaming**: Uses WebSockets to stream audio between Twilio and ElevenLabs.

## Prerequisites

-   [Node.js](https://nodejs.org/) (v16 or higher)
-   [Twilio Account](https://www.twilio.com/) (Account SID, Auth Token, Phone Number)
-   [ElevenLabs Account](https://elevenlabs.io/) (Agent ID, API Key)
-   [Ngrok](https://ngrok.com/) (For local development/testing)

## Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/VanshGupta-2404/twilio_Elevenlab_Integeration.git
    cd twilio_Elevenlab_Integeration
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory and add the following:
    ```env
    # Twilio Configuration
    TWILIO_ACCOUNT_SID=your_twilio_account_sid
    TWILIO_AUTH_TOKEN=your_twilio_auth_token
    TWILIO_PHONE_NUMBER=your_twilio_phone_number

    # ElevenLabs Configuration
    ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id
    ELEVENLABS_API_KEY=your_elevenlabs_api_key

    # Your Personal Phone Number (for testing outbound calls)
    MY_PHONE_NUMBER=your_personal_phone_number

    # Ngrok URL (Update this every time you restart ngrok)
    NGROK_URL=https://your-ngrok-url.ngrok-free.app

    # Server Port
    PORT=3000
    ```

## Running Locally

1.  **Start Ngrok:**
    Start a tunnel to expose port 3000 to the internet.
    ```bash
    ngrok http 3000
    ```
    Copy the forwarding URL (e.g., `https://xxxx.ngrok-free.app`).

2.  **Update Configuration:**
    -   Update `NGROK_URL` in your `.env` file.
    -   In the **Twilio Console** > **Phone Numbers** > **Manage** > **Active numbers**, update the **Webhook URL** for "A call comes in" to:
        `[Your-Ngrok-URL]/voice`

3.  **Start the Server:**
    ```bash
    npm run dev
    ```

## Usage

-   **Inbound Call:** Call your Twilio phone number. The AI agent will answer and start a conversation.
-   **Outbound Call:** To trigger an outbound call to your personal number (configured in `.env`), visit:
    `http://localhost:3000/make-call`

## Author

**Vansh Gupta**
