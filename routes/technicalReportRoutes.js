const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticate, isAdmin } = require('../middleware/auth');
const { tempUpload } = require('../middleware/upload');
const TechnicalReport = require('../models/TechnicalReport');
const router = express.Router();

router.post('/upload', authenticate, isAdmin, tempUpload.single('pdf'), async (req, res) => {
  try {
    const { title } = req.body;
    if (!req.file || !title) {
      return res.status(400).json({ error: 'Title and PDF file are required.' });
    }

    const tempFilePath = req.file.path;
    const filename = Date.now() + '-' + req.file.originalname.replace(/\s+/g, '-');
    const targetPath = path.join(__dirname, '../public/uploads/technical-reports', filename);

    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.copyFileSync(tempFilePath, targetPath);
    fs.unlinkSync(tempFilePath);

    const newReport = new TechnicalReport({
      title,
      url: `/uploads/technical-reports/${filename}`,
      filename
    });
    await newReport.save();

    res.status(200).json({ message: 'Technical report uploaded successfully!', report: newReport });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload technical report.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const reports = await TechnicalReport.find({ isActive: true }).sort({ uploadedAt: -1 });
    return res.json(reports);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch technical reports.' });
  }
});

router.get('/all', authenticate, isAdmin, async (req, res) => {
  try {
    const reports = await TechnicalReport.find().sort({ uploadedAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch technical reports.' });
  }
});

router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const report = await TechnicalReport.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );
    if (!report) {
      return res.status(404).json({ message: 'Technical report not found.' });
    }
    res.json({ message: 'Technical report status updated successfully.', report });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ message: 'Failed to update technical report status.' });
  }
});

router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const report = await TechnicalReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Technical report not found.' });
    }

    const targetPath = path.join(__dirname, '../public', report.url);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }

    await report.deleteOne();
    res.json({ message: 'Technical report deleted successfully.' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete technical report.' });
  }
});

module.exports = router;
