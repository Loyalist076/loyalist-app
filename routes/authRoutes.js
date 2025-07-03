
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// Register Route
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine admin approval status
    let isAdminApproved = true;
    if (role === 'admin') {
      const existingAdmin = await User.findOne({ role: 'admin' });
      if (existingAdmin) {
        isAdminApproved = false; // Require approval
      }
    }

    // Create and save new user with role and approval flag
    const newUser = new User({ name, email, password: hashedPassword, role, isAdminApproved });
    await newUser.save();

    if (role === 'admin' && !isAdminApproved) {
      return res.status(200).json({ message: 'Admin registration pending approval.' });
    }

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Check admin approval
    if (user.role === 'admin' && !user.isAdminApproved) {
      return res.status(403).json({ message: 'Admin approval pending' });
    }

    // Return user role for redirecting
    res.status(200).json({
      message: 'Login successful',
      role: user.role,
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
