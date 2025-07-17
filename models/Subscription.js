const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: String,
  source: {
    type: String,
    enum: ['website', 'admin'],
    default: 'website'
  }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
