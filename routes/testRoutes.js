const express = require('express');
const router = express.Router();
const sgMail = require('@sendgrid/mail');
const cloudinary = require('cloudinary').v2;

// Load ENV keys
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ✅ Cloudinary test
router.get('/test-cloudinary', async (req, res) => {
  try {
    const result = await cloudinary.api.ping();
    res.json({ success: true, message: '✅ Cloudinary API is working.', result });
  } catch (error) {
    console.error('Cloudinary test failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ SendGrid test
router.get('/test-sendgrid', async (req, res) => {
  try {
    const msg = {
      to: 'your-email@example.com', // 🔁 Replace this with your own email
      from: 'gandhiswayam772@gmail.com', // ✅ Must be verified in SendGrid
      subject: '✅ SendGrid Test',
      text: 'If you received this, SendGrid is working properly.',
    };

    await sgMail.send(msg);
    res.json({ success: true, message: '✅ SendGrid email sent successfully!' });
  } catch (error) {
    console.error('SendGrid test failed:', error.response?.body || error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
