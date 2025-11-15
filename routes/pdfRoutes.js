const express = require('express');
const fs = require('fs');
const axios = require('axios');
const Pdf = require('../models/Pdf');
const Subscription = require('../models/Subscription');
const sgMail = require('@sendgrid/mail');
const cloudinary = require('cloudinary').v2;
const { authenticate, isAdmin } = require('../middleware/auth');
const { tempUpload } = require('../middleware/upload');
const { compressPdfBuffer } = require('../utils/pdfCompressor');
const router = express.Router();

// ✅ Environment Base URL for production
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// ✅ Cloudinary configuration (optional - only if credentials are provided)
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
                                process.env.CLOUDINARY_API_KEY &&
                                process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('✅ Cloudinary configured successfully - PDFs will be stored in Cloudinary');
} else {
  console.log('⚠️ Cloudinary not configured - PDF uploads will fail');
}

// ✅ SendGrid configuration (optional)
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✅ SendGrid configured successfully');
} else {
  console.log('⚠️ SendGrid not configured - newsletters will be skipped');
}

// 📧 Newsletter sender function
const sendNewsletterToAll = async (title, pdfViewUrl) => {
  try {
    // Skip if SendGrid is not configured
    if (!process.env.SENDGRID_API_KEY) {
      console.log('⚠️ SendGrid not configured - skipping newsletter send.');
      return;
    }

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

// 📤 Upload PDF to Cloudinary and notify subscribers (admin only)
router.post('/upload', authenticate, isAdmin, tempUpload.single('pdf'), async (req, res) => {
  try {
    const { title, date, useLocal } = req.body;
    if (!req.file || !title) {
      return res.status(400).json({ error: 'PDF title and file are required.' });
    }

    const tempFilePath = req.file.path;
    let newPdf;

    // 🔽 Compress PDF
    try {
      const originalBuffer = fs.readFileSync(tempFilePath);
      const compressedBuffer = await compressPdfBuffer(originalBuffer);
      fs.writeFileSync(tempFilePath, compressedBuffer);
    } catch (compressionErr) {
      console.error('❌ Compression error (continuing with original file):', compressionErr.message);
    }

    // Check if local storage is requested (default is Cloudinary)
    if (useLocal === 'true') {
      // 💾 Save locally
      const path = require('path');
      const uploadsDir = path.join(__dirname, '..', 'public', 'uploads', 'press-releases');

      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedTitle = title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      const filename = `${timestamp}-${sanitizedTitle}.pdf`;
      const finalPath = path.join(uploadsDir, filename);

      // Move file to permanent location
      fs.renameSync(tempFilePath, finalPath);

      // Store relative path for database
      const relativePath = `public/uploads/press-releases/${filename}`;
      const publicUrl = `/uploads/press-releases/${filename}`;

      // 💾 Save to MongoDB
      newPdf = new Pdf({
        title,
        url: publicUrl,
        filePath: relativePath,
        date,
        storageType: 'local',
      });
    } else {
      // 🔼 Upload to Cloudinary (default)
      // Check if Cloudinary is configured
      if (!isCloudinaryConfigured) {
        // Clean up temp file
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        return res.status(400).json({
          error: 'Cloudinary is not configured. Please configure Cloudinary credentials in .env file.'
        });
      }

      // Upload to Cloudinary with public access
      const uploaded = await cloudinary.uploader.upload(tempFilePath, {
        resource_type: 'raw',
        folder: 'pdfs',
        type: 'upload', // Ensures public access
        access_mode: 'public', // Make file publicly accessible
      });

      // ❌ Delete local temp file
      fs.unlinkSync(tempFilePath);

      // 💾 Save to MongoDB
      newPdf = new Pdf({
        title,
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
        date,
        storageType: 'cloudinary',
      });
    }

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
        storageType: newPdf.storageType,
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

    // Sanitize filename to remove invalid characters
    const sanitizedTitle = pdf.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${sanitizedTitle}.pdf"`);

    // Handle local files
    if (pdf.storageType === 'local' && pdf.filePath) {
      const path = require('path');
      const fullPath = path.join(__dirname, '..', pdf.filePath);

      if (!fs.existsSync(fullPath)) {
        return res.status(404).send('PDF file not found on server.');
      }

      return res.sendFile(fullPath);
    }

    // Handle Cloudinary files
    let pdfUrl = pdf.url;

    // If the PDF has a public_id, generate a signed URL to avoid 401 errors
    if (pdf.public_id && isCloudinaryConfigured) {
      try {
        // Generate a signed URL that's valid for 1 hour
        pdfUrl = cloudinary.url(pdf.public_id, {
          resource_type: 'raw',
          type: 'upload',
          sign_url: true,
          secure: true,
        });
        console.log('🔐 Using signed URL for PDF access');
      } catch (signError) {
        console.warn('⚠️ Failed to generate signed URL, using original URL:', signError.message);
      }
    }

    const pdfResponse = await axios({
      method: 'GET',
      url: pdfUrl,
      responseType: 'stream',
    });

    pdfResponse.data.pipe(res);
  } catch (err) {
    console.error('❌ View PDF error:', err);
    if (err.response && err.response.status === 401) {
      res.status(401).send('Unable to access PDF. The file may have restricted access. Please re-upload the PDF.');
    } else {
      res.status(500).send('Failed to display PDF.');
    }
  }
});

// 📥 Download PDF
router.get('/download/:id', async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf) return res.status(404).send('PDF not found.');

    // Sanitize filename to remove invalid characters
    const sanitizedTitle = pdf.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}.pdf"`);

    // Handle local files
    if (pdf.storageType === 'local' && pdf.filePath) {
      const path = require('path');
      const fullPath = path.join(__dirname, '..', pdf.filePath);

      if (!fs.existsSync(fullPath)) {
        return res.status(404).send('PDF file not found on server.');
      }

      return res.sendFile(fullPath);
    }

    // Handle Cloudinary files
    let pdfUrl = pdf.url;

    // If the PDF has a public_id, generate a signed URL to avoid 401 errors
    if (pdf.public_id && isCloudinaryConfigured) {
      try {
        // Generate a signed URL that's valid for 1 hour
        pdfUrl = cloudinary.url(pdf.public_id, {
          resource_type: 'raw',
          type: 'upload',
          sign_url: true,
          secure: true,
        });
        console.log('🔐 Using signed URL for PDF download');
      } catch (signError) {
        console.warn('⚠️ Failed to generate signed URL, using original URL:', signError.message);
      }
    }

    const pdfResponse = await axios({
      method: 'GET',
      url: pdfUrl,
      responseType: 'stream',
    });

    pdfResponse.data.pipe(res);
  } catch (err) {
    console.error('❌ Download PDF error:', err);
    if (err.response && err.response.status === 401) {
      res.status(401).send('Unable to download PDF. The file may have restricted access. Please re-upload the PDF.');
    } else {
      res.status(500).send('Failed to download PDF.');
    }
  }
});

// 🗑 Delete PDF (admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf) return res.status(404).json({ error: 'PDF not found' });

    // Delete from Cloudinary if stored there
    if (pdf.storageType === 'cloudinary' && pdf.public_id) {
      await cloudinary.uploader.destroy(pdf.public_id, { resource_type: 'raw' });
      console.log(`🗑️ Cloudinary PDF deleted: ${pdf.public_id}`);
    }

    // Delete local file if stored locally
    if (pdf.storageType === 'local' && pdf.filePath) {
      const path = require('path');
      const fullPath = path.join(__dirname, '..', pdf.filePath);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`🗑️ Local PDF deleted: ${pdf.filePath}`);
      }
    }

    await Pdf.findByIdAndDelete(req.params.id);

    res.json({ message: '✅ PDF deleted successfully' });
  } catch (err) {
    console.error('❌ Delete error:', err);
    res.status(500).json({ error: 'Failed to delete PDF' });
  }
});

module.exports = router;
