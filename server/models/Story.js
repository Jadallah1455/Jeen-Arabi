const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// --- دوال الحماية (مهمة جداً لمنع الانهيار) ---
const parseJsonSafely = (value) => {
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }
    return Array.isArray(value) ? value : [];
};

const parseJsonObjectSafely = (value) => {
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch (e) {
            return {};
        }
    }
    return value || {};
};

const Story = sequelize.define('Story', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
        // ضمان أن العنوان كائن دائماً
        get() { return parseJsonObjectSafely(this.getDataValue('title')); }
    },
    description: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
        // ضمان أن الوصف كائن دائماً
        get() { return parseJsonObjectSafely(this.getDataValue('description')); }
    },
    availableLanguages: {
        type: DataTypes.JSON,
        defaultValue: [],
        get() { return parseJsonSafely(this.getDataValue('availableLanguages')); }
    },
    coverImage: {
        type: DataTypes.STRING,
        allowNull: false,
        // إصلاح روابط الصور (HTTP -> HTTPS)
        get() {
            const rawValue = this.getDataValue('coverImage');
            if (rawValue && rawValue.startsWith('http://')) {
                return rawValue.replace('http://', 'https://');
            }
            return rawValue;
        }
    },
    pdfUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        // إصلاح روابط PDF (HTTP -> HTTPS)
        get() {
            const rawValue = this.getDataValue('pdfUrl');
            if (rawValue && rawValue.startsWith('http://')) {
                return rawValue.replace('http://', 'https://');
            }
            return rawValue;
        }
    },
    ageGroup: {
        type: DataTypes.STRING,
        defaultValue: '3-5'
    },
    categoryLabel: {
        type: DataTypes.STRING,
        defaultValue: 'English'
    },
    // --- هنا كان سبب المشكلة (إضافة get) ---
    tags: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        // هذا السطر يحل مشكلة (tags.map is not a function)
        get() { return parseJsonSafely(this.getDataValue('tags')); }
    },
    categories: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        // هذا السطر يحل مشكلة الصفحة البيضاء في المكتبة
        get() { return parseJsonSafely(this.getDataValue('categories')); }
    },
    pages: {
        type: DataTypes.JSON,
        defaultValue: [],
        get() { return parseJsonSafely(this.getDataValue('pages')); }
    },
    // ------------------------------------
    views: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    downloads: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // --- Quiz Data (New) ---
    quizData: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        get() { return parseJsonSafely(this.getDataValue('quizData')); }
    }
});

module.exports = Story;
