// models/Pdf.js
const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true }, // Add this line to store the provided date
  url: { type: String, required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Pdf', pdfSchema);
