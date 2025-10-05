const express = require('express');
const { getMediaGallery } = require('../controllers/mediaController');
const { protect } = require('../middleware/authMiddleware'); // Assuming you have an auth middleware

const router = express.Router();

router.get('/gallery', protect, getMediaGallery);

module.exports = router;
