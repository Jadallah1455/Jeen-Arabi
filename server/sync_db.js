const { sequelize } = require('./config/db');
require('./models/associations');

const syncDatabase = async () => {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connection successful.');

        console.log('Syncing database schema (alter: true)...');
        // This will add missing columns (like 'pages') without deleting data
        await sequelize.sync({ alter: true });

        console.log('✅ Database synchronized successfully!');
        console.log('The "pages" column has been added to the Stories table.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error syncing database:', error);
        process.exit(1);
    }
};

syncDatabase();
