const express = require('express');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios'); // 👈 Required to stream PDFs
const Pdf = require('../models/Pdf');
const Subscriber = require('../models/Subscriber');
const sgMail = require('@sendgrid/mail');
const cloudinary = require('cloudinary').v2;
const router = express.Router();

// ✅ Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ SendGrid configuration
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// 📂 Multer temporary upload setup
const upload = multer({ dest: 'uploads/' }); // Temporary folder for uploads

// 📧 Newsletter sender function
const sendNewsletterToAll = async (subject, pdfViewUrl) => {
  try {
    const subscribers = await Subscriber.find();
    if (!subscribers.length) {
      console.log('📭 No subscribers to notify.');
      return;
    }

    const emails = subscribers.map(sub => sub.email);
    const msg = {
      to: emails,
      from: 'gandhiswayam772@gmail.com', // ✅ Must be verified sender in SendGrid
      subject,
      html: `
        <h2>${subject}</h2>
        <p>A new PDF has been uploaded. Click below to view:</p>
        <p><a href="${pdfViewUrl}" target="_blank">📄 View PDF</a></p>
      `
    };

    await sgMail.sendMultiple(msg);
    console.log(`✅ Newsletter sent to ${emails.length} subscriber(s).`);
  } catch (error) {
    console.error('❌ Newsletter error:', error.response?.body || error.message);
  }
};

// 📤 Upload PDF to Cloudinary and notify subscribers
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    const { title, date } = req.body;
    if (!req.file || !title) {
      return res.status(400).json({ error: 'PDF title and file are required.' });
    }

    const tempFilePath = req.file.path;

    // Upload to Cloudinary (resource_type raw for PDF)
    const uploaded = await cloudinary.uploader.upload(tempFilePath, {
      resource_type: 'raw',
      folder: 'pdfs', // Optional folder in Cloudinary
    });

    // Delete local temp file
    fs.unlinkSync(tempFilePath);

    // Save to MongoDB
    const newPdf = new Pdf({
      title,
      url: uploaded.secure_url,
      public_id: uploaded.public_id, // 👈 Save public_id for later deletion
      date
    });
    await newPdf.save();

    // Create proxy view URL for newsletters
    const pdfViewUrl = `${req.protocol}://${req.get('host')}/api/pdf/view/${newPdf._id}`;

    // Send newsletter to subscribers
    await sendNewsletterToAll(`New PDF: ${title}`, pdfViewUrl);

    res.status(201).json({
      message: '✅ PDF uploaded and newsletter sent!',
      pdf: {
        title: newPdf.title,
        viewUrl: pdfViewUrl, // Return proxy view URL
        date: newPdf.date
      }
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

// 📄 Stream PDF inline (fix: avoid download)
router.get('/view/:id', async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf) {
      return res.status(404).send('PDF not found.');
    }

    // Fetch PDF from Cloudinary as a stream
    const pdfResponse = await axios({
      method: 'GET',
      url: pdf.url,
      responseType: 'stream'
    });

    // Set headers to force browser to render PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${pdf.title}.pdf"`);

    // Pipe the PDF stream to the client
    pdfResponse.data.pipe(res);
  } catch (err) {
    console.error('❌ View PDF error:', err);
    res.status(500).send('Failed to display PDF.');
  }
});

// 🗑 Delete PDF by ID (also from Cloudinary)
router.delete('/:id', async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // Delete from Cloudinary
    if (pdf.public_id) {
      await cloudinary.uploader.destroy(pdf.public_id, { resource_type: 'raw' });
      console.log(`🗑️ Cloudinary PDF deleted: ${pdf.public_id}`);
    }

    // Delete from MongoDB
    await Pdf.findByIdAndDelete(req.params.id);

    res.json({ message: '✅ PDF deleted successfully' });
  } catch (err) {
    console.error('❌ Delete error:', err);
    res.status(500).json({ error: 'Failed to delete PDF' });
  }
});

module.exports = router;
