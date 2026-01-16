const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// --- نفس دالة الحماية التي استخدمناها في التصنيفات ---
const parseJsonSafely = (value) => {
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch (e) {
            return {};
        }
    }
    return value || {};
};

const Tag = sequelize.define('Tag', {
    name: {
        type: DataTypes.JSON, // { en: "Nature", ar: "طبيعة" }
        allowNull: false,
        // --- إضافة Getter لضمان قراءة الاسم ككائن وليس نص ---
        get() {
            const rawValue = this.getDataValue('name');
            return parseJsonSafely(rawValue);
        }
    },
    slug: {
        type: DataTypes.STRING,
        unique: true
    },
    count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
});

module.exports = Tag;
