import express, { Request, Response } from "express"
import bodyParser from "body-parser"
import { WebSocketServer, WebSocket } from "ws"
import http from "http" // Import HTTP module

const app = express()
app.use(bodyParser.json())

const PORT = process.env.PORT || 8080 // Use Render’s public port

// Create HTTP server
const server = http.createServer(app)

// Attach WebSocket to the same HTTP server
const wss = new WebSocketServer({ server })

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

// Webhook handler
app.post(
  "/webhook-handler",
  async (req: Request, res: Response): Promise<void> => {
    if (req.query.validationToken) {
      console.log(" Received validation token:", req.query.validationToken)
      res.status(200).send(req.query.validationToken)
      return
    }

    const notifications = req.body?.value
    if (!notifications || !Array.isArray(notifications)) {
      res.status(400).send("Invalid notification format")
      return
    }

    notifications.forEach(notification => {
      console.log("📨 New Notification Received:", notification)

      if (notification.resourceData) {
        console.log("🆕 Updated Thread Data:", notification.resourceData)

        // Notify all connected WebSocket clients
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

    res.status(200).send("✅ Received")
  }
)

// Start the combined HTTP & WebSocket server
server.listen(PORT, () => console.log(` Server running on port ${PORT}`))
