const { sequelize } = require('./config/db');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const createUser = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');

        const username = 'jadallah';
        const password = 'Jad$$1455';
        const email = 'jadallah@jeen-arabi.com'; // Generated email
        const role = 'admin';

        // Check if user exists
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            console.log('User already exists. Updating password...');
            existingUser.password = password;
            existingUser.role = role;
            await existingUser.save();
            console.log('User updated successfully.');
        } else {
            await User.create({
                username,
                email,
                password,
                role
            });
            console.log('User created successfully.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error creating user:', error);
        process.exit(1);
    }
};

createUser();
