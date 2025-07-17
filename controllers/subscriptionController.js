const Subscription = require('../models/Subscription');
const crypto = require('crypto');
const axios = require('axios');

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX;
const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;

const getEmailHash = (email) =>
  crypto.createHash('md5').update(email.toLowerCase()).digest('hex');

exports.subscribe = async (req, res) => {
  const { email, name, source = 'website' } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    let subscriber = await Subscription.findOne({ email });

    if (!subscriber) {
      subscriber = new Subscription({ email, name, source });
      await subscriber.save();
    }

    const emailHash = getEmailHash(email);
    const mailchimpUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members/${emailHash}`;

    await axios.put(mailchimpUrl,
      {
        email_address: email,
        status_if_new: 'subscribed',
        merge_fields: {
          FNAME: name || ''
        },
        tags: ['newsletter']
      },
      {
        headers: {
          Authorization: `apikey ${MAILCHIMP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

    return res.status(200).json({
      success: true,
      message: 'Subscribed successfully',
      subscriber: {
        email: subscriber.email,
        id: subscriber._id
      }
    });
  } catch (err) {
    console.error('❌ Subscribe error:', err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to subscribe',
      error: err.response?.data?.detail || err.message
    });
  }
};

exports.getAllSubscribers = async (req, res) => {
  try {
    const list = await Subscription.find().sort({ createdAt: -1 });
    return res.status(200).json(list);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch subscribers' });
  }
};

exports.deleteSubscriber = async (req, res) => {
  const id = req.params.id;

  try {
    const subscriber = await Subscription.findByIdAndDelete(id);
    if (!subscriber)
      return res.status(404).json({ message: 'Subscriber not found' });

    const emailHash = getEmailHash(subscriber.email);
    const deleteUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members/${emailHash}`;

    try {
      await axios.delete(deleteUrl, {
        headers: {
          Authorization: `apikey ${MAILCHIMP_API_KEY}`
        }
      });
    } catch (mailchimpErr) {
      console.warn(`⚠️ Mailchimp delete failed:`, mailchimpErr.response?.data || mailchimpErr.message);
    }

    return res.status(200).json({ message: 'Subscriber deleted from both DB and Mailchimp' });
  } catch (err) {
    return res.status(500).json({ message: 'Delete failed', error: err.message });
  }
};
