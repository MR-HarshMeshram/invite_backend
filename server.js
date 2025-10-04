const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const cors = require("cors"); // Import cors
const WebSocket = require('ws'); // Import WebSocket library
const InvitationReaction = require('./models/InvitationReaction'); // Import Reaction model
const Invitation = require('./models/Invitation'); // Import Invitation model
require("dotenv").config();

const app = express();

// Create a WebSocket server instance
const wss = new WebSocket.Server({ noServer: true });

// Store all connected WebSocket clients
const clients = new Set();

wss.on('connection', ws => {
  console.log('Client connected');
  clients.add(ws);

  ws.on('message', async message => {
    console.log(`Received: ${message}`);
    try {
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.type === 'reactionClick') {
        const { invitationId, reactionType } = parsedMessage.payload;

        // Find and update the reaction count in the database
        const updatedReaction = await InvitationReaction.findOneAndUpdate(
          { invitationId },
          { $inc: { [reactionType]: 1 } },
          { upsert: true, new: true }
        );

        // Broadcast the updated reaction counts to all connected clients
        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ 
              type: 'reactionUpdate', 
              payload: { 
                invitationId: updatedReaction.invitationId, 
                [reactionType]: updatedReaction[reactionType]
              }
            }));
          }
        });
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });

  ws.on('error', error => {
    console.error('WebSocket error:', error);
  });
});

// Middleware
app.use(express.json()); // Body parser for JSON
app.use(express.urlencoded({ extended: true })); // Body parser for URL-encoded data
app.use(cors({
  origin: ["http://localhost:5173", "https://invitehub.vercel.app"],
  credentials: true
})); // Configure CORS for your frontend

// MongoDB
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("✅ MongoDB Connected"))
//   .catch(err => console.log(err));
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log("✅ MongoDB connected");
    // Start Server only after MongoDB connection is successful
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

    // Upgrade HTTP server to WebSocket server
    server.on('upgrade', (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, ws => {
        wss.emit('connection', ws, request);
      });
    });
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
  });

// Session
app.use(session({
  secret: "mysecret",
  resave: false,
  saveUninitialized: false,
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());
require("./config/passport")(passport);

// Routes
app.get("/", (req, res) => res.send("🚀 Home Page"));
app.use("/auth", require("./routes/authRoutes"));
app.use("/invitations", require("./routes/invitationRoutes")); // Add invitation routes
app.use("/users", require("./routes/userRoutes")); // Add user routes

// Removed the duplicate app.listen as it's now inside the mongoose.connect block
// Keep-Alive Ping
// ======================
// setInterval(() => {
//   axios.get("https://invite-backend-vk36.onrender.com/")
//     .then(() => console.log("✅ Keep-alive ping sent"))
//     .catch(err => console.error("❌ Keep-alive ping failed:", err.message));
// }, 30 * 1000); // every 30 seconds