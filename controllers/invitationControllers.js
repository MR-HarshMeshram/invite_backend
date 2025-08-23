const Invitation = require("../models/invitation");
const cloudinary = require("cloudinary").v2;

exports.createInvitation = async (req, res) => {
  try {
    const { eventName, location, invitedBy, eventPrivacy, createdByEmail } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded." });
    }

    console.log("Multer processed file:", req.file);

    // req.file contains the uploaded file info from multer-storage-cloudinary
    const invitationImage = {
      public_id: req.file.filename,
      url: req.file.path,
    };

    const invitation = await Invitation.create({
      eventName,
      location,
      invitedBy,
      eventPrivacy,
      invitationImage,
      createdByEmail, // Save the createdByEmail
    });

    res.status(201).json({
      message: "Invitation created successfully!",
      invitation,
    });
  } catch (error) {
    console.error("Error creating invitation:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getInvitationsByEmail = async (req, res) => {
  try {
    const { email } = req.params; // Get email from URL parameters

    if (!email) {
      return res.status(400).json({ message: "Email parameter is required." });
    }

    const invitations = await Invitation.find({ createdByEmail: email });

    if (!invitations || invitations.length === 0) {
      return res.status(404).json({ message: "No invitations found for this email." });
    }

    res.status(200).json({
      message: "Invitations fetched successfully!",
      invitations,
    });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({ eventPrivacy: 'public' }); // Only fetch public invitations

    if (!invitations || invitations.length === 0) {
      return res.status(404).json({ message: "No public invitations found." });
    }

    res.status(200).json({
      message: "Public invitations fetched successfully!",
      invitations,
    });
  } catch (error) {
    console.error("Error fetching all invitations:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteInvitation = async (req, res) => {
  try {
    const { id } = req.params; // Get invitation ID from URL parameters

    const invitation = await Invitation.findById(id);

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found." });
    }

    // Optional: Add a check here if you want to ensure only the creator can delete
    // if (invitation.createdByEmail !== req.user.email) { // Assuming req.user is populated by authentication middleware
    //   return res.status(403).json({ message: "You are not authorized to delete this invitation." });
    // }

    // Delete image from Cloudinary
    if (invitation.invitationImage && invitation.invitationImage.public_id) {
      await cloudinary.uploader.destroy(invitation.invitationImage.public_id);
    }

    // Delete invitation from MongoDB
    await Invitation.findByIdAndDelete(id);

    res.status(200).json({ message: "Invitation deleted successfully!" });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.uploadMedia = async (req, res) => {
  try {
    const { invitationId } = req.body;
    const uploaderEmail = req.user.email; // Assuming req.user is populated by requireAuth

    if (!invitationId) {
      return res.status(400).json({ message: "Invitation ID is required." });
    }

    const invitation = await Invitation.findById(invitationId);

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found." });
    }

    // Authorization check
    if (invitation.createdByEmail !== uploaderEmail) {
      return res.status(403).json({ message: "You are not authorized to upload media for this invitation." });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No media files uploaded." });
    }

    const uploadedMedia = req.files.map(file => ({
      public_id: file.filename,
      url: file.path,
      // You might want to add other details like file type, size, etc.
    }));

    // Append new media to the existing eventMedia array in the invitation
    invitation.eventMedia = invitation.eventMedia ? [...invitation.eventMedia, ...uploadedMedia] : uploadedMedia;

    await invitation.save();

    res.status(200).json({
      message: "Media uploaded successfully!",
      uploadedMedia,
      invitationId: invitation._id,
    });
  } catch (error) {
    console.error("Error uploading media:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteMedia = async (req, res) => {
  try {
    const { invitationId } = req.params;
    let { publicId } = req.params;
    console.log('Backend: req.params received:', req.params);
    console.log('Backend: publicId extracted raw:', publicId);

    // If publicId is an array (due to * in route param), join it to form the full path
    if (Array.isArray(publicId)) {
      publicId = publicId.join('/');
      console.log('Backend: publicId joined:', publicId);
    }

    const deleterEmail = req.user.email; // Assuming req.user is populated by requireAuth

    if (!invitationId || !publicId) {
      return res.status(400).json({ message: "Invitation ID and Public ID are required." });
    }

    const invitation = await Invitation.findById(invitationId);

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found." });
    }
    console.log('Backend: Fetched invitation eventMedia:', invitation.eventMedia);

    // Authorization check
    if (invitation.createdByEmail !== deleterEmail) {
      return res.status(403).json({ message: "You are not authorized to delete media for this invitation." });
    }

    // Delete from Cloudinary
    console.log(`Attempting to delete Cloudinary asset with publicId from params: ${publicId}`);
    // Find the media object in the invitation's eventMedia array to get the correct public_id (without extension)
    const mediaToDelete = invitation.eventMedia.find(media => media.public_id === publicId);

    if (!mediaToDelete) {
      return res.status(404).json({ message: "Media not found in invitation." });
    }

    console.log(`Deleting Cloudinary asset: ${mediaToDelete.public_id}`);
    await cloudinary.uploader.destroy(mediaToDelete.public_id);
    console.log(`Cloudinary asset with publicId: ${mediaToDelete.public_id} deletion attempted.`);

    // Remove from MongoDB invitation's eventMedia array
    const initialMediaCount = invitation.eventMedia.length;
    invitation.eventMedia = invitation.eventMedia.filter(
      (media) => media.public_id !== mediaToDelete.public_id
    );
    const finalMediaCount = invitation.eventMedia.length;
    console.log(`MongoDB: Media array before filter: ${initialMediaCount}, after filter: ${finalMediaCount}`);

    await invitation.save();
    console.log("MongoDB: Invitation saved after media removal.");

    res.status(200).json({ message: "Media deleted successfully!" });
  } catch (error) {
    console.error("Error deleting media:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getInvitationById = async (req, res) => {
  try {
    const { id } = req.params;
    const invitation = await Invitation.findById(id);

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found." });
    }

    res.status(200).json({
      message: "Invitation fetched successfully!",
      invitation,
    });
  } catch (error) {
    console.error("Error fetching invitation by ID:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
