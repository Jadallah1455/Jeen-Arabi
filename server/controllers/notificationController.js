const { Notification } = require('../models/associations');

const { Op } = require('sequelize');

// @desc    Get user notifications
// @route   GET /api/users/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        // Auto-cleanup: Delete story notifications older than 5 days
        const fiveDaysAgo = new Date(new Date() - 5 * 24 * 60 * 60 * 1000);
        await Notification.destroy({
            where: {
                userId,
                type: 'story',
                isRead: false,
                createdAt: { [Op.lt]: fiveDaysAgo }
            }
        });

        const notifications = await Notification.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: 20
        });
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark notification as read
// @route   PATCH /api/users/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOne({
            where: { id, userId }
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.isRead = true;
        await notification.save();

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete notification
// @route   DELETE /api/users/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findOne({
            where: { id, userId }
        });

        if (!notification) {
            console.log(`[Notification] Deletion failed: Not found (ID: ${id}, User: ${userId})`);
            return res.status(404).json({ message: 'Notification not found' });
        }

        await notification.destroy();
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a system notification (Internal use or Admin)
const createNotification = async (userId, data) => {
    try {
        await Notification.create({
            userId,
            ...data
        });
        return true;
    } catch (error) {
        console.error('Error creating notification:', error);
        return false;
    }
};

// @desc    Mark all notifications as read
// @route   POST /api/users/notifications/mark-all-read
// @access  Private
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await Notification.update(
            { isRead: true },
            { where: { userId, isRead: false } }
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification
};
