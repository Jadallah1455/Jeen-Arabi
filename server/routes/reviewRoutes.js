const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    createReview,
    getStoryReviews,
    getPlatformReviews,
    getAllReviews,
    approveReview,
    rejectReview,
    toggleFeature,
    deleteReview
} = require('../controllers/reviewController');

// Public routes
router.get('/story/:id', getStoryReviews);
router.get('/platform/featured', getPlatformReviews);

// Review creation (public, but can detect if user is logged in)
const optionalAuth = (req, res, next) => {
    // Try to authenticate, but don't fail if no token
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        return protect(req, res, next);
    }
    next();
};

router.post('/', optionalAuth, createReview);

// Admin routes
router.get('/all', protect, admin, getAllReviews); // For ReviewsManagement component
router.get('/admin/all', protect, admin, getAllReviews); // Backward compatibility
router.patch('/:id/approve', protect, admin, approveReview);
router.patch('/:id/reject', protect, admin, rejectReview);
router.patch('/:id/feature', protect, admin, toggleFeature);
router.delete('/:id', protect, admin, deleteReview);

module.exports = router;
