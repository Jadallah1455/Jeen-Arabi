const express = require('express');
const router = express.Router();
const {
    getStories,
    getStoryById,
    createStory,
    updateStory,
    deleteStory,
    incrementViews,
    incrementDownloads,
    getRecommendations,
    getSimilarStories
} = require('../controllers/storyController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(getStories)
    .post(protect, admin, createStory);

// Specific routes MUST come before dynamic :id routes
router.get('/recommendations', protect, getRecommendations);

router.route('/:id')
    .get(getStoryById)
    .put(protect, admin, updateStory)
    .delete(protect, admin, deleteStory);

router.get('/:id/similar', getSimilarStories);

router.patch('/:id/view', incrementViews);
router.patch('/:id/download', incrementDownloads);

module.exports = router;
