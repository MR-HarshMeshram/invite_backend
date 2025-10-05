const Media = require('../models/Media');
const Invitation = require('../models/Invitation');
const User = require('../models/User');

// @desc    Get all media for gallery (public and accepted private)
// @route   GET /api/media/gallery
// @access  Private (requires authentication to identify accepted invitations)
const getMediaGallery = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available from auth middleware

    // Find public invitations
    const publicInvitations = await Invitation.find({ isPublic: true });

    // Find private invitations the user has accepted
    const userInvitations = await User.findById(userId).select('acceptedInvitations');
    const acceptedPrivateInvitationIds = userInvitations ? userInvitations.acceptedInvitations : [];

    const invitationIds = [...publicInvitations.map(inv => inv._id), ...acceptedPrivateInvitationIds];

    const media = await Media.find({ invitation: { $in: invitationIds } }).populate('uploadedBy', 'name picture');

    res.status(200).json({ media });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getMediaGallery };
