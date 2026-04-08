/**
 * Email Service - Centralized email sending logic
 * @module emailService
 */

const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const { config } = require('../config');
const logger = require('../utils/logger');

// Configure SendGrid
if (config.sendgrid.apiKey) {
  sgMail.setApiKey(config.sendgrid.apiKey);
}

// Configure Nodemailer for Gmail
const gmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.gmail.user,
    pass: config.gmail.appPassword
  }
});

/**
 * Send email via SendGrid
 * @param {Object} options - Email options
 * @param {string|string[]} options.to - Recipient(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} [options.from] - Sender email
 * @returns {Promise<void>}
 */
const sendWithSendGrid = async ({ to, subject, html, from }) => {
  if (!config.sendgrid.isConfigured) {
    logger.warn('SendGrid not configured, skipping email');
    return;
  }

  const msg = {
    to,
    from: from || config.gmail.user,
    subject,
    html
  };

  try {
    if (Array.isArray(to) && to.length > 1) {
      await sgMail.sendMultiple(msg);
    } else {
      await sgMail.send(msg);
    }
    logger.info(`Email sent via SendGrid to ${Array.isArray(to) ? to.length + ' recipients' : to}`);
  } catch (error) {
    logger.error('SendGrid error:', error.response?.body || error.message);
    throw error;
  }
};

/**
 * Send email via Gmail/Nodemailer
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @returns {Promise<void>}
 */
const sendWithGmail = async ({ to, subject, html }) => {
  try {
    await gmailTransporter.sendMail({
      from: config.gmail.user,
      to,
      subject,
      html
    });
    logger.info(`Email sent via Gmail to ${to}`);
  } catch (error) {
    logger.error('Gmail error:', error.message);
    throw error;
  }
};

/**
 * Send newsletter to all subscribers
 * @param {string} subject - Newsletter subject
 * @param {string} pdfUrl - PDF URL to include
 * @param {Array} subscribers - Array of subscriber objects with email property
 * @returns {Promise<void>}
 */
const sendNewsletter = async (subject, pdfUrl, subscribers) => {
  if (!subscribers || subscribers.length === 0) {
    logger.info('No subscribers to notify');
    return;
  }

  const emails = subscribers.map(sub => sub.email);
  const html = `
    <h2>${subject}</h2>
    <p>A new PDF update has been uploaded. You can view it below:</p>
    <p><a href="${pdfUrl}" target="_blank">📄 View PDF</a></p>
  `;

  await sendWithSendGrid({ to: emails, subject, html });
};

/**
 * Send contact form email
 * @param {Object} data - Contact form data
 * @param {string} data.name - Sender name
 * @param {string} data.email - Sender email
 * @param {string} data.subject - Message subject
 * @param {string} data.message - Message content
 * @returns {Promise<void>}
 */
const sendContactEmail = async ({ name, email, subject, message }) => {
  const html = `
    <h2>New Contact Form Submission</h2>
    <p><strong>From:</strong> ${name} (${email})</p>
    <p><strong>Subject:</strong> ${subject}</p>
    <p><strong>Message:</strong></p>
    <p>${message}</p>
  `;

  await sendWithGmail({
    to: config.gmail.user,
    subject: `Contact Form: ${subject}`,
    html
  });
};

module.exports = {
  sendWithSendGrid,
  sendWithGmail,
  sendNewsletter,
  sendContactEmail
};
