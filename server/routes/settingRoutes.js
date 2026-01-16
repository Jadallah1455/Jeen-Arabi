const express = require('express');
const router = express.Router();
const { getSettings, updateSettingsBulk } = require('../controllers/settingController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', getSettings);
router.post('/bulk', protect, admin, updateSettingsBulk);

module.exports = router;
