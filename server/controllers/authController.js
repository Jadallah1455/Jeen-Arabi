const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createNotification } = require('./notificationController');
const dnsHelper = require('dns').promises;

const DISPOSABLE_DOMAINS = [
    'mailinator.com', 'temp-mail.org', 'guerrillamail.com', '10minutemail.com',
    'trashmail.com', 'yopmail.com', 'dispostable.com', 'getnada.com',
    'sharklasers.com', 'guerrillamailblock.com', 'pokemail.net', 'spam4.me'
];

const validateEmail = async (email) => {
    // 1. Regex Validation
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) return { valid: false, message: 'Invalid email format' };

    const domain = email.split('@')[1].toLowerCase();

    // 2. Block Disposable Email Providers
    if (DISPOSABLE_DOMAINS.includes(domain)) {
        return { valid: false, message: 'Disposable email addresses are not allowed. Please use a real email.' };
    }

    // 3. Domain DNS Check (MX records)
    try {
        const mx = await dnsHelper.resolveMx(domain);
        if (!mx || mx.length === 0) return { valid: false, message: 'This email domain does not exist or cannot receive mail.' };
        return { valid: true };
    } catch (error) {
        // Fallback: if MX check fails, it might just be a domain without MX but with A record (sometimes valid)
        // However, for most real emails, MX is a must.
        return { valid: false, message: 'Email domain is unreachable or has no mail servers.' };
    }
};

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const { valid, message } = await validateEmail(email);
        if (!valid) {
            return res.status(400).json({ message });
        }

        // Password complexity validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character'
            });
        }

        const userExists = await User.findOne({ where: { email } });

        if (userExists) {
            return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
        }

        // Check if username already exists
        const usernameExists = await User.findOne({ where: { username } });
        if (usernameExists) {
            return res.status(400).json({ message: 'اسم المستخدم مستخدم بالفعل' });
        }

        const user = await User.create({
            username,
            email,
            password, // Hook handles hashing
            role: 'user' // Default role
        });

        if (user) {
            // Trigger Welcome Notification
            await createNotification(user.id, {
                titleAr: 'أهلاً بك في جين عربي! ✨',
                titleEn: 'Welcome to Jeen Arabi! ✨',
                titleFr: 'Bienvenue chez Jeen Arabi ! ✨',
                messageAr: 'نحن متحمسون لانضمامك إلينا. ابدأ رحلة القراءة السحرية الآن!',
                messageEn: 'We are excited to have you on board. Start your magical reading journey now!',
                messageFr: 'Nous sommes ravis de vous accueillir. Commencez votre voyage de lecture magique dès maintenant !',
                type: 'system'
            });

            res.status(201).json({
                _id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                token: generateToken(user.id),
                points: user.points,
                level: user.level
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const { Op } = require('sequelize');

        // Allow login with email OR username
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: email },
                    { username: email }
                ]
            }
        });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                token: generateToken(user.id),
                points: user.points,
                level: user.level
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (user) {
            user.username = req.body.username || user.username;
            user.email = req.body.email || user.email;
            user.avatar = req.body.avatar || user.avatar;

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                avatar: updatedUser.avatar,
                role: updatedUser.role,
                token: generateToken(updatedUser.id),
                points: updatedUser.points,
                level: updatedUser.level
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update user password
// @route   PUT /api/auth/password
// @access  Private
const updateUserPassword = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        const { oldPassword, newPassword } = req.body;

        if (user && (await user.matchPassword(oldPassword))) {
            user.password = newPassword; // Hook handles hashing
            await user.save();
            res.json({ message: 'Password updated successfully' });
        } else {
            res.status(401).json({ message: 'Invalid current password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete own account
// @route   DELETE /api/auth/me
// @access  Private
const deleteMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        await user.destroy();
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    updateUserProfile,
    updateUserPassword,
    deleteMe
};
