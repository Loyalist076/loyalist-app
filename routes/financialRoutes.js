const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const financialController = require('../controllers/financialController');

// OPTIONAL: Protect routes (Uncomment when ready)
// const { isAdmin } = require('../middleware/authMiddleware');

// Setup Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/financials');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  }
});

// File Filter: Allow only PDFs
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

// Upload configuration
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Routes
router.post('/upload', upload.single('pdfFile'), financialController.createStatement);

router.get('/', financialController.getAllStatements);

router.delete('/:id', financialController.deleteStatement);

module.exports = router;
