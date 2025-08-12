const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Sender name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/.+@.+\..+/, 'Please enter a valid email address']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: 150
  },
  message: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    minlength: 5,
    maxlength: 2000
  },
  source: {
    type: String,
    enum: ['index', 'contact', 'business'], // ✅ FIXED: Added 'business'
    default: 'contact',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  }
});

// Optional: Index for sorting
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
