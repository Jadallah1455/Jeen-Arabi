const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,  // Now allows guest reviews
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    storyId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'If reviewing a specific story'
    },
    type: {
        type: DataTypes.ENUM('story', 'platform'),
        allowNull: false,
        defaultValue: 'story',
        comment: 'Type of review'
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isApproved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Admin approval before publishing'
    },
    isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Featured in testimonials section'
    },
    // Guest user fields
    guestName: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Name for guest reviewers'
    },
    guestAvatar: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Avatar selection for guest reviewers (avatar-1, avatar-2, etc.)'
    },
    // Cached for performance
    userName: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Cached user/guest name for display'
    }
}, {
    tableName: 'reviews',
    timestamps: true,
    indexes: [
        {
            fields: ['storyId', 'isApproved']
        },
        {
            fields: ['type', 'isFeatured', 'isApproved']
        },
        {
            fields: ['userId']
        }
    ]
});

module.exports = Review;
