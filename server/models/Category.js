const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// --- دالة مساعدة لضمان تحويل النص إلى كائن ---
// هذه الدالة هي الحل السحري لمشكلتك
const parseJsonSafely = (value) => {
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch (e) {
            // إذا فشل التحويل، نرجع كائن فارغ لتجنب توقف الموقع
            return {};
        }
    }
    // إذا كان كائناً بالفعل، نرجعه كما هو
    return value || {};
};

const Category = sequelize.define('Category', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
        // --- إضافة Getter ---
        // هذا يجبر السيكوالايز على تحويل النص المخزن في قاعدة البيانات
        // إلى كائن جافاسكريبت حقيقي قبل إرساله للفرونت إند
        get() {
            const rawValue = this.getDataValue('name');
            return parseJsonSafely(rawValue);
        }
    },
    description: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
        // --- إضافة Getter للوصف أيضاً ---
        get() {
            const rawValue = this.getDataValue('description');
            return parseJsonSafely(rawValue);
        }
    }
});

module.exports = Category;
