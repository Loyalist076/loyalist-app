const multer = require('multer');
const path = require('path');

// Storage configuration for financial statements
const financialStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/financials');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  }
});

// Storage configuration for temporary uploads (PDFs to Cloudinary)
const tempStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  }
});

// File filter for PDFs only
const pdfFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.pdf' || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

// Export different upload configurations
module.exports = {
  // For financial statements (local storage)
  financialUpload: multer({
    storage: financialStorage,
    fileFilter: pdfFileFilter
  }),

  // For temporary PDF uploads (to Cloudinary)
  tempUpload: multer({
    storage: tempStorage,
    fileFilter: pdfFileFilter
  }),

  // Generic PDF upload with custom destination
  createPdfUpload: (destination, maxSize) => {
    const customStorage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, destination);
      },
      filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
        cb(null, uniqueName);
      }
    });

    const config = {
      storage: customStorage,
      fileFilter: pdfFileFilter
    };

    if (maxSize) {
      config.limits = { fileSize: maxSize };
    }

    return multer(config);
  }
};
