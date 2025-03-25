import express, { Request, Response } from "express"
import bodyParser from "body-parser"
import { WebSocketServer, WebSocket } from "ws"

const app = express()
app.use(bodyParser.json())

const wss = new WebSocketServer({ port: 8080 }) // WebSocket server

// Store connected clients
const clients: Set<WebSocket> = new Set()

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected")
  clients.add(ws)

  ws.on("close", () => {
    console.log("Client disconnected")
    clients.delete(ws)
  })
})

app.post(
  "/webhook-handler",
  async (req: Request, res: Response): Promise<void> => {
    const { validationToken, value } = req.body

    // ✅ Step 1: Handle validation request
    if (validationToken) {
      console.log("🔹 Responding to Microsoft Graph validation request")
      res.status(200).send(validationToken) // Echo back the token
      return
    }

    // ✅ Step 2: Handle notifications
    if (!value || !value.length) {
      res.status(400).send("No data received")
      return
    }

    console.log("🔔 New Message Notification:", value)

    // Notify all connected clients (frontend)
    clients.forEach(client => {
      client.send(JSON.stringify({ type: "NEW_MESSAGE", data: value }))
    })

    res.status(200).send("Received")
  }
)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`🚀 Webhook server running on port ${PORT}`))
