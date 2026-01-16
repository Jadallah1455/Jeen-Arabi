const { Op } = require('sequelize');
const { Review, User, Story } = require('../models/associations');

/**
 * Create a new review (supports both authenticated and guest users)
 */
const createReview = async (req, res) => {
    try {
        const { storyId, type, rating, comment, guestName, guestAvatar } = req.body;
        const userId = req.user?.id || null; // Optional for guests

        // Validation
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        if (type === 'story' && !storyId) {
            return res.status(400).json({ message: 'Story ID is required for story reviews' });
        }

        // For guest users, require name and avatar
        if (!userId && (!guestName || !guestAvatar)) {
            return res.status(400).json({ message: 'Guest name and avatar are required' });
        }

        // Check if registered user already reviewed this story
        if (userId && type === 'story') {
            const existingReview = await Review.findOne({
                where: { userId, storyId, type: 'story' }
            });
            
            if (existingReview) {
                return res.status(400).json({ message: 'You have already reviewed this story' });
            }
        }

        // Determine display name
        const displayName = userId ? req.user.username : guestName;

        // Create review
        const review = await Review.create({
            userId,
            storyId: type === 'story' ? storyId : null,
            type,
            rating,
            comment,
            guestName: userId ? null : guestName,
            guestAvatar: userId ? null : guestAvatar,
            userName: displayName,
            isApproved: false
        });

        res.status(201).json({
            message: 'Review submitted successfully! It will be published after approval.',
            review
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ message: 'Failed to create review' });
    }
};

/**
 * Get reviews for a specific story
 */
const getStoryReviews = async (req, res) => {
    try {
        const { id } = req.params;

        const reviews = await Review.findAll({
            where: {
                storyId: id,
                type: 'story',
                isApproved: true
            },
            include: [{
                model: User,
                attributes: ['id', 'username']
            }],
            order: [['createdAt', 'DESC']]
        });

        // Calculate average rating
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        res.json({
            reviews,
            totalReviews: reviews.length,
            averageRating: Math.round(avgRating * 10) / 10
        });
    } catch (error) {
        console.error('Get story reviews error:', error);
        res.status(500).json({ message: 'Failed to fetch reviews' });
    }
};

/**
 * Get featured platform testimonials
 */
const getPlatformReviews = async (req, res) => {
    try {
        const reviews = await Review.findAll({
            where: {
                type: 'platform',
                isApproved: true,
                isFeatured: true
            },
            include: [{
                model: User,
                attributes: ['id', 'username']
            }],
            order: [['createdAt', 'DESC']],
            limit: 15 // For testimonials carousel
        });

        res.json(reviews);
    } catch (error) {
        console.error('Get platform reviews error:', error);
        res.status(500).json({ message: 'Failed to fetch testimonials' });
    }
};

/**
 * Get all reviews for admin
 */
const getAllReviews = async (req, res) => {
    try {
        const { approved, type } = req.query;
        const where = {};

        if (approved !== undefined) {
            where.isApproved = approved === 'true';
        }
        if (type) {
            where.type = type;
        }

        const reviews = await Review.findAll({
            where,
            include: [
                {
                    model: User,
                    attributes: ['id', 'username', 'email']
                },
                {
                    model: Story,
                    attributes: ['id', 'title'],
                    required: false
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(reviews);
    } catch (error) {
        console.error('Get all reviews error:', error);
        res.status(500).json({ message: 'Failed to fetch reviews' });
    }
};

/**
 * Approve a review (Admin)
 */
const approveReview = async (req, res) => {
    try {
        const { id } = req.params;

        const review = await Review.findByPk(id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        review.isApproved = true;
        await review.save();

        res.json({ message: 'Review approved successfully', review });
    } catch (error) {
        console.error('Approve review error:', error);
        res.status(500).json({ message: 'Failed to approve review' });
    }
};

/**
 * Reject a review (Admin)
 */
const rejectReview = async (req, res) => {
    try {
        const { id } = req.params;

        const review = await Review.findByPk(id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        review.isApproved = false;
        await review.save();

        res.json({ message: 'Review rejected successfully', review });
    } catch (error) {
        console.error('Reject review error:', error);
        res.status(500).json({ message: 'Failed to reject review' });
    }
};

/**
 * Toggle featured status (Admin)
 */
const toggleFeature = async (req, res) => {
    try {
        const { id } = req.params;

        const review = await Review.findByPk(id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        review.isFeatured = !review.isFeatured;
        await review.save();

        res.json({ 
            message: `Review ${review.isFeatured ? 'featured' : 'unfeatured'} successfully`,
            review 
        });
    } catch (error) {
        console.error('Toggle feature error:', error);
        res.status(500).json({ message: 'Failed to toggle feature' });
    }
};

/**
 * Delete a review (Admin)
 */
const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;

        const review = await Review.findByPk(id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        await review.destroy();
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ message: 'Failed to delete review' });
    }
};

module.exports = {
    createReview,
    getStoryReviews,
    getPlatformReviews,
    getAllReviews,
    approveReview,
    rejectReview,
    toggleFeature,
    deleteReview
};
