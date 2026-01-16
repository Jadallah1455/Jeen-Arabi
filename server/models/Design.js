const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Design = sequelize.define('Design', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    authorName: {
        type: DataTypes.STRING
    },
    content: {
        type: DataTypes.JSON, // Stores the pages and elements array
        allowNull: false
    },
    generatedStory: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    previewImage: {
        type: DataTypes.TEXT, // Base64 or URL of the first page
        allowNull: true
    }
});

module.exports = Design;
