import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });
let sockets = [];

wss.on("connection", (ws) => {
    sockets.push(ws);

    ws.on("close", () => {
        // Remove the closed socket from the list
        sockets = sockets.filter(socket => socket !== ws);
    });

    ws.on("message", (data) => {
        try {
            const parsedData = JSON.parse(data);
            console.log(parsedData);

            switch (parsedData.event) {
                case "SUBMISSION":
                    sockets.forEach((socket) => {
                        if (socket.readyState === ws.OPEN) {
                            socket.send(JSON.stringify({
                                event: "SUBMISSION_SUCCESS",
                                data: parsedData
                            }));
                        }
                    });
                    break;
            }
        } catch (error) {
            console.error("Error parsing message:", error);
        }
    });

    ws.on("error", (err) => {
        console.error("WebSocket error:", err);
    });
});

console.log("WebSocket server running on ws://localhost:8080");
