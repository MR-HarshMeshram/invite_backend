const Invitation = require("../models/invitation");
const cloudinary = require("cloudinary").v2;

exports.createInvitation = async (req, res) => {
  try {
    const { eventName, location, invitedBy, eventPrivacy, createdByEmail, description, dateTime } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No media file uploaded." });
    }

    console.log("Multer processed file:", req.file);

    // Convert dateTime string to Date object
    const eventDateTime = new Date(dateTime);

    // req.file contains the uploaded file info from multer-storage-cloudinary
    const invitationImage = {
      public_id: req.file.filename,
      url: req.file.path,
      resource_type: req.file.resource_type || 'image', // Store whether it's an image or video
    };

    console.log('File upload details:', {
      filename: req.file.filename,
      path: req.file.path,
      resource_type: req.file.resource_type,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype
    });

    // Log all data being sent to Invitation.create for debugging
    console.log("Data for Invitation.create:", {
      eventName,
      location,
      description,
      dateTime: eventDateTime,
      invitedBy,
      eventPrivacy,
      invitationImage,
      createdByEmail,
    });

    const invitation = await Invitation.create({
      eventName,
      location,
      description,
      dateTime: eventDateTime, // Save the dateTime as a Date object
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

exports.updateInvitation = async (req, res) => {
  try {
    const { id } = req.params; // Get invitation ID from URL parameters
    const { eventName, location, invitedBy, eventPrivacy, description, dateTime } = req.body;

    const invitation = await Invitation.findById(id);

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found." });
    }

    // Authorization check: ensure only the creator can update the invitation
    if (invitation.createdByEmail !== req.user.email) {
      return res.status(403).json({ message: "You are not authorized to update this invitation." });
    }

    // Update fields if they are provided in the request body
    if (eventName) invitation.eventName = eventName;
    if (location) invitation.location = location;
    if (description) invitation.description = description;
    if (dateTime) invitation.dateTime = new Date(dateTime); // Convert to Date object
    if (invitedBy) invitation.invitedBy = invitedBy;
    if (eventPrivacy) invitation.eventPrivacy = eventPrivacy;

    // Handle media update if a new file is uploaded
    if (req.file) {
      // Delete old media from Cloudinary if it exists
      if (invitation.invitationImage && invitation.invitationImage.public_id) {
        await cloudinary.uploader.destroy(invitation.invitationImage.public_id, {
          resource_type: invitation.invitationImage.resource_type || 'image'
        });
      }
      // Set new media details
      invitation.invitationImage = {
        public_id: req.file.filename,
        url: req.file.path,
        resource_type: req.file.resource_type || 'image', // Store whether it's an image or video
      };
    }

    await invitation.save();

    res.status(200).json({
      message: "Invitation updated successfully!",
      invitation,
    });
  } catch (error) {
    console.error("Error updating invitation:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getTotalInvitations = async (req, res) => {
  try {
    const totalInvitations = await Invitation.countDocuments();
    res.status(200).json({ totalInvitations });
  } catch (error) {
    console.error("Error fetching total invitations:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getPrivateInvitationsCount = async (req, res) => {
  try {
    const privateInvitations = await Invitation.countDocuments({ eventPrivacy: 'private' });
    res.status(200).json({ privateInvitations });
  } catch (error) {
    console.error("Error fetching private invitations count:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getPublicInvitationsCount = async (req, res) => {
  try {
    const publicInvitations = await Invitation.countDocuments({ eventPrivacy: 'public' });
    res.status(200).json({ publicInvitations });
  } catch (error) {
    console.error("Error fetching public invitations count:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getPhotoUploadsCount = async (req, res) => {
  try {
    // This will count documents where invitationImage.url exists
    // For a more accurate count of *all* photos, you might need to adjust your schema
    // to have a separate photo collection or an array on the invitation model.
    const photoUploads = await Invitation.countDocuments({ "invitationImage.url": { $exists: true } });
    res.status(200).json({ photoUploads });
  } catch (error) {
    console.error("Error fetching photo uploads count:", error);
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
    if (invitation.createdByEmail !== req.user.email) { // Assuming req.user is populated by authentication middleware
      return res.status(403).json({ message: "You are not authorized to delete this invitation." });
    }

    // Delete main media from Cloudinary
    if (invitation.invitationImage && invitation.invitationImage.public_id) {
      await cloudinary.uploader.destroy(invitation.invitationImage.public_id, {
        resource_type: invitation.invitationImage.resource_type || 'image'
      });
    }

    // Delete all event media from Cloudinary
    if (invitation.eventMedia && invitation.eventMedia.length > 0) {
      for (const media of invitation.eventMedia) {
        if (media.public_id) {
          await cloudinary.uploader.destroy(media.public_id, {
            resource_type: media.resource_type || 'image'
          });
        }
      }
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
      resource_type: file.resource_type || 'image', // Store whether it's an image or video
      original_filename: file.originalname, // Store original filename for display
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
    await cloudinary.uploader.destroy(mediaToDelete.public_id, {
      resource_type: mediaToDelete.resource_type || 'image'
    });
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

    res.status(200).json(invitation);
  } catch (error) {
    console.error("Error fetching invitation by ID:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAcceptedInvitationsByUser = async (req, res) => {
  try {
    const { userEmail } = req.params; // Get userEmail from URL parameters

    if (!userEmail) {
      return res.status(400).json({ message: "User email parameter is required." });
    }

    const invitations = await Invitation.find({ acceptedUsers: userEmail });

    if (!invitations || invitations.length === 0) {
      return res.status(404).json({ message: "No accepted invitations found for this user." });
    }

    res.status(200).json({
      message: "Accepted invitations fetched successfully!",
      invitations,
    });
  } catch (error) {
    console.error("Error fetching accepted invitations by user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.acceptInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body; // Assuming the user's email is sent in the request body

    const invitation = await Invitation.findById(id);

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found." });
    }

    // Add user to acceptedUsers if not already present
    if (!invitation.acceptedUsers.includes(userEmail)) {
      invitation.acceptedUsers.push(userEmail);
    }

    // Remove user from declinedUsers if present
    invitation.declinedUsers = invitation.declinedUsers.filter(email => email !== userEmail);

    await invitation.save();

    res.status(200).json({ message: "Invitation accepted successfully!", invitation });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.declineInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body; // Assuming the user's email is sent in the request body

    const invitation = await Invitation.findById(id);

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found." });
    }

    // Add user to declinedUsers if not already present
    if (!invitation.declinedUsers.includes(userEmail)) {
      invitation.declinedUsers.push(userEmail);
    }

    // Remove user from acceptedUsers if present
    invitation.acceptedUsers = invitation.acceptedUsers.filter(email => email !== userEmail);

    await invitation.save();

    res.status(200).json({ message: "Invitation declined successfully!", invitation });
  } catch (error) {
    console.error("Error declining invitation:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update reaction for an invitation
exports.updateReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { reactionType, userEmail } = req.body;

    if (!reactionType || !userEmail) {
      return res.status(400).json({ message: "Reaction type and user email are required." });
    }

    const validReactions = ['cheer', 'groove', 'chill', 'hype'];
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({ message: "Invalid reaction type." });
    }

    const invitation = await Invitation.findById(id);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found." });
    }

    const reaction = invitation.reactions[reactionType];
    
    // Check if user already reacted with this type
    const userIndex = reaction.users.indexOf(userEmail);
    
    if (userIndex === -1) {
      // User hasn't reacted yet, add them
      reaction.users.push(userEmail);
      reaction.count += 1;
    } else {
      // User already reacted, remove their reaction
      reaction.users.splice(userIndex, 1);
      reaction.count -= 1;
    }

    await invitation.save();

    res.status(200).json({
      message: "Reaction updated successfully!",
      invitation: {
        _id: invitation._id,
        reactions: invitation.reactions
      }
    });
  } catch (error) {
    console.error("Error updating reaction:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get feed data (public invitations + accepted private invitations for user)
exports.getFeedData = async (req, res) => {
  try {
    const { userEmail } = req.query;

    // Get all public invitations
    const publicInvitations = await Invitation.find({ eventPrivacy: 'public' })
      .sort({ createdAt: -1 })
      .limit(20);

    let feedData = [...publicInvitations];

    // If user is logged in, also get their accepted private invitations
    if (userEmail) {
      const privateInvitations = await Invitation.find({
        eventPrivacy: 'private',
        acceptedUsers: userEmail
      })
      .sort({ createdAt: -1 })
      .limit(10);

      feedData = [...publicInvitations, ...privateInvitations];
    }

    // Sort all feed data by creation date
    feedData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      message: "Feed data fetched successfully!",
      feedData
    });
  } catch (error) {
    console.error("Error fetching feed data:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
