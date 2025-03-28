import { createClient } from "redis";

// Create Redis client
const subscriber = createClient();

subscriber.on("error", (err) => {
    console.error("Redis client error:", err);
});

// Create WebSocket connection
const socket = new WebSocket('ws://localhost:8080');

// Handle WebSocket events
socket.addEventListener('open', () => {
    console.log("WebSocket connection established!");
    socket.send(JSON.stringify({ msg: "subscriber connected" }));
});

socket.addEventListener('message', (event) => {
    console.log('Message from server:', event.data);
});

socket.addEventListener('close', (event) => {
    console.log('WebSocket connection closed:', event.code, event.reason);
});

socket.addEventListener('error', (error) => {
    console.error('WebSocket error:', error);
});

// ✅ THIS is the correct usage in Redis v4+
async function main() {
    try {
        await subscriber.connect();
        console.log("Subscriber connected successfully!");

        // You need to use subscriber.subscribe(channel, listener)
        await subscriber.subscribe("submission", (message) => {
            console.log("Message received from Redis:", message);

            // Check if WebSocket is ready before sending
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    event: "SUBMISSION",
                    data: message
                }));
            } else {
                console.warn("WebSocket not open. Message not sent.");
            }
        });

    } catch (error) {
        console.error("Error connecting subscriber:", error);
    }
}

// Graceful shutdown (optional)
process.on('SIGINT', async () => {
    console.log("Shutting down...");
    await subscriber.quit();
    socket.close();
    process.exit(0);
});

// Start it
main();
