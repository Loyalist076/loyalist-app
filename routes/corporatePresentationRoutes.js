const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticate, isAdmin } = require('../middleware/auth');
const { tempUpload } = require('../middleware/upload');
const router = express.Router();

// 📤 Upload Corporate Presentation PDF (admin only)
// This replaces the existing loyalist.pdf file in the /public/image directory
router.post('/upload', authenticate, isAdmin, tempUpload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required.' });
    }

    const tempFilePath = req.file.path;
    const targetPath = path.join(__dirname, '../public/image/loyalist.pdf');

    // 📁 Create directory if it doesn't exist
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 🔄 Replace the existing corporate presentation PDF
    fs.copyFileSync(tempFilePath, targetPath);

    // ❌ Delete temp file
    fs.unlinkSync(tempFilePath);

    console.log('✅ Corporate presentation PDF uploaded successfully');

    // ✅ Respond
    res.status(200).json({
      message: '✅ Corporate presentation uploaded successfully!',
      path: '/image/loyalist.pdf',
      filename: 'loyalist.pdf'
    });
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ error: 'Failed to upload corporate presentation.' });
  }
});

// 📥 Check if Corporate Presentation exists
router.get('/check', (req, res) => {
  try {
    const pdfPath = path.join(__dirname, '../public/image/loyalist.pdf');
    const exists = fs.existsSync(pdfPath);

    if (exists) {
      const stats = fs.statSync(pdfPath);
      res.json({
        exists: true,
        filename: 'loyalist.pdf',
        path: '/image/loyalist.pdf',
        size: stats.size,
        modified: stats.mtime
      });
    } else {
      res.json({
        exists: false,
        message: 'No corporate presentation uploaded yet.'
      });
    }
  } catch (err) {
    console.error('❌ Check error:', err);
    res.status(500).json({ error: 'Failed to check corporate presentation status.' });
  }
});

module.exports = router;
