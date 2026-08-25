const mongoose = require('mongoose');

const technicalReportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  date: { type: Date, required: true },
  project: {
    type: String,
    enum: ['tully', 'loveland', 'gold-rush', 'desantis', 'other'],
    required: true
  },
  fileUrl: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('TechnicalReport', technicalReportSchema);
