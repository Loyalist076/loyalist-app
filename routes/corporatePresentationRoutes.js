const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticate, isAdmin } = require('../middleware/auth');
const { tempUpload } = require('../middleware/upload');
const Presentation = require('../models/Presentation');
const router = express.Router();

const LEGACY_PRESENTATION_RELATIVE_PATH = '/image/loyalist.pdf';
const LEGACY_PRESENTATION_FILE_PATH = path.join(__dirname, `../public${LEGACY_PRESENTATION_RELATIVE_PATH}`);

function getLegacyPresentation() {
  if (!fs.existsSync(LEGACY_PRESENTATION_FILE_PATH)) {
    return null;
  }

  const stats = fs.statSync(LEGACY_PRESENTATION_FILE_PATH);
  return {
    _id: 'legacy-loyalist-pdf',
    title: 'Corporate Presentation',
    url: LEGACY_PRESENTATION_RELATIVE_PATH,
    uploadedAt: stats.mtime,
    isActive: true,
    isLegacy: true
  };
}

router.post('/upload', authenticate, isAdmin, tempUpload.single('pdf'), async (req, res) => {
  try {
    const { title } = req.body;
    if (!req.file || !title) {
      return res.status(400).json({ error: 'Title and PDF file are required.' });
    }

    const tempFilePath = req.file.path;
    const filename = Date.now() + '-' + req.file.originalname.replace(/\s+/g, '-');
    const targetPath = path.join(__dirname, '../public/uploads/presentations', filename);

    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.copyFileSync(tempFilePath, targetPath);
    fs.unlinkSync(tempFilePath);

    const newPresentation = new Presentation({
      title,
      url: `/uploads/presentations/${filename}`,
      filename
    });
    await newPresentation.save();

    res.status(200).json({ message: 'Corporate presentation uploaded successfully!', presentation: newPresentation });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload corporate presentation.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const presentations = await Presentation.find({ isActive: true }).sort({ uploadedAt: -1 });

    if (presentations.length > 0) {
      return res.json(presentations);
    }

    const legacyPresentation = getLegacyPresentation();
    if (legacyPresentation) {
      return res.json([legacyPresentation]);
    }

    return res.json([]);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch presentations.' });
  }
});

router.get('/all', authenticate, isAdmin, async (req, res) => {
  try {
    const presentations = await Presentation.find().sort({ uploadedAt: -1 });
    res.json(presentations);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch presentations.' });
  }
});

router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const presentation = await Presentation.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );
    if (!presentation) {
      return res.status(404).json({ message: 'Presentation not found.' });
    }
    res.json({ message: 'Presentation status updated successfully.', presentation });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ message: 'Failed to update presentation status.' });
  }
});

router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const presentation = await Presentation.findById(req.params.id);
    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found.' });
    }

    const targetPath = path.join(__dirname, '../public', presentation.url);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }

    await presentation.deleteOne();
    res.json({ message: 'Presentation deleted successfully.' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete presentation.' });
  }
});

router.get('/check', async (req, res) => {
  try {
    const latestActivePresentation = await Presentation
      .findOne({ isActive: true })
      .sort({ uploadedAt: -1 });

    if (latestActivePresentation) {
      return res.json({
        exists: true,
        path: latestActivePresentation.url,
        title: latestActivePresentation.title,
        uploadedAt: latestActivePresentation.uploadedAt
      });
    }

    const legacyPresentation = getLegacyPresentation();
    if (legacyPresentation) {
      return res.json({
        exists: true,
        path: legacyPresentation.url,
        title: legacyPresentation.title,
        uploadedAt: legacyPresentation.uploadedAt,
        isLegacy: true
      });
    }

    return res.json({ exists: false, message: 'No active corporate presentations uploaded yet.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
