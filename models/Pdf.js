<<<<<<< HEAD
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
=======
// models/Pdf.js
const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Pdf', pdfSchema);
>>>>>>> 9e0808d5ab29d3f3927d381c9b10252dd6cf5e30
