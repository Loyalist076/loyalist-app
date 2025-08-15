const mongoose = require('mongoose');

const companyStructureSchema = new mongoose.Schema({
  capitalStructure: [
    {
      type: { type: String, required: true }, // e.g., 'Common Shares Outstanding'
      value: { type: String, required: true } // e.g., '260.3M'
    }
  ],
  shareOwnership: [
    {
      shareholder: { type: String, required: true }, // e.g., 'Timmins Shareholders'
      percentage: { type: String, required: true } // e.g., '18%'
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('CompanyStructure', companyStructureSchema);
