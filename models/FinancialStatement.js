const mongoose = require('mongoose');

const financialStatementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  date: { type: Date, required: true },
  category: {
    type: String,
    enum: ['annual', 'quarterly', 'mda', 'estma'],
    required: true
  },
  fileUrl: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('FinancialStatement', financialStatementSchema);
