const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');

// Define allowed form sources
const allowedSources = ['popup', 'homepage', 'about'];

// POST /api/subscribe - Newsletter popup form
router.post('/', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required.' });

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existing = await Subscriber.findOne({ email: normalizedEmail, source: 'popup' });
    if (existing) {
      return res.status(409).json({ message: 'Email already subscribed via popup.' });
    }

    const newSubscriber = new Subscriber({ email: normalizedEmail, source: 'popup' });
    await newSubscriber.save();

    res.status(201).json({
      message: 'Subscribed successfully via popup!',
      subscriber: newSubscriber
    });
  } catch (err) {
    console.error('Popup Subscription Error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/subscribe/homepage - For homepage, about, etc.
router.post('/homepage', async (req, res) => {
  const { email, source } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required.' });

  const normalizedEmail = email.trim().toLowerCase();
  const formSource = source?.trim().toLowerCase() || 'homepage';

  if (!allowedSources.includes(formSource)) {
    return res.status(400).json({ message: `Invalid source: ${formSource}` });
  }

  try {
    const existing = await Subscriber.findOne({ email: normalizedEmail, source: formSource });
    if (existing) {
      return res.status(409).json({
        message: `Email already subscribed via ${formSource}.`
      });
    }

    const newSubscriber = new Subscriber({ email: normalizedEmail, source: formSource });
    await newSubscriber.save();

    res.status(201).json({
      message: `Subscribed successfully via ${formSource}!`,
      subscriber: newSubscriber
    });
  } catch (err) {
    console.error(`${formSource} Subscription Error:`, err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/subscribe - Admin route to fetch all subscribers
router.get('/', async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    res.json(subscribers);
  } catch (err) {
    console.error('Fetch Subscribers Error:', err);
    res.status(500).json({ message: 'Failed to fetch subscribers.' });
  }
});

module.exports = router;
