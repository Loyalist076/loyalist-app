const CompanyStructure = require('../models/CompanyStructure');

// Get the company structure (capital + ownership)
exports.getCompanyStructure = async (req, res) => {
  try {
    const data = await CompanyStructure.findOne(); // assuming only one document
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Post or update the company structure
exports.postCompanyStructure = async (req, res) => {
  try {
    const { capitalStructure, shareOwnership } = req.body;

    // Check if a document already exists
    let structure = await CompanyStructure.findOne();
    if (structure) {
      // Update existing
      structure.capitalStructure = capitalStructure;
      structure.shareOwnership = shareOwnership;
      await structure.save();
      return res.json(structure);
    }

    // Create new
    structure = new CompanyStructure({ capitalStructure, shareOwnership });
    await structure.save();
    res.status(201).json(structure);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
