const mongoose = require('mongoose');

const InvitationReactionSchema = new mongoose.Schema({
  invitationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invitation',
    required: true,
    unique: true // Each invitation should have only one reaction document
  },
  cheer: {
    type: Number,
    default: 0
  },
  groove: {
    type: Number,
    default: 0
  },
  chill: {
    type: Number,
    default: 0
  },
  hype: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('InvitationReaction', InvitationReactionSchema);
