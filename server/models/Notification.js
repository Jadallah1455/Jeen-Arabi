const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    titleAr: {
        type: DataTypes.STRING,
        allowNull: false
    },
    titleEn: {
        type: DataTypes.STRING,
        allowNull: false
    },
    titleFr: {
        type: DataTypes.STRING,
        allowNull: false
    },
    messageAr: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    messageEn: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    messageFr: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        defaultValue: 'info' // 'info', 'success', 'warning', 'story'
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    targetId: {
        type: DataTypes.STRING,
        allowNull: true // Story ID, etc.
    },
    targetType: {
        type: DataTypes.STRING,
        allowNull: true // 'story', 'review', 'system'
    },
    actionUrl: {
        type: DataTypes.STRING,
        allowNull: true // Optional: direct URL to navigate
    }
}, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
});

module.exports = Notification;
