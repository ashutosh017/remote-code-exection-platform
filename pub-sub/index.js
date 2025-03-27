import { createClient } from "redis";

const subscriber = createClient();
subscriber.on("error",(err)=>{
    console.log("redis client error: ",err)
})

// Creates a new WebSocket connection to the specified URL.
const socket = new WebSocket('ws://localhost:8080');

// Executes when the connection is successfully established.
socket.addEventListener('open',(event)=>{
    console.log("websocket connection established!")
    socket.send(JSON.stringify({
        msg:"subscriber connected "
    }))
})

// Listen for messages and executes when a message is received from the server.
socket.addEventListener('message', event => {
  console.log('Message from server: ', event.data);
});

// Executes when the connection is closed, providing the close code and reason.
socket.addEventListener('close', event => {
  console.log('WebSocket connection closed:', event.code, event.reason);
});

// Executes if an error occurs during the WebSocket communication.
socket.addEventListener('error', error => {
  console.error('WebSocket error:', error);
});


async function main(){
   try {
     await subscriber.connect();
     console.log("subscriber connected successfully!")
     await subscriber.subscribe("submission",(msg)=>{
         console.log("msg recieved: ",msg)
         socket.send(JSON.stringify({
            event:"SUBMISSION",
            data:msg
         }))
     })
   } catch (error) {
    console.log("error connecting subscriber: ",error)
   }

}

main();