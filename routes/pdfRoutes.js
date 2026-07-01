const express = require('express');
const fs = require('fs');
const axios = require('axios');
const Pdf = require('../models/Pdf');
const Subscription = require('../models/Subscription');
const cloudinary = require('cloudinary').v2;
const { authenticate, isAdmin } = require('../middleware/auth');
const { tempUpload } = require('../middleware/upload');
const { compressPdfBuffer } = require('../utils/pdfCompressor');
const router = express.Router();

// ✅ Environment Base URL for production
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const normalizedBaseUrl = BASE_URL.replace(/\/$/, '');

// ✅ Cloudinary configuration (optional - only if credentials are provided)
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
                                process.env.CLOUDINARY_API_KEY &&
                                process.env.CLOUDINARY_API_SECRET;

const buildAbsoluteUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (!normalizedBaseUrl) return null;
  const sanitizedPath = url.startsWith('/') ? url : `/${url}`;
  return `${normalizedBaseUrl}${sanitizedPath}`;
};

const streamPdfFromUrl = async (url, res, context = 'Direct URL') => {
  const absoluteUrl = buildAbsoluteUrl(url);
  if (!absoluteUrl) return false;

  try {
    console.log(`🌐 ${context}: ${absoluteUrl}`);
    const pdfResponse = await axios({
      method: 'GET',
      url: absoluteUrl,
      responseType: 'arraybuffer',
      timeout: 30000,
    });
    res.send(Buffer.from(pdfResponse.data));
    return true;
  } catch (err) {
    console.error(`❌ ${context} fetch failed:`, err.message);
    return false;
  }
};

const trySignedCloudinaryStream = async (pdf, res, attachment) => {
  if (!pdf.public_id || !isCloudinaryConfigured) return false;

  const typeVariants = ['upload', 'authenticated'];

  for (const type of typeVariants) {
    try {
      const signedUrl = cloudinary.utils.private_download_url(pdf.public_id, 'pdf', {
        resource_type: 'raw',
        attachment,
        type,
      });

      console.log(`🔐 Fetching PDF using signed URL from Cloudinary (type=${type})`);

      const pdfResponse = await axios({
        method: 'GET',
        url: signedUrl,
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      res.send(Buffer.from(pdfResponse.data));
      return true;
    } catch (err) {
      console.error(`❌ Signed URL fetch failed (type=${type}):`, err.message);
    }
  }

  return false;
};

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

// 📧 Mailchimp campaign sender — creates + sends a campaign to the whole audience
const sendMailchimpCampaign = async (title, pdfViewUrl) => {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

  if (!apiKey || !serverPrefix || !audienceId) {
    console.log('⚠️ Mailchimp not configured - skipping campaign send.');
    return;
  }

  const base = `https://${serverPrefix}.api.mailchimp.com/3.0`;
  const headers = { Authorization: `apikey ${apiKey}`, 'Content-Type': 'application/json' };

  try {
    // 1) Create the campaign targeting the audience
    const { data: campaign } = await axios.post(`${base}/campaigns`, {
      type: 'regular',
      recipients: { list_id: audienceId },
      settings: {
        subject_line: title,
        title: `Press Release: ${title}`,
        from_name: process.env.MAILCHIMP_FROM_NAME || 'Loyalist Exploration',
        reply_to: process.env.MAILCHIMP_REPLY_TO || 'loyalistexploration@gmail.com',
      },
    }, { headers });

    // 2) Set the HTML content
    const html = `<p>New press release: <strong>${title}</strong></p>` +
                 `<p><a href="${pdfViewUrl}">Read it here</a></p>`;
    await axios.put(`${base}/campaigns/${campaign.id}/content`, { html }, { headers });

    // 3) Send it
    await axios.post(`${base}/campaigns/${campaign.id}/actions/send`, {}, { headers });
    console.log(`✅ Mailchimp campaign sent for "${title}".`);
  } catch (error) {
    console.error('❌ Mailchimp campaign error:', error.response?.data || error.message);
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

    // 📧 Notify subscribers via Mailchimp campaign
    await sendMailchimpCampaign(title, pdfViewUrl);

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
    // Set no-cache headers to always get fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

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

    // Set headers to prevent caching
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${sanitizedTitle}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Handle local files
    if (pdf.storageType === 'local' && pdf.filePath) {
      const path = require('path');
      const fullPath = path.join(__dirname, '..', pdf.filePath);

      if (!fs.existsSync(fullPath)) {
        return res.status(404).send('PDF file not found on server.');
      }

      return res.sendFile(fullPath);
    }

    // Handle Cloudinary-hosted files or remote URLs
    if (pdf.storageType === 'cloudinary' || pdf.public_id) {
      if (await streamPdfFromUrl(pdf.url, res, 'Direct Cloudinary URL')) {
        return;
      }

      const served = await trySignedCloudinaryStream(pdf, res, false);
      if (served) return;

      return res.status(404).send('Unable to fetch PDF from Cloudinary. Please re-upload the file.');
    }

    // Generic remote URL fallback (non-Cloudinary)
    if (await streamPdfFromUrl(pdf.url, res, 'Direct URL')) {
      return;
    }

    return res.status(404).send('PDF source unavailable.');
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

    // Set headers to prevent caching
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Handle local files
    if (pdf.storageType === 'local' && pdf.filePath) {
      const path = require('path');
      const fullPath = path.join(__dirname, '..', pdf.filePath);

      if (!fs.existsSync(fullPath)) {
        return res.status(404).send('PDF file not found on server.');
      }

      return res.sendFile(fullPath);
    }

    // Handle Cloudinary-hosted files or remote URLs
    if (pdf.storageType === 'cloudinary' || pdf.public_id) {
      if (await streamPdfFromUrl(pdf.url, res, 'Direct Cloudinary URL')) {
        return;
      }

      const served = await trySignedCloudinaryStream(pdf, res, true);
      if (served) return;

      return res.status(404).send('Unable to fetch PDF from Cloudinary. Please re-upload the file.');
    }

    // Generic remote URL fallback (non-Cloudinary)
    if (await streamPdfFromUrl(pdf.url, res, 'Direct URL')) {
      return;
    }

    return res.status(404).send('PDF source unavailable.');
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
module.exports.sendMailchimpCampaign = sendMailchimpCampaign; // exported for tests
