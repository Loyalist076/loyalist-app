const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const financialController = require('../controllers/financialController');

// Setup multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/financials');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// POST route for uploading financial statements
router.post('/upload', upload.single('pdfFile'), financialController.createStatement);

// GET all statements
router.get('/', financialController.getAllStatements);

// DELETE route
router.delete('/:id', financialController.deleteStatement);

module.exports = router;
