const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Pdf = require('../models/Pdf');
const Subscriber = require('../models/Subscriber');
const sgMail = require('@sendgrid/mail');
const cloudinary = require('../utils/cloudinary'); // ✅ Add this
const { compressPdfBuffer } = require('../utils/pdfCompressor');
const router = express.Router();

// ✅ In-memory storage instead of disk
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
  }
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// 📨 Send newsletter to all subscribers
const sendNewsletterToAll = async (subject, pdfUrl) => {
  try {
    const subscribers = await Subscriber.find();
    if (!subscribers.length) return console.log('📭 No subscribers to notify.');

    const emails = subscribers.map(sub => sub.email);
    const msg = {
      to: emails,
      from: 'gandhiswayam772@gmail.com', // ✅ Must be verified in SendGrid
      subject,
      html: `
        <h2>${subject}</h2>
        <p>A new PDF update has been uploaded. You can view it below:</p>
        <p><a href="${pdfUrl}" target="_blank">📄 View PDF</a></p>
      `
    };

    await sgMail.sendMultiple(msg);
    console.log(`✅ Newsletter sent to ${emails.length} subscriber(s).`);
  } catch (error) {
    console.error('❌ Error sending newsletter:', error.response?.body || error.message);
  }
};

// 📤 Upload PDF & notify subscribers
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !req.file) {
      return res.status(400).json({ error: 'PDF title and file are required.' });
    }

    // ✅ Compress PDF buffer before upload
    const compressedBuffer = await compressPdfBuffer(req.file.buffer);
    const tempPath = path.join(__dirname, `../temp/${Date.now()}-${req.file.originalname}`);
    fs.writeFileSync(tempPath, compressedBuffer);

    const cloudinaryResult = await cloudinary.uploader.upload(tempPath, {
      resource_type: 'raw',
      folder: 'pdfs'
    });

    fs.unlinkSync(tempPath); // ✅ Clean up temp file

    const newPdf = new Pdf({ title, url: cloudinaryResult.secure_url });
    await newPdf.save();

    await sendNewsletterToAll(`New PDF: ${title}`, cloudinaryResult.secure_url);

    res.status(201).json({
      message: '✅ PDF uploaded and newsletter sent.',
      pdf: { title: newPdf.title, url: cloudinaryResult.secure_url }
    });
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ error: 'Failed to upload PDF and send newsletter.' });
  }
});

// 📥 Get all uploaded PDFs
router.get('/', async (req, res) => {
  try {
    const pdfs = await Pdf.find().sort({ createdAt: -1 });
    res.json(pdfs.map(pdf => ({
      title: pdf.title,
      url: pdf.url
    })));
  } catch (err) {
    console.error('❌ Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch PDFs' });
  }
});

module.exports = router;
