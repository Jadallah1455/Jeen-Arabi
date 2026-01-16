const Subscriber = require('../models/Subscriber');

// @desc    Add new subscriber
// @route   POST /api/subscribers
// @access  Public
const addSubscriber = async (req, res) => {
    const { name, email, ageGroupPreference, languagePreference, gdprConsent } = req.body;

    try {
        const exists = await Subscriber.findOne({ where: { email } });
        if (exists) {
            return res.status(400).json({ message: 'Email already subscribed' });
        }

        const subscriber = await Subscriber.create({
            name,
            email,
            ageGroupPreference,
            languagePreference,
            gdprConsent
        });

        res.status(201).json(subscriber);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all subscribers
// @route   GET /api/subscribers
// @access  Private (Admin)
const getSubscribers = async (req, res) => {
    try {
        const subscribers = await Subscriber.findAll();
        res.status(200).json(subscribers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    addSubscriber,
    getSubscribers,
};
