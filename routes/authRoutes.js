const express = require("express");
const passport = require("passport");
const { googleCallbackHandler, refreshToken, logoutUser, me } = require("../controllers/authControllers");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// Step 1: start Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

// Step 2: Google redirects here
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/", session: false }),
  googleCallbackHandler
);

// JWT-protected route example
router.get("/me", requireAuth, me);

// Refresh access token using httpOnly refresh cookie
router.post("/refresh", refreshToken);

// Logout → clears refresh cookie
router.post("/logout", logoutUser);

module.exports = router;
