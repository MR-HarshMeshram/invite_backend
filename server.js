const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const cors = require("cors"); // Import cors
require("dotenv").config();

const app = express();

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
    app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
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

// Removed the duplicate app.listen as it's now inside the mongoose.connect block
