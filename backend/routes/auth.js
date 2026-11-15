const crypto = require('crypto');
const nodemailer = require('nodemailer');
const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // false for port 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    },
    connectionTimeout: 10000 // 10 seconds timeout so it fails fast instead of hanging
});

// Register a New User (/api/auth/register)
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email is already registered!' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });

        await newUser.save();

        res.status(201).json({ 
            message: 'User registered successfully!',
            user: { id: newUser._id, username: newUser.username, email: newUser.email }
        });

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

// ROUTE 2: User Login (/api/auth/login)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });

        res.json({
            message: 'Logged in successfully!',
            token,
            user: { id: user._id, username: user.username, email: user.email }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login.' });
    }
}); // FIXED: Closed the login route properly here

// ROUTE 3: Forgot Password (/api/auth/forgot-password)
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User with this email does not exist' });
        }

        // Generate a secure random token
        const token = crypto.randomBytes(32).toString('hex');

        // Save token and set expiration to 15 minutes from now
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
        await user.save();

        // Create reset URL pointing to your frontend (update domain later if needed)
        const resetUrl = `https://personal-task-manager-1-mwy4.onrender.com/reset-password.html?token=${token}`;

        // Send the email
        await transporter.sendMail({
            to: user.email,
            subject: 'Password Reset Request',
            html: `<p>You requested a password reset. Click this <a href="${resetUrl}">link</a> to reset your password. This link expires in 15 minutes.</p>`,
        });

        res.status(200).json({ message: 'Password reset email sent successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error sending email' });
    }
});

// ROUTE 4: Reset Password (/api/auth/reset-password)
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Find user by token and ensure token hasn't expired
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() } // $gt means "greater than now" (not expired)
        });

        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Clear out the reset token fields so they can't be reused
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ message: 'Password has been successfully updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error resetting password' });
    }
});

module.exports = router;