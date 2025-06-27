const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription'); // Your model
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// POST: Subscribe and send confirmation email
router.post('/', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    // Store subscriber
    const existing = await Subscription.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already subscribed' });

    const newSubscriber = new Subscription({ email });
    await newSubscriber.save();

    // Send email via SendGrid
    const msg = {
      to: email,
      from: 'gandhiswayam772@gmail.com', // ✅ Must be a verified sender in SendGrid
      subject: 'Thank You for Subscribing!',
      html: `
        <h2>Welcome to Loyalist Exploration!</h2>
        <p>Thank you for subscribing to our newsletter. Stay tuned for the latest updates on gold discoveries, news, and more.</p>
        <p>— Loyalist Exploration Team</p>
      `,
    };

    await sgMail.send(msg);

    res.status(200).json({ message: 'Subscribed and email sent' });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ message: 'Subscription failed', error: error.message });
  }
});

module.exports = router;
