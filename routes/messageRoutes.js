const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Handler for saving contact form messages
async function handleContactForm(req, res, source) {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (
      typeof name !== 'string' || name.trim().length < 2 ||
      typeof email !== 'string' || !/.+@.+\..+/.test(email.trim()) ||
      typeof subject !== 'string' || subject.trim() === '' ||
      typeof message !== 'string' || message.trim().length < 5
    ) {
      return res.status(400).json({ message: 'Please provide valid inputs for all fields.' });
    }

    const newMessage = new Message({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      source
    });

    await newMessage.save();
    res.status(201).json({ message: 'Message sent successfully.' });

  } catch (err) {
    console.error(`❌ Error in POST /api/messages/contact/${source}:`, err.message);
    res.status(500).json({ message: 'Internal server error.', error: err.message });
  }
}

// ✅ POST routes for all forms
router.post('/contact/index', (req, res) => handleContactForm(req, res, 'index'));
router.post('/contact/page', (req, res) => handleContactForm(req, res, 'contact'));
router.post('/contact/business', (req, res) => handleContactForm(req, res, 'business'));

// ✅ GET route to fetch all messages
router.get('/', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (err) {
    console.error('❌ Error fetching messages:', err.message);
    res.status(500).json({ message: 'Failed to fetch messages.', error: err.message });
  }
});

module.exports = router;
