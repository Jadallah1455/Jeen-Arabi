const express = require('express');
const router = express.Router();
const {
    toggleFavorite,
    getFavorites,
    recordReading,
    updateReadingProgress,
    getHistory,
    getAllUsers,
    deleteUser,
    saveQuizResult
} = require('../controllers/userController');
const {
    saveDesign,
    getMyDesigns,
    deleteDesign
} = require('../controllers/designController');
const {
    getNotifications,
    markAsRead,
    deleteNotification
} = require('../controllers/notificationController');
const { protect, admin } = require('../middleware/authMiddleware');

// Diagnostic check to prevent crash if controller fails to load
if (!getNotifications || !deleteNotification) {
    console.error('Critical Error: Notification handlers not found! Check notificationController.js');
}

router.get('/test', (req, res) => res.json({ message: 'User routes are active' }));

router.get('/favorites', protect, getFavorites);
router.post('/favorites/:storyId', protect, toggleFavorite);

router.get('/history', protect, getHistory);
router.post('/history/:storyId', protect, recordReading);
router.put('/history/:storyId/progress', protect, updateReadingProgress);
router.post('/history/:storyId/quiz', protect, saveQuizResult);

router.get('/designs', protect, getMyDesigns);
router.post('/designs', protect, saveDesign);
router.delete('/designs/:id', protect, deleteDesign);

router.get('/notifications', protect, getNotifications);
router.patch('/notifications/:id/read', protect, markAsRead);
router.delete('/notifications/:id', protect, deleteNotification);

// Admin User Management
router.get('/', protect, admin, getAllUsers);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
