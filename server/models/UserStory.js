const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const UserStory = sequelize.define('UserStory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    isFavorite: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    lastRead: {
        type: DataTypes.DATE,
        allowNull: true
    },
    timesRead: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    lastPageReached: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    totalReadingTime: {
        type: DataTypes.INTEGER,
        defaultValue: 0 // In seconds
    },
    isCompleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

module.exports = UserStory;
