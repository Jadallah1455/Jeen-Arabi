const express = require('express');
const router = express.Router();
const {
    loginUser,
    registerUser,
    getMe,
    updateUserProfile,
    updateUserPassword,
    deleteMe
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateUserProfile);
router.put('/password', protect, updateUserPassword);
router.delete('/me', protect, deleteMe);

// Temporary Setup Route
// Setup admin route removed for security

module.exports = router;
