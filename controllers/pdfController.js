const cloudinary = require('../utils/cloudinary');
const PDF = require('../models/pdfModel');
const fs = require('fs');

exports.uploadPDF = async (req, res) => {
  try {
    const filePath = req.file.path;

    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'raw',
      folder: 'pdfs'
    });

    fs.unlinkSync(filePath); // Delete temp file

    const newPdf = new PDF({
      title: req.body.title,
      url: result.secure_url
    });

    await newPdf.save();

    res.status(200).json({ message: 'PDF uploaded successfully', data: newPdf });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

exports.getAllPDFs = async (req, res) => {
  try {
    const pdfs = await PDF.find().sort({ uploadedAt: -1 });
    res.status(200).json(pdfs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch PDFs', error: err.message });
  }
};
