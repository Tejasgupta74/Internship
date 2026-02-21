const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// list users (admin only)
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
router.get('/users', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  try {
    // include lastLogin and createdAt but hide password
    // Do not return admin accounts in this list for security/audit reasons
    const users = await User.find({ role: { $ne: 'admin' } }).select('-password');
    return res.json(users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin || null
    })));
  } catch (err) {
    console.error('users list error', err);
    if (!res.headersSent) return res.status(500).json({ error: 'server' });
  }
});

// Helper function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// register (signup)
router.post('/register', async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password required' });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'invalid email format' });
    }

    // Check if trying to register as admin
    if (role === 'admin') {
      const existingAdmin = await User.findOne({ role: 'admin' });
      if (existingAdmin) {
        return res.status(403).json({ error: 'You are not authorized to sign up as admin. Admin account already exists.' });
      }
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'email already registered' });

    // create user (password hashing handled by pre-save hook)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      role: role || 'student',
      password
    });

    const payload = { userId: user._id.toString(), role: user.role, name: user.name, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // send response and immediately return
    res.status(201).json({ token, user: payload });
    // return to ensure no further res.* executed in this request handler
    // (emails are sent asynchronously below)
    // Note: do NOT try to send another response after this point
    (async () => {
      try {
        if (!global.transporter) {
          console.warn('transporter not configured — skipping signup email');
          return;
        }
        const info = await global.transporter.sendMail({
          from: process.env.SIGNUP_FROM || process.env.SMTP_USER,
          to: user.email,
          subject: 'Welcome to MyApp!',
          text: `Hello ${user.name || ''},\n\nThank you for signing up.`
        });
        console.log('Signup email sent (non-fatal):', info && info.messageId ? info.messageId : info);
        if (typeof require('nodemailer').getTestMessageUrl === 'function') {
          console.log('Preview URL:', require('nodemailer').getTestMessageUrl(info));
        }
      } catch (mailErr) {
        console.error('Signup email error (non-fatal):', mailErr);
      }
    })();
    return;
  } catch (err) {
    console.error('register error', err);
    if (!res.headersSent) return res.status(500).json({ error: 'server error' });
    // if headers already sent, we only log the error (can't send another response)
  }
});

// login - send OTP
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'user not found' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'invalid credentials' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.loginOTP = otp;
    user.loginOTPExpires = Date.now() + 600000; // 10 minutes
    await user.save();

    // Send OTP email (non-blocking)
    (async () => {
      try {
        if (!global.transporter) {
          console.warn('transporter not configured — skipping login OTP email');
          return;
        }
        const info = await global.transporter.sendMail({
          from: process.env.SMTP_USER || (global.transporter && global.transporter._ethereal ? global.transporter._ethereal.user : undefined),
          to: user.email,
          subject: 'Login OTP Verification',
          html: `
            <h2>Login Verification</h2>
            <p>Hello ${user.name},</p>
            <p>Your OTP for login verification is:</p>
            <h1 style="color: #4F46E5; font-size: 32px; letter-spacing: 8px;">${otp}</h1>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you didn't attempt to login, please secure your account immediately.</p>
          `
        });
        console.log('Login OTP email sent:', info && info.messageId ? info.messageId : info);
        if (typeof require('nodemailer').getTestMessageUrl === 'function') {
          console.log('Preview URL:', require('nodemailer').getTestMessageUrl(info));
        }
      } catch (mailErr) {
        console.error('Login OTP email error (non-fatal):', mailErr);
      }
    })();

    return res.json({ message: 'OTP sent to your email', requiresOTP: true, email: user.email });
  } catch (err) {
    console.error('login error', err);
    if (!res.headersSent) return res.status(500).json({ error: 'server error' });
  }
});

