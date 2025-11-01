const mongoose = require('mongoose');

const annualMeetingDocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  year: {
    type: Number,
    required: [true, 'Meeting year is required'],
    min: [2000, 'Year must be 2000 or later'],
    max: [2100, 'Year must be 2100 or earlier']
  },
  fileName: {
    type: String,
    required: [true, 'File name is required']
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required']
  },
  fileSize: {
    type: Number,
    required: true
  },
  public_id: {
    type: String, // Cloudinary public_id for deletion
    required: false
  },
  displayOrder: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for sorting by year (descending) and display order
annualMeetingDocumentSchema.index({ year: -1, displayOrder: 1 });

// Index for active documents
annualMeetingDocumentSchema.index({ isActive: 1 });

module.exports = mongoose.model('AnnualMeetingDocument', annualMeetingDocumentSchema);
