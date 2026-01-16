const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    toggleFavorite,
    getFavorites,
    checkFavorite
} = require('../controllers/favoriteController');

router.use(protect);

router.post('/:storyId', toggleFavorite);
router.get('/', getFavorites);
router.get('/check/:storyId', checkFavorite);

module.exports = router;
