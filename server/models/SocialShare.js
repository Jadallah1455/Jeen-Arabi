const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SocialShare = sequelize.define('SocialShare', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    storyId: {
        type: DataTypes.STRING,
        allowNull: false,
        index: true
    },
    platform: {
        type: DataTypes.ENUM('facebook', 'twitter', 'whatsapp', 'telegram', 'linkedin', 'email', 'copy', 'other'),
        allowNull: false,
        index: true
    },
    clicks: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Number of times the share link was clicked'
    },
    conversions: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Number of visitors who actually viewed the story'
    },
    shareUrl: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id'
        }
    }
}, {
    tableName: 'social_shares',
    timestamps: true,
    indexes: [
        {
            fields: ['storyId', 'platform', 'createdAt']
        },
        {
            fields: ['platform', 'createdAt']
        }
    ]
});

module.exports = SocialShare;
