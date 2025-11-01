const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  name: String,
  source: {
    type: String,
    enum: ['website', 'admin'],
    default: 'website'
  }
}, { timestamps: true });

// Index for email lookups
subscriptionSchema.index({ email: 1 });

// Index for sorting by creation date
subscriptionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
