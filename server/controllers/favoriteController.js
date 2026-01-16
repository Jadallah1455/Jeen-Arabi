const { Favorite, Story } = require('../models/associations');

// @desc    Toggle favorite (add/remove)
// @route   POST /api/favorites/:storyId
// @access  Private
const toggleFavorite = async (req, res) => {
    try {
        const userId = req.user.id;
        const { storyId } = req.params;

        const existingFavorite = await Favorite.findOne({
            where: { userId, storyId }
        });

        if (existingFavorite) {
            await existingFavorite.destroy();
            return res.json({ message: 'Removed from favorites', isFavorite: false });
        } else {
            await Favorite.create({ userId, storyId });
            return res.json({ message: 'Added to favorites', isFavorite: true });
        }
    } catch (error) {
        console.error('Toggle favorite error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user favorites
// @route   GET /api/favorites
// @access  Private
const getFavorites = async (req, res) => {
    try {
        const userId = req.user.id;

        const favorites = await Favorite.findAll({
            where: { userId },
            include: [{
                model: Story,
                attributes: ['id', 'title', 'coverImage', 'ageGroup', 'categoryLabel']
            }],
            order: [['createdAt', 'DESC']]
        });

        // Flatten the structure for easier frontend consumption
        const stories = favorites.map(f => f.Story).filter(Boolean);

        res.json(stories);
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Check if story is favorite
// @route   GET /api/favorites/check/:storyId
// @access  Private
const checkFavorite = async (req, res) => {
    try {
        const userId = req.user.id;
        const { storyId } = req.params;

        const count = await Favorite.count({
            where: { userId, storyId }
        });

        res.json({ isFavorite: count > 0 });
    } catch (error) {
        console.error('Check favorite error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    toggleFavorite,
    getFavorites,
    checkFavorite
};
