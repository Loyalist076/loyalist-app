const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const Subscription = require('../models/Subscription');
require('dotenv').config();

// 🔐 Mailchimp Config
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX;
const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;

// ✅ POST: Subscribe a new user
router.post('/', async (req, res) => {
  console.log('🔥 /api/subscribe route hit');

  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const existing = await Subscription.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already subscribed' });

    const newSubscriber = new Subscription({ email });
    await newSubscriber.save();
    console.log('✅ Subscriber saved to MongoDB');

    const mailchimpUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`;

    try {
      const mailchimpRes = await axios.post(mailchimpUrl,
        {
          email_address: email,
          status: 'subscribed'
        },
        {
          headers: {
            Authorization: `apikey ${MAILCHIMP_API_KEY}`,
            'Content-Type': 'application/json',
          }
        }
      );

      console.log('✅ Mailchimp response:', mailchimpRes.data);

      res.status(200).json({ message: 'Subscribed and added to Mailchimp audience' });

    } catch (mailchimpErr) {
      console.error('❌ Mailchimp API Error:', mailchimpErr.response?.data || mailchimpErr.message);
      res.status(500).json({
        message: 'Failed to add subscriber to Mailchimp',
        error: mailchimpErr.response?.data?.detail || mailchimpErr.message
      });
    }

  } catch (err) {
    console.error('❌ Subscription error:', err.message);
    res.status(500).json({ message: 'Subscription failed', error: err.message });
  }
});

// ✅ GET: Fetch all subscribers
router.get('/', async (req, res) => {
  try {
    const subscribers = await Subscription.find().sort({ createdAt: -1 });
    res.json(subscribers);
  } catch (error) {
    console.error('❌ Fetch error:', error.message);
    res.status(500).json({ message: 'Failed to fetch subscribers' });
  }
});

// ✅ DELETE: Remove subscriber from MongoDB and Mailchimp
router.delete('/:id', async (req, res) => {
  try {
    const subscriber = await Subscription.findByIdAndDelete(req.params.id);
    if (!subscriber) return res.status(404).json({ message: 'Subscriber not found' });

    const emailHash = crypto
      .createHash('md5')
      .update(subscriber.email.toLowerCase())
      .digest('hex');

    const mailchimpDeleteUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members/${emailHash}`;

    try {
      await axios.delete(mailchimpDeleteUrl, {
        headers: {
          Authorization: `apikey ${MAILCHIMP_API_KEY}`
        }
      });

      console.log(`🗑️ Deleted ${subscriber.email} from Mailchimp`);
    } catch (mailchimpDelErr) {
      console.warn(`⚠️ Could not delete ${subscriber.email} from Mailchimp:`, mailchimpDelErr.response?.data || mailchimpDelErr.message);
    }

    res.json({ message: 'Subscriber deleted from database and Mailchimp' });

  } catch (error) {
    console.error('❌ Delete error:', error.message);
    res.status(500).json({ message: 'Failed to delete subscriber', error: error.message });
  }
});

module.exports = router;
