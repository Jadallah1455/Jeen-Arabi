const { Setting } = require('../models/associations');

// @desc    Get all settings
// @route   GET /api/settings
// @access  Public
const getSettings = async (req, res) => {
    try {
        const settings = await Setting.findAll();
        res.json(settings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update settings in bulk
// @route   POST /api/settings/bulk
// @access  Private/Admin
const updateSettingsBulk = async (req, res) => {
    try {
        const { settings } = req.body; // { key: value, ... }

        const promises = Object.entries(settings).map(([key, value]) => {
            return Setting.upsert({ key, value });
        });

        await Promise.all(promises);
        res.json({ message: 'Settings updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getSettings,
    updateSettingsBulk
};
