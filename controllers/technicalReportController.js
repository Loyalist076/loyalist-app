const TechnicalReport = require('../models/TechnicalReport');

// POST a new technical report with file upload
exports.createReport = async (req, res) => {
  try {
    const { title, description, date, project } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    const fileUrl = `/uploads/technical-reports/${file.filename}`;

    const report = new TechnicalReport({
      title,
      description,
      date,
      project,
      fileUrl
    });

    await report.save();

    res.status(201).json({ message: 'Technical report posted successfully', report });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to post technical report' });
  }
};

// GET all reports (optional ?project= filter)
exports.getAllReports = async (req, res) => {
  try {
    const filter = req.query.project ? { project: req.query.project } : {};
    const reports = await TechnicalReport.find(filter).sort({ date: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch technical reports' });
  }
};

// DELETE a report
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    await TechnicalReport.findByIdAndDelete(id);
    res.json({ message: 'Technical report deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete technical report' });
  }
};
