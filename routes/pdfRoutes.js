const express = require('express');
const multer = require('multer');
const fs = require('fs');
const Pdf = require('../models/Pdf');
const Subscriber = require('../models/Subscriber');
const sgMail = require('@sendgrid/mail');
const cloudinary = require('cloudinary').v2;
const router = express.Router();

// ✅ Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// 📂 Multer temp file upload config
const upload = multer({ dest: 'uploads/' }); // temp folder

// 📧 Newsletter sender
const sendNewsletterToAll = async (subject, pdfUrl) => {
  try {
    const subscribers = await Subscriber.find();
    if (!subscribers.length) return console.log('📭 No subscribers to notify.');

    const emails = subscribers.map(sub => sub.email);
    const msg = {
      to: emails,
      from: 'gandhiswayam772@gmail.com', // ✅ Must be verified on SendGrid
      subject,
      html: `
        <h2>${subject}</h2>
        <p>A new PDF has been uploaded. Click below to view:</p>
        <p><a href="${pdfUrl}" target="_blank">📄 View PDF</a></p>
      `
    };

    await sgMail.sendMultiple(msg);
    console.log(`✅ Newsletter sent to ${emails.length} subscriber(s).`);
  } catch (error) {
    console.error('❌ Newsletter error:', error.response?.body || error.message);
  }
};

// 📤 Upload PDF to Cloudinary & notify
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    const { title, date } = req.body;
    if (!req.file || !title) {
      return res.status(400).json({ error: 'PDF title and file are required.' });
    }

    const tempFilePath = req.file.path;

    // Upload to Cloudinary
    const uploaded = await cloudinary.uploader.upload(tempFilePath, {
      resource_type: 'raw', // Required for PDFs
      folder: 'pdfs',       // Optional folder in Cloudinary
    });

    // Remove temp file after upload
    fs.unlinkSync(tempFilePath);

    const newPdf = new Pdf({ title, url: uploaded.secure_url, date });
    await newPdf.save();

    await sendNewsletterToAll(`New PDF: ${title}`, uploaded.secure_url);

    res.status(201).json({
      message: '✅ PDF uploaded and newsletter sent!',
      pdf: { title: newPdf.title, url: uploaded.secure_url }
    });

  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ error: 'Failed to upload PDF and notify subscribers.' });
  }
});

// 📥 Get all PDFs
router.get('/', async (req, res) => {
  try {
    const pdfs = await Pdf.find().sort({ createdAt: -1 });
    res.json(pdfs);
  } catch (err) {
    console.error('❌ Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch PDFs' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Pdf.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'PDF not found' });

    res.json({ message: 'PDF deleted successfully' });
  } catch (err) {
    console.error('❌ Delete error:', err);
    res.status(500).json({ error: 'Failed to delete PDF' });
  }
});


module.exports = router;
