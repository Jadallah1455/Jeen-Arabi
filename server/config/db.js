const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbName = process.env.DB_NAME || 'jeen_arabi';
const dbUser = process.env.DB_USER || 'root';
const dbPass = process.env.DB_PASS || '';
const dbHost = process.env.DB_HOST || '127.0.0.1';

const sequelize = new Sequelize(
  dbName,
  dbUser,
  dbPass,
  {
    host: dbHost,
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4'
    },
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true
    }
  }
);

const connectDB = async () => {
  try {
    // Step 1: Create DB if not exists with explicit UTF8MB4 charset
    const connection = await mysql.createConnection({ host: dbHost, user: dbUser, password: dbPass });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.end();

    // Step 2: Authenticate with Sequelize
    await sequelize.authenticate();
    console.log('MySQL Connected via Sequelize');

    // 🔥 تم التعطيل للأمان في بيئة الإنتاج لمنع خطأ ER_TOO_MANY_KEYS
    // استخدم السكربت SQL_FIX.sql لإضافة الأعمدة يدوياً
    await sequelize.sync({ alter: false, force: false });

    console.log('Database Synced');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

module.exports = { sequelize, connectDB };
