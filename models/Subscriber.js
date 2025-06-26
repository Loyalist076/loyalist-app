const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    source: {
      type: String,
      enum: ['popup', 'homepage', 'about' ],  // ✅ added 'about'
      default: 'popup',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscriber', subscriberSchema);
