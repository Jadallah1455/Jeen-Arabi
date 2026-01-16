const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Subscriber = sequelize.define('Subscriber', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    ageGroupPreference: {
        type: DataTypes.STRING,
        defaultValue: 'All'
    },
    languagePreference: {
        type: DataTypes.STRING,
        defaultValue: 'en'
    },
    gdprConsent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    subscribedAt: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    }
});

module.exports = Subscriber;
