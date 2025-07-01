<<<<<<< HEAD
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
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('News', newsSchema);
=======
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
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('News', newsSchema);
>>>>>>> 9e0808d5ab29d3f3927d381c9b10252dd6cf5e30
