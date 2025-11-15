// models/Pdf.js
const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  url: { type: String, required: true }, // Can be Cloudinary URL or local path
  filePath: { type: String }, // Local file path (e.g., 'public/image/press-releases/file.pdf')
  public_id: { type: String }, // Cloudinary public_id (for Cloudinary files only)
  storageType: { type: String, enum: ['local', 'cloudinary'], default: 'cloudinary' } // Storage type - default to Cloudinary
}, {
  timestamps: true
});

module.exports = mongoose.model('Pdf', pdfSchema);
