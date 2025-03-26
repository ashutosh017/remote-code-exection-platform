import express from 'express'
import { createClient } from 'redis'
import cors from 'cors'
const client = createClient()
const app = express();
app.use(cors())
app.use(express.json());

client.on("error",(err)=>{
    console.log("redis client error: ",err)
})

app.post("/submit",async(req,res)=>{
    try {
        const {code, language, problemId} = req.body
        await client.lPush("problems",JSON.stringify({code,language,problemId}))
        res.status(200).json({
            msg:"submission recieved and stored"
        })
    } catch (error) {
        console.log("error storing submission: ",error)
        res.status(500).json({
            msg:"error storing submission"
        })
    }
})

async function startServer(){
    await client.connect();try {
        
        console.log("connected to redis client")
        app.listen(3000,()=>{
            console.log("app is listening on port 3000")
        })
    } catch (error) {
        console.log("error connecting redis client: ",error)
    }

}

startServer()