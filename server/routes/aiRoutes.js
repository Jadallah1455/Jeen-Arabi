const express = require('express');
const router = express.Router();
const { generateStory } = require('../controllers/aiController');
const { protect, admin } = require('../middleware/authMiddleware');

// Allow all users (including guests) to generate stories
router.post('/generate-story', generateStory);

module.exports = router;
