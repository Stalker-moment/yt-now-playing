const express = require("express");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const sendLog = require("./function/sendLog");

// Middleware to allow JSON parsing
app.use(express.json());

// Serve the client HTML page
app.get("/", (req, res) => {
  res.send("halo");
});

// Create HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws, req) => {
  console.log("Client connected");

  // Handle incoming messages on /send
  if (req.url === "/send") {
    ws.on("message", (message) => {
      console.log("Received:", message);
      // Convert message to JSON object
      let data;
      try {
        data = JSON.parse(message);

        // Save new data to JSON file (overwriting old data)
        fs.writeFile("data.json", JSON.stringify(data, null, 2), (err) => {
          if (err) {
            console.error("Error writing file:", err);
          } else {
            console.log("Data saved to data.json");
          }
        });
      } catch (error) {
        // Log error without terminating the application
        console.error("Invalid JSON received:", error.message);
      }
    });
  }

  // Handle /receive connection
  if (req.url === "/receive") {
    const intervalId = setInterval(async () => {
      const data = await sendLog();
      ws.send(data);
    }, 1000);

    ws.on("close", () => {
      console.log("WebSocket client disconnected from /receive");
      clearInterval(intervalId);
    });
  }

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
