const express = require('express');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const Pdf = require('../models/Pdf');
const Subscription = require('../models/Subscription');
const sgMail = require('@sendgrid/mail');
const cloudinary = require('cloudinary').v2;
const router = express.Router();

// ✅ Environment Base URL for production
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// ✅ Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ SendGrid configuration
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// 📂 Multer temporary upload setup
const upload = multer({ dest: 'uploads/' });

// 📧 Newsletter sender function
const sendNewsletterToAll = async (title, pdfViewUrl) => {
  try {
    const subscribers = await Subscription.find();
    console.log(`🔍 Found ${subscribers.length} subscriber(s).`);

    if (!subscribers.length) {
      console.log('📭 No subscribers found. Skipping newsletter send.');
      return;
    }

    const emails = subscribers.map(sub => sub.email);
    console.log(`📬 Sending to: ${emails.join(', ')}`);

    const msg = {
      to: emails,
      from: 'loyalistexploration@gmail.com', // ✅ Verified sender
      templateId: 'd-969c67452b8b49c3b61d369980cad588', // ✅ Dynamic template ID
      dynamic_template_data: {
        title,
        link: pdfViewUrl,
      },
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

    // 🔼 Upload to Cloudinary
    const uploaded = await cloudinary.uploader.upload(tempFilePath, {
      resource_type: 'raw',
      folder: 'pdfs',
    });

    // ❌ Delete local temp file
    fs.unlinkSync(tempFilePath);

    // 💾 Save to MongoDB
    const newPdf = new Pdf({
      title,
      url: uploaded.secure_url,
      public_id: uploaded.public_id,
      date,
    });
    await newPdf.save();

    // 👁️ Generate view link
    const pdfViewUrl = `${BASE_URL}/api/pdf/view/${newPdf._id}`;

    // 📧 Notify subscribers
    await sendNewsletterToAll(title, pdfViewUrl);

    // ✅ Respond
    res.status(201).json({
      message: '✅ PDF uploaded and newsletter sent!',
      pdf: {
        title: newPdf.title,
        viewUrl: pdfViewUrl,
        date: newPdf.date,
      },
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

// 📄 View PDF inline
router.get('/view/:id', async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf) return res.status(404).send('PDF not found.');

    const pdfResponse = await axios({
      method: 'GET',
      url: pdf.url,
      responseType: 'stream',
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${pdf.title}.pdf"`);

    pdfResponse.data.pipe(res);
  } catch (err) {
    console.error('❌ View PDF error:', err);
    res.status(500).send('Failed to display PDF.');
  }
});

// 📥 Download PDF
router.get('/download/:id', async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf) return res.status(404).send('PDF not found.');

    const pdfResponse = await axios({
      method: 'GET',
      url: pdf.url,
      responseType: 'stream',
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdf.title}.pdf"`);

    pdfResponse.data.pipe(res);
  } catch (err) {
    console.error('❌ Download PDF error:', err);
    res.status(500).send('Failed to download PDF.');
  }
});

// 🗑 Delete PDF
router.delete('/:id', async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf) return res.status(404).json({ error: 'PDF not found' });

    if (pdf.public_id) {
      await cloudinary.uploader.destroy(pdf.public_id, { resource_type: 'raw' });
      console.log(`🗑️ Cloudinary PDF deleted: ${pdf.public_id}`);
    }

    await Pdf.findByIdAndDelete(req.params.id);

    res.json({ message: '✅ PDF deleted successfully' });
  } catch (err) {
    console.error('❌ Delete error:', err);
    res.status(500).json({ error: 'Failed to delete PDF' });
  }
});

module.exports = router;
