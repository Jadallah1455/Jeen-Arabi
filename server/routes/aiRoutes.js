const express = require('express');
const router = express.Router();
const { generateStory } = require('../controllers/aiController');
const { protect, admin } = require('../middleware/authMiddleware');

// Allow all authenticated users to generate stories
router.post('/generate-story', protect, generateStory);

module.exports = router;
