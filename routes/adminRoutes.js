const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, isAdmin } = require('../middleware/auth');

// Get all pending admin requests (admin only)
router.get('/pending-admins', authenticate, isAdmin, async (req, res) => {
  try {    
    const pendingAdmins = await User.find({ role: 'admin', isAdminApproved: false });
    res.json(pendingAdmins);
  } catch (err) {
    console.error('Error fetching pending admins:', err);
    res.status(500).json({ message: 'Error fetching pending admins' });
  }
});

// Approve a pending admin (admin only)
router.put('/approve-admin/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedAdmin = await User.findByIdAndUpdate(id, { isAdminApproved: true }, { new: true });

    if (!updatedAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json({ message: 'Admin approved successfully' });
  } catch (err) {
    console.error('Error approving admin:', err);
    res.status(500).json({ message: 'Error approving admin' });
  }
});

module.exports = router;
