const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VisitorInfo = sequelize.define('VisitorInfo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    sessionId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        index: true
    },
    ipHash: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Hashed IP for privacy'
    },
    country: {
        type: DataTypes.STRING(2),
        allowNull: true,
        index: true
    },
    countryName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true
    },
    region: {
        type: DataTypes.STRING,
        allowNull: true
    },
    timezone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    device: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'mobile, tablet, desktop'
    },
    browser: {
        type: DataTypes.STRING,
        allowNull: true
    },
    browserVersion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    os: {
        type: DataTypes.STRING,
        allowNull: true
    },
    osVersion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    language: {
        type: DataTypes.STRING(10),
        allowNull: true,
        index: true
    },
    screenResolution: {
        type: DataTypes.STRING,
        allowNull: true
    },
    userAgent: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'visitor_info',
    timestamps: true,
    indexes: [
        {
            fields: ['country', 'createdAt']
        },
        {
            fields: ['device', 'createdAt']
        }
    ]
});

module.exports = VisitorInfo;
