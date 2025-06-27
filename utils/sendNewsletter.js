const sgMail = require('@sendgrid/mail');
const Subscriber = require('../models/Subscriber');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendNewsletterToAll = async (subject, textContent, pdfUrl) => {
  try {
    console.log("📨 Preparing to send newsletter...");

    const subscribers = await Subscriber.find();

    if (!subscribers.length) {
      console.log('⚠️ No subscribers found. Newsletter not sent.');
      return;
    }

    const emails = subscribers.map(sub => sub.email);
    console.log(`👥 Total Subscribers: ${emails.length}`);
    console.log('📬 Sending to:', emails.join(', '));
    console.log('📄 PDF URL:', pdfUrl);

    const msg = {
      to: emails,
      from: 'gandhiswayam772@gmail.com', // Must be verified in SendGrid
      subject: subject,
      html: `
        <h2>${subject}</h2>
        <p>${textContent}</p>
        <p>📄<strong><a href="${pdfUrl}" target="_blank" rel="noopener noreferrer">Download the PDF</a></strong><br></p>
      `,
    };

    await sgMail.sendMultiple(msg);
    console.log('✅ Newsletter sent to all subscribers successfully.');
  } catch (error) {
    console.error('❌ Error sending newsletter:');
    if (error.response && error.response.body && error.response.body.errors) {
      console.error(JSON.stringify(error.response.body.errors, null, 2));
    } else {
      console.error(error.message);
    }
  }
};

module.exports = sendNewsletterToAll;
