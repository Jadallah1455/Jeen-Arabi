const express = require('express');
const router = express.Router();
const {
    addSubscriber,
    getSubscribers,
} = require('../controllers/subscriberController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .post(addSubscriber)
    .get(protect, admin, getSubscribers);

module.exports = router;
