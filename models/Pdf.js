// models/Pdf.js
const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Pdf', pdfSchema);
