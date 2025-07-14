// loyalist-app/utils/emailService.js
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// ======= SMTP CONFIGURATION =======
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', 
  port: 587,              
  secure: false,        
  auth: {
    user: 'LoyalistExploration@gmail.com', 
    pass: 'dqvypwviyhexvjeh'        
  }
});

// Verify SMTP Connection on Startup
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ SMTP configuration error:', error.message);
  } else {
    console.log('✅ SMTP server is ready to take messages');
  }
});

// ======= FUNCTIONS =======

// Load Mailchimp HTML Template Locally
function getMailchimpTemplate() {
  const templatePath = path.join(__dirname, '../templates/emailTemplate.html');
  try {
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at ${templatePath}`);
    }
    const htmlContent = fs.readFileSync(templatePath, 'utf-8');
    console.log('✅ Mailchimp template loaded successfully from file');
    return htmlContent;
  } catch (err) {
    console.error('❌ Error loading Mailchimp template:', err.message);
    throw err;
  }
}

// Send Email Using Template
async function sendWelcomeEmail(toEmail) {
  console.log(`📨 Preparing to send welcome email to ${toEmail}...`);
  try {
    // Load HTML template
    const htmlContent = getMailchimpTemplate();

    // Setup mail options
    const mailOptions = {
      from: '"Loyalist Exploration" <LoyalistExploration@gmail.com>', 
      to: toEmail,                                                    
      subject: 'Welcome to Loyalist Exploration!',                   
      html: htmlContent                                              
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent successfully to ${toEmail} (Message ID: ${info.messageId})`);
    return info;
  } catch (err) {
    console.error(`❌ Failed to send welcome email to ${toEmail}:`, err.message);
    throw err;
  }
}

// Export function
module.exports = sendWelcomeEmail;
