const FinancialStatement = require('../models/FinancialStatement');

// POST a new financial statement with file upload
exports.createStatement = async (req, res) => {
  try {
    const { title, description, date, category } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    const fileUrl = `/uploads/financials/${file.filename}`;

    const statement = new FinancialStatement({
      title,
      description,
      date,
      category,
      fileUrl
    });

    await statement.save();

    res.status(201).json({ message: 'Financial statement posted successfully', statement });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to post statement' });
  }
};

// GET all statements
exports.getAllStatements = async (req, res) => {
  try {
    const statements = await FinancialStatement.find().sort({ date: -1 });
    res.json(statements);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch statements' });
  }
};

// DELETE a statement
exports.deleteStatement = async (req, res) => {
  try {
    const { id } = req.params;
    await FinancialStatement.findByIdAndDelete(id);
    res.json({ message: 'Statement deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete statement' });
  }
};
