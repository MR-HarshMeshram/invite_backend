const express = require('express');
const { getMediaGallery } = require('../controllers/mediaController');
const { requireAuth } = require('../middleware/authMiddleware'); // Assuming you have an auth middleware

const router = express.Router();

router.get('/gallery', requireAuth, getMediaGallery);

module.exports = router;
