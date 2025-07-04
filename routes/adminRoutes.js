const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all pending admin requests
router.get('/pending-admins', async (req, res) => {
  try {    
    const pendingAdmins = await User.find({ role: 'admin', isAdminApproved: false });
    res.json(pendingAdmins);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pending admins', error: err.message });
  }
});

// Approve a pending admin
router.put('/approve-admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedAdmin = await User.findByIdAndUpdate(id, { isAdminApproved: true }, { new: true });

    if (!updatedAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json({ message: 'Admin approved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error approving admin', error: err.message });
  }
});

module.exports = router;
