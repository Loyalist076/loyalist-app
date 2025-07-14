const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');
const sendWelcomeEmail = require('../utils/emailService'); // ✅ Import email service

// ✅ Allowed sources for form submissions
const allowedSources = [
  'popup',
  'homepage',
  'about',
  'loveleand-project',
  'potential',
  'company',
  'directors',
  'corporate',
  'statements',
  'news',
  'disclaimers',
  'projects',
  'investor',
  'contact'
];

// 🔥 Reusable function to handle subscription
async function handleSubscription(email, source, res) {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Check if already subscribed
    const existing = await Subscriber.findOne({ email: normalizedEmail, source });
    if (existing) {
      return res.status(409).json({ message: `Email already subscribed via ${source}.` });
    }

    // Save subscriber
    const newSubscriber = new Subscriber({ email: normalizedEmail, source });
    await newSubscriber.save();

    // Send welcome email (non-blocking)
    sendWelcomeEmail(normalizedEmail)
      .then(() => {
        console.log(`📧 Welcome email sent successfully to ${normalizedEmail}`);
      })
      .catch(err => {
        console.error(`❌ Failed to send welcome email to ${normalizedEmail}:`, err.message);
      });

    // Respond to client
    res.status(201).json({
      message: `Subscribed successfully via ${source}!`,
      subscriber: newSubscriber
    });
  } catch (err) {
    console.error(`${source} Subscription Error:`, err);
    if (err.code === 11000) {
      return res.status(409).json({ message: `Email already subscribed via ${source}.` });
    }
    res.status(500).json({ message: 'Server error while subscribing.' });
  }
}

// ✅ POST /api/subscribe - Newsletter popup form
router.post('/', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  await handleSubscription(email, 'popup', res);
});

// ✅ POST /api/subscribe/homepage - Used by other forms
router.post('/homepage', async (req, res) => {
  const { email, source } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  const formSource = source?.trim().toLowerCase() || 'homepage';
  if (!allowedSources.includes(formSource)) {
    return res.status(400).json({ message: `Invalid source: ${formSource}` });
  }

  await handleSubscription(email, formSource, res);
});

// ✅ GET /api/subscribe - Admin fetch all subscribers
router.get('/', async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    res.json(subscribers);
  } catch (err) {
    console.error('Fetch Subscribers Error:', err);
    res.status(500).json({ message: 'Failed to fetch subscribers.' });
  }
});

// ✅ DELETE /api/subscribe/:id - Delete subscriber by ID
router.delete('/:id', async (req, res) => {
  try {
    console.log('🔍 Attempting to delete subscriber with ID:', req.params.id);
    const deleted = await Subscriber.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Subscriber not found' });
    }

    res.json({ message: 'Subscriber deleted successfully' });
  } catch (err) {
    console.error('❌ Delete Error:', err.message);
    res.status(500).json({ message: 'Failed to delete subscriber', error: err.message });
  }
});

module.exports = router;