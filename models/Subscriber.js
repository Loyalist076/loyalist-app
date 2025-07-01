<<<<<<< HEAD
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
=======
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
>>>>>>> 9e0808d5ab29d3f3927d381c9b10252dd6cf5e30
