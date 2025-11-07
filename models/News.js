const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true // HTML content (from pasted email)
  },
  imageUrl: {
    type: String,
    default: '' // Optional field for separate featured image if needed
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for sorting by creation date (descending)
newsSchema.index({ createdAt: -1 });

module.exports = mongoose.model('News', newsSchema);
