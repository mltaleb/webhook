import express, { Request, Response } from "express"
import bodyParser from "body-parser"
import { WebSocketServer, WebSocket } from "ws" // Ensure correct import

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
    // Step 1: Handle Microsoft Graph Validation Request
    if (req.query.validationToken) {
      console.log("Received validation token:", req.query.validationToken)
      res.status(200).send(req.query.validationToken) // Respond with token in plain text
      return
    }

    // Step 2: Handle actual notifications
    const notifications = req.body?.value
    if (!notifications || !Array.isArray(notifications)) {
      res.status(400).send("Invalid notification format")
      return
    }

    notifications.forEach(notification => {
      console.log(" New Notification Received:", notification)

      if (notification.resourceData) {
        console.log(" Updated Thread Data:", notification.resourceData)

        // Notify all connected clients (frontend)
        clients.forEach(client => {
          client.send(
            JSON.stringify({
              type: "NEW_MESSAGE",
              data: notification.resourceData,
            })
          )
        })
      }
    })

    res.status(200).send("Received")
  }
)

// Start the server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(` Webhook server running on port ${PORT}`))
