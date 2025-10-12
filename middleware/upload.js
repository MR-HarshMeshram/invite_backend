const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "my_app_uploads", // folder in cloudinary
    allowed_formats: ["jpg", "png", "jpeg", "mp4", "mov", "avi", "wmv"],
    resource_type: "auto", // This allows Cloudinary to automatically detect and handle both images and videos
  },
});

const upload = multer({ storage });

module.exports = upload;
