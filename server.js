const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const cors = require("cors"); // Import cors
const http = require("http"); // Import http
const WebSocket = require("ws"); // Import WebSocket
require("dotenv").config();

const app = express();
const server = http.createServer(app); // Create HTTP server
const wss = new WebSocket.Server({ server }); // Create WebSocket server

const Media = require("./models/Media"); // Import Media model
const Invitation = require("./models/invitation"); // Import Invitation model

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
    server.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
  });

// WebSocket connection handling
wss.on('connection', ws => {
  console.log('Client connected');

  ws.on('message', async message => {
    try {
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.type === 'react') {
        const { mediaId, reactionType } = parsedMessage;

        // Update reaction in the database
        const media = await Media.findById(mediaId);
        if (media) {
          media.reactions[reactionType] = (media.reactions[reactionType] || 0) + 1;
          await media.save();

          // Broadcast updated reactions to all connected clients
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'reactionUpdate', mediaId, reactions: media.reactions }));
            }
          });
        }
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
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
app.use("/media", require("./routes/mediaRoutes")); // Add media routes
// Removed the duplicate app.listen as it's now inside the mongoose.connect block
// Keep-Alive Ping
// ======================
// setInterval(() => {
//   axios.get("https://invite-backend-vk36.onrender.com/")
//     .then(() => console.log("✅ Keep-alive ping sent"))
//     .catch(err => console.error("❌ Keep-alive ping failed:", err.message));
// }, 30 * 1000); // every 30 seconds