const express = require("express");
const { createInvitation, getInvitationsByEmail, getAllInvitations, deleteInvitation, uploadMedia, getInvitationById, deleteMedia, acceptInvitation, declineInvitation, updateInvitation } = require("../controllers/invitationControllers");
const upload = require("../middleware/upload");
const { requireAuth } = require("../middleware/authMiddleware"); // Uncomment if authentication is needed

const router = express.Router();

// Create Invitation Route
router.post("/create", upload.single("invitationImage"), createInvitation);

// Get Invitations by Email Route
router.get("/user/:email", getInvitationsByEmail); // Added new route

// Get All Public Invitations Route
router.get("/all", getAllInvitations); // New route to fetch all public invitations

// Get Invitation by ID Route
router.get("/:id", getInvitationById); // New route to fetch a single invitation by ID

// Delete Invitation Route
router.delete("/:id", requireAuth, deleteInvitation); // New route to delete an invitation by ID

// Upload Media for Invitation Route
router.post("/media/upload", requireAuth, upload.array("media", 3), uploadMedia);

// Delete Media from Invitation Route
router.delete("/media/:invitationId/*publicId", requireAuth, deleteMedia);

// Accept Invitation Route
router.post("/:id/accept", acceptInvitation);

// Decline Invitation Route
router.post("/:id/decline", declineInvitation);

// Update Invitation Route
router.put("/:id", requireAuth, upload.single("invitationImage"), updateInvitation);

module.exports = router;
