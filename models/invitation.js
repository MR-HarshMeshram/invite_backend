const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    invitedBy: {
      type: String,
      required: true,
      trim: true,
    },
    eventPrivacy: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },
    invitationImage: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    eventMedia: [
      {
        public_id: String,
        url: String,
      },
    ],
    // You might want to add a reference to the user who created the invitation
    // createdBy: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User",
    //   required: true,
    // },
    createdByEmail: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const Invitation = mongoose.model("Invitation", invitationSchema);

module.exports = Invitation;
