const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PageVisit = sequelize.define('PageVisit', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    sessionId: {
        type: DataTypes.STRING,
        allowNull: false,
        index: true
    },
    url: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    referrer: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    utmSource: {
        type: DataTypes.STRING,
        allowNull: true,
        index: true
    },
    utmMedium: {
        type: DataTypes.STRING,
        allowNull: true
    },
    utmCampaign: {
        type: DataTypes.STRING,
        allowNull: true
    },
    utmContent: {
        type: DataTypes.STRING,
        allowNull: true
    },
    storyId: {
        type: DataTypes.STRING,
        allowNull: true,
        index: true
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Time spent on page in seconds'
    }
}, {
    tableName: 'page_visits',
    timestamps: true,
    indexes: [
        {
            fields: ['sessionId', 'createdAt']
        },
        {
            fields: ['storyId', 'createdAt']
        },
        {
            fields: ['utmSource', 'createdAt']
        }
    ]
});

module.exports = PageVisit;
