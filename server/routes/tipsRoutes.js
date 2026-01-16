const express = require('express');
const router = express.Router();
const { getTips, addTip, updateTip, deleteTip, updateAllTips } = require('../controllers/tipsController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes require admin authentication
router.use(protect, admin);

router.get('/', getTips);
router.post('/', addTip);
router.put('/bulk', updateAllTips); // Bulk update (must be before :id)
router.put('/:id', updateTip);
router.delete('/:id', deleteTip);

module.exports = router;
