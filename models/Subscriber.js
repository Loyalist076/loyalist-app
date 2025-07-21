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
      enum: [
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
      ],
      default: 'popup',
    },
  },
  { timestamps: true }
);

// ✅ Ensure unique combination of email + source
subscriberSchema.index({ email: 1, source: 1 }, { unique: true });

module.exports = mongoose.model('Subscriber', subscriberSchema);
