const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getVisitorStats,
    getGeographicDistribution,
    getDeviceBreakdown,
    getTrafficSources,
    getTopStories,
    getSocialMediaStats,
    trackShare
} = require('../controllers/analyticsController');

// All analytics routes require admin authentication except trackShare
router.get('/stats', protect, admin, getVisitorStats);
router.get('/geographic', protect, admin, getGeographicDistribution);
router.get('/devices', protect, admin, getDeviceBreakdown);
router.get('/traffic-sources', protect, admin, getTrafficSources);
router.get('/top-stories', protect, admin, getTopStories);
router.get('/social-media', protect, admin, getSocialMediaStats);

// Public endpoint for tracking shares (rate limited separately)
router.post('/track-share', trackShare);

module.exports = router;
