const { connectDB, sequelize } = require('./config/db');
const User = require('./models/User');
const Story = require('./models/Story');
const Subscriber = require('./models/Subscriber');
const Tag = require('./models/Tag');
require('dotenv').config();

const importData = async () => {
  try {
    await connectDB();

    // Clear existing data
    // force: true drops tables and re-creates them
    await sequelize.sync({ force: true });
    console.log('Database Cleared');

    // Create Admin User
    await User.create({
      username: 'jadallah',
      email: 'admin@jeenarabi.com',
      password: 'Jad$$1455',
      role: 'admin'
    });

    console.log('Admin User Created: jadallah / Jad$$1455');

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();
    await sequelize.drop();
    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
