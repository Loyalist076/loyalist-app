
const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  title: String,
  url: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PDF', pdfSchema);
