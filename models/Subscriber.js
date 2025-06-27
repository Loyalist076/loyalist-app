const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    source: {
      type: String,
      enum: ['popup', 'homepage', 'about'],
      default: 'popup',
    },
  },
  { timestamps: true }
);

// ✅ Unique for each (email + source) pair
subscriberSchema.index({ email: 1, source: 1 }, { unique: true });

module.exports = mongoose.model('Subscriber', subscriberSchema);