// Verify login OTP
router.post('/verify-login-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'email and otp required' });

    const user = await User.findOne({
      email: email.toLowerCase(),
      loginOTP: otp,
      loginOTPExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'invalid or expired OTP' });
    }

    // Clear OTP
    user.loginOTP = undefined;
    user.loginOTPExpires = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const payload = { userId: user._id.toString(), role: user.role, name: user.name, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.json({ token, user: payload });
  } catch (err) {
    console.error('verify login OTP error', err);
    if (!res.headersSent) return res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;

// Delete user (admin only) - send email notification to removed user
router.delete('/users/:id', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'user not found' });

    // Prevent deleting admin accounts
    if (user.role === 'admin') return res.status(403).json({ error: 'cannot delete admin account' });

    // Prevent admin from deleting themselves
    if (req.user && String(req.user.userId) === String(userId)) return res.status(400).json({ error: 'cannot remove yourself' });

    // remove user
    await User.deleteOne({ _id: userId });

    // send removal email (best-effort)
    (async () => {
      try {
        if (!global.transporter) {
          console.warn('transporter not configured — skipping removal email');
          return;
        }
        const info = await global.transporter.sendMail({
          from: process.env.REMOVED_FROM || process.env.SMTP_USER,
          to: user.email,
          subject: 'Your account has been removed',
          text: `Hello ${user.name || ''},\n\nYour account on our platform has been removed by an administrator. If you think this is a mistake, please contact support.`
        });
        console.log('Removal email sent (non-fatal):', info && info.messageId ? info.messageId : info);
      } catch (mailErr) {
        console.error('Removal email error (non-fatal):', mailErr);
      }
    })();

    return res.json({ ok: true });
  } catch (err) {
    console.error('delete user error', err);
    return res.status(500).json({ error: 'server error' });
  }
});

// Forgot password - send OTP to email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If that email exists, an OTP has been sent' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 600000; // 10 minutes
    await user.save();

    // Send email with OTP
    (async () => {
      try {
        if (!global.transporter) {
          console.warn('transporter not configured — skipping OTP email');
          return;
        }
        const info = await global.transporter.sendMail({
          from: process.env.SMTP_USER || (global.transporter && global.transporter._ethereal ? global.transporter._ethereal.user : undefined),
          to: user.email,
          subject: 'Password Reset OTP',
          html: `
            <h2>Password Reset Request</h2>
            <p>Hello ${user.name},</p>
            <p>Your OTP for password reset is:</p>
            <h1 style="color: #4F46E5; font-size: 32px; letter-spacing: 8px;">${otp}</h1>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          `
        });
        console.log('OTP email sent:', info && info.messageId ? info.messageId : info);
        if (typeof require('nodemailer').getTestMessageUrl === 'function') {
          console.log('Preview URL:', require('nodemailer').getTestMessageUrl(info));
        }
      } catch (mailErr) {
        console.error('OTP email error (non-fatal):', mailErr);
      }
    })();

    return res.json({ message: 'If that email exists, an OTP has been sent' });
  } catch (err) {
    console.error('forgot password error', err);
    return res.status(500).json({ error: 'server error' });
  }
});

// Verify OTP and reset password
router.post('/verify-otp-reset', async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ error: 'email, otp and password required' });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'invalid or expired OTP' });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = password;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send confirmation email
    (async () => {
      try {
        if (!global.transporter) {
          console.warn('transporter not configured — skipping confirmation email');
          return;
        }
        const info = await global.transporter.sendMail({
          from: process.env.SMTP_USER || (global.transporter && global.transporter._ethereal ? global.transporter._ethereal.user : undefined),
          to: user.email,
          subject: 'Password Reset Successful',
          text: `Hello ${user.name},\n\nYour password has been successfully reset. If you didn't make this change, please contact support immediately.`
        });
        console.log('Password reset confirmation email sent:', info && info.messageId ? info.messageId : info);
      } catch (mailErr) {
        console.error('Confirmation email error (non-fatal):', mailErr);
      }
    })();

    return res.json({ message: 'password reset successful' });
  } catch (err) {
    console.error('verify OTP reset error', err);
    return res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;