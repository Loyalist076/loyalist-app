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
    const html = buildCampaignHtml(title, pdfViewUrl);
    await axios.put(`${base}/campaigns/${campaign.id}/content`, { html }, { headers });

    // 3) Send it
    await axios.post(`${base}/campaigns/${campaign.id}/actions/send`, {}, { headers });
    console.log(`✅ Mailchimp campaign sent for "${title}".`);
  } catch (error) {
    console.error('❌ Mailchimp campaign error:', error.response?.data || error.message);
  }
};

// Builds the campaign HTML. Split out so a test send can render the exact same markup.
const buildCampaignHtml = (title, pdfViewUrl) => {
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8"> 
    <meta name="viewport" content="width=device-width"> 
    <meta http-equiv="X-UA-Compatible" content="IE=edge"> 
    <meta name="x-apple-disable-message-reformatting"> 
    <title>Loyalist Exploration - Press Release</title>
    
    <style>
        /* Basic reset */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; }

        /* General styles */
        body {
            margin: 0;
            padding: 0;
            width: 100% !important;
            font-family: Arial, Helvetica, sans-serif;
            background-color: #f4f4f4;
        }
        table {
            border-collapse: collapse !important;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .gold-bg {
            background-color: #d3a449;
            color: #ffffff;
        }
        .black-bg {
            background-color: #000000;
            color: #ffffff;
        }
        .btn {
            display: inline-block;
            background-color: #d3a449;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 16px;
        }
        
        /* Mobile layout styling */
        @media screen and (max-width: 600px) {
            .stack-column {
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
                text-align: center !important;
                padding: 0 !important;
            }
            .stack-column img {
                margin: 0 auto 15px auto !important;
            }
            .stack-column h4, .stack-column p, .stack-column div {
                text-align: center !important;
            }
            .mobile-padding {
                padding: 15px !important;
            }
            .date-right {
                text-align: left !important;
                padding-top: 5px !important;
            }
        }
    </style>
</head>
<body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #f4f4f4;">
    <center style="width: 100%; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto;" class="container">
            <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: auto;">
                
                <!-- Header / Logo -->
                <tr>
                    <td style="padding: 20px 0; text-align: center; background-color: #ffffff;">
                        <a href="https://loyalistexploration.com/">
                            <img src="https://loyalistexploration.com/image/logo.webp" alt="Loyalist Exploration" style="max-height: 60px; display: inline-block; border: 0;">
                        </a>
                    </td>
                </tr>

                <!-- Hero Banner -->
                <tr>
                    <td style="position: relative; text-align: center;">
                        <img src="https://res.cloudinary.com/dntahkr0a/image/upload/v1782890084/Sept._10_100_PM_MT_-_2026-07-01T115307.473_vfycb7.png" alt="Welcome to Loyalist Exploration" width="100%" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0;">
                    </td>
                </tr>

                <!-- Press Release Bar -->
                <tr>
                    <td bgcolor="#000000" style="background-color: #000000; padding: 12px 30px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                                <td style="text-align: left;" width="50%">
                                    <h3 style="color: #d3a449; font-size: 16px; margin: 0; font-family: Arial, sans-serif;">Press Release</h3>
                                </td>
                                <td style="text-align: right;" width="50%" class="date-right">
                                    <h3 style="color: #d3a449; font-size: 16px; margin: 0; font-family: Arial, sans-serif;">${currentDate}</h3>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Main Content -->
                <tr>
                    <td style="padding: 40px 30px; font-family: Arial, sans-serif; background-color: #ffffff;" class="mobile-padding">
                        <h2 style="margin-top: 0; margin-bottom: 10px; font-size: 22px; font-weight: bold; text-align: center; color: #000000; line-height: 1.4;">
                            ${title}
                        </h2>
                        <p style="text-align: center; color: #666666; margin-bottom: 30px; font-size: 15px;">
                            ${currentDate}
                        </p>
                        <div style="text-align: center;">
                            <a href="${pdfViewUrl}" class="btn" style="color:#ffffff;" target="_blank">View Press Release</a>
                        </div>
                    </td>
                </tr>

                <!-- Our Portfolio Bar -->
                <tr>
                    <td bgcolor="#000000" style="background-color: #000000; color: #ffffff; padding: 12px 30px; border-top: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">
                        <h3 style="color: #d3a449; font-size: 16px; margin: 0; font-family: Arial, sans-serif;">Our Portfolio</h3>
                    </td>
                </tr>

                <!-- Portfolio Items Container -->
                <tr>
                    <td style="padding: 20px 30px; background-color: #f8f8f8;" class="mobile-padding">
                        <!-- Box Wrapper -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 2px solid #000000; background-color: #ffffff;">
                            
                            <!-- TULLY -->
                            <tr>
                                <td style="padding: 20px; border-bottom: 1px solid #000000;">
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                        <tr>
                                            <th class="stack-column" width="50%" valign="top" style="font-weight: normal; text-align: left; padding-right: 15px;">
                                                <h4 style="margin: 0 0 10px 0; font-family: Arial, sans-serif; font-size: 18px; color: #000000;">TULLY–High Grade Gold</h4>
                                                <p style="margin: 0 0 20px 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #444444;">
                                                    A high-grade gold project progressing steadily toward production permitting. Tully benefits from strong geological continuity, favorable infrastructure access, and ongoing technical studies aimed at optimizing development timelines and economic returns.
                                                </p>
                                                <a href="https://loyalistexploration.com/page/tully-project.html" class="btn" style="color:#ffffff;">Learn More</a>
                                            </th>
                                            <th class="stack-column" width="50%" valign="top" style="font-weight: normal;">
                                                <img src="https://loyalistexploration.com/image/SPGMI%20Map%20-%202025-10-3.png" alt="Tully Map" width="100%" style="max-width: 250px; display: block; border: 1px solid #dddddd;">
                                            </th>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- LOVELAND -->
                            <tr>
                                <td style="padding: 20px; border-bottom: 1px solid #000000;">
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                        <tr>
                                            <th class="stack-column" width="50%" valign="top" style="font-weight: normal; padding-right: 15px;">
                                                <img src="https://loyalistexploration.com/image/abc.jpeg" alt="Loveland Map" width="100%" style="max-width: 250px; display: block; border: 1px solid #dddddd;">
                                            </th>
                                            <th class="stack-column" width="50%" valign="top" style="font-weight: normal; text-align: right;">
                                                <h4 style="margin: 0 0 10px 0; font-family: Arial, sans-serif; font-size: 18px; color: #000000; text-align: right;">Loveland Project</h4>
                                                <p style="margin: 0 0 20px 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #444444; text-align: right;">
                                                    A diversified exploration project targeting nickel, copper, and gold mineralization. Loveland presents considerable upside through its multi-commodity potential, with ongoing exploration programs focused on identifying and expanding high-value mineral zones.
                                                </p>
                                                <div style="text-align: right;">
                                                    <a href="https://loyalistexploration.com/page/loveland-project.html" class="btn" style="color:#ffffff;">Learn More</a>
                                                </div>
                                            </th>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- GOLD RUSH -->
                            <tr>
                                <td style="padding: 20px; border-bottom: 1px solid #000000;">
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                        <tr>
                                            <th class="stack-column" width="50%" valign="top" style="font-weight: normal; text-align: left; padding-right: 15px;">
                                                <h4 style="margin: 0 0 10px 0; font-family: Arial, sans-serif; font-size: 18px; color: #000000;">Gold Rush</h4>
                                                <p style="margin: 0 0 20px 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #444444;">
                                                    Gold Rush is a known VMS exploration project for gold, copper, and nickel, located 30 km west of Timmins in the Abitibi Greenstone Belt. It hosts multiple high-grade gold zones identified through drilling and surface sampling.
                                                </p>
                                                <a href="https://loyalistexploration.com/page/gold-rush.html" class="btn" style="color:#ffffff;">Learn More</a>
                                            </th>
                                            <th class="stack-column" width="50%" valign="top" style="font-weight: normal;">
                                                <img src="https://loyalistexploration.com/image/def.jpeg" alt="Gold Rush Map" width="100%" style="max-width: 250px; display: block; border: 1px solid #dddddd;">
                                            </th>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- DESANTIS -->
                            <tr>
                                <td style="padding: 20px;">
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                        <tr>
                                            <th class="stack-column" width="50%" valign="top" style="font-weight: normal; padding-right: 15px;">
                                                <img src="https://loyalistexploration.com/image/DeSantis%20Map.png" alt="DeSantis Map" width="100%" style="max-width: 250px; display: block; border: 1px solid #dddddd;">
                                            </th>
                                            <th class="stack-column" width="50%" valign="top" style="font-weight: normal; text-align: right;">
                                                <h4 style="margin: 0 0 10px 0; font-family: Arial, sans-serif; font-size: 18px; color: #000000; text-align: right;">DeSantis Gold Project</h4>
                                                <p style="margin: 0 0 20px 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #444444; text-align: right;">
                                                    A past-producing gold mine covering 850 hectares along the Destor-Porcupine Deformation Zone, 4.5 km southwest of Timmins, with historical production of 35,784 oz Au and high-grade historical resource estimates.
                                                </p>
                                                <div style="text-align: right;">
                                                    <a href="https://loyalistexploration.com/page/desantis-project.html" class="btn" style="color:#ffffff;">Learn More</a>
                                                </div>
                                            </th>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>

                <!-- What You Can Expect Bar -->
                <tr>
                    <td bgcolor="#000000" style="background-color: #000000; color: #ffffff; padding: 12px 30px; border-bottom: 2px solid #ffffff;">
                        <h3 style="color: #d3a449; font-size: 16px; margin: 0; font-family: Arial, sans-serif;">What You Can Expect</h3>
                    </td>
                </tr>

                <!-- Expectation Text -->
                <tr>
                    <td style="padding: 30px; color: #333333; font-size: 15px; line-height: 1.6; font-family: Arial, sans-serif; background-color: #ffffff;" class="mobile-padding">
                        <p style="margin-top: 0;">As a subscriber, you'll receive:</p>
                        <ul style="margin-top: 10px; margin-bottom: 20px; padding-left: 20px; color: #444444;">
                            <li style="margin-bottom: 8px;">Corporate news and exploration updates</li>
                            <li style="margin-bottom: 8px;">Drill results and project milestones</li>
                            <li style="margin-bottom: 8px;">Investor presentations and company insights</li>
                            <li style="margin-bottom: 8px;">Event and webinar invitations</li>
                        </ul>
                        <p>Thank you for being part of our journey as we unlock value across the Timmins Mining Camp.</p>
                        <p style="margin-top: 25px;">
                            <a href="https://loyalistexploration.com/page/contact.html" class="btn" style="color:#ffffff;">Contact Us</a>
                        </p>
                        <p style="margin-top: 30px; font-weight: bold; color: #000000;">
                            Stay informed. Follow our progress. Discover what's next with Loyalist Exploration.
                        </p>
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td bgcolor="#000000" class="mobile-padding" style="background-color: #000000; color: #ffffff; padding: 40px 30px; text-align: center; font-family: Arial, sans-serif;">
                        
                        <!-- Social Icons using Base64 or stable CDN links for email compatibility -->
                        <div style="margin-bottom: 25px;">
                            <a href="https://www.linkedin.com/company/loyalist-exploration-limited/" style="text-decoration: none; margin: 0 10px;">
                                <img src="https://img.icons8.com/ios-filled/50/ffffff/linkedin.png" width="28" height="28" alt="LinkedIn" style="border: 0; display: inline-block;">
                            </a>
                            <a href="https://x.com/LoyalistExp" style="text-decoration: none; margin: 0 10px;">
                                <img src="https://img.icons8.com/ios-filled/50/ffffff/twitterx--v1.png" width="28" height="28" alt="X" style="border: 0; display: inline-block;">
                            </a>
                            <a href="https://www.facebook.com/people/Loyalist-Exploration/61575711082978/" style="text-decoration: none; margin: 0 10px;">
                                <img src="https://img.icons8.com/ios-filled/50/ffffff/facebook-new.png" width="28" height="28" alt="Facebook" style="border: 0; display: inline-block;">
                            </a>
                            <a href="https://www.youtube.com/@LoyalistExploration" style="text-decoration: none; margin: 0 10px;">
                                <img src="https://img.icons8.com/ios-filled/50/ffffff/youtube-play.png" width="28" height="28" alt="YouTube" style="border: 0; display: inline-block;">
                            </a>
                            <a href="https://www.instagram.com/loyalistexploration/" style="text-decoration: none; margin: 0 10px;">
                                <img src="https://img.icons8.com/ios-filled/50/ffffff/instagram-new.png" width="28" height="28" alt="Instagram" style="border: 0; display: inline-block;">
                            </a>
                        </div>
                        
                        <div style="border-top: 1px solid #333333; margin: 25px 0;"></div>
                        
                        <h4 style="color: #d3a449; margin: 0 0 15px 0; font-size: 16px;">Contact Information</h4>
                        <p style="color: #ffffff; margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">Email:</p>
                        <p style="color: #ffffff; margin: 0 0 15px 0; font-size: 14px;"><a href="mailto:efarr@loyalistexploration.com" style="color: #ffffff; text-decoration: none;">efarr@loyalistexploration.com</a></p>
                        
                        <p style="color: #ffffff; margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">Phone:</p>
                        <p style="color: #ffffff; margin: 0 0 15px 0; font-size: 14px;"><a href="tel:+16472961270" style="color: #ffffff; text-decoration: none;">+1 647‑296‑1270</a></p>
                        
                        <p style="color: #ffffff; margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">Address:</p>
                        <p style="color: #ffffff; margin: 0 0 25px 0; font-size: 14px; line-height: 1.5;">110 Yonge Street, Suite 1601<br>Toronto, Ontario M5C1T4</p>

                        <div style="border-top: 1px solid #333333; margin: 25px 0;"></div>
                        
                        <p style="font-size: 12px; color: #bbbbbb; margin: 0 0 10px 0;">© 2025 Loyalist Exploration Limited. All rights reserved.</p>
                        <p style="font-size: 11px; color: #888888; margin: 0; line-height: 1.5;">
                            Thanks for subscribing to Loyalist Exploration. You're receiving this email to stay updated on our news and announcements. By subscribing, you agree to our Terms of Use and Privacy Policy. You can unsubscribe at any time using the link below.
                        </p>
                    </td>
                </tr>

            </table>
        </div>
    </center>
</body>
</html>`;
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
module.exports.buildCampaignHtml = buildCampaignHtml; // exported for tests + test sends
