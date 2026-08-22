// Sends the real press-release campaign email to TEST recipients only, via
// Mailchimp's test-send endpoint. Never calls /actions/send, so the audience
// is never emailed. The draft campaign is deleted afterward.
// Run: node scripts/send-test-campaign.js
require('dotenv').config();
const axios = require('axios');
const { buildCampaignHtml } = require('../routes/pdfRoutes');

const TEST_EMAILS = ['swayam.midis@gmail.com', 'purujit.midis@gmail.com'];
const LIVE_PDF_ID = '6a88c8914ebb1ae029fe3c2c'; // current live press release

const base = `https://${process.env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0`;
const headers = { Authorization: `apikey ${process.env.MAILCHIMP_API_KEY}`, 'Content-Type': 'application/json' };

(async () => {
  // Use the real live press release so the button opens the actual PDF
  const { data: pdfs } = await axios.get('https://loyalistexploration.com/api/pdf/');
  const pdf = pdfs.find(p => p._id === LIVE_PDF_ID);
  if (!pdf) throw new Error(`Live PDF ${LIVE_PDF_ID} not found`);
  const viewUrl = `https://loyalistexploration.com/api/pdf/view/${pdf._id}`;
  console.log(`📄 Using live press release: "${pdf.title}"`);
  console.log(`🔗 Button will link to: ${viewUrl}`);

  // 1) Create a DRAFT campaign (never sent to the audience)
  const { data: campaign } = await axios.post(`${base}/campaigns`, {
    type: 'regular',
    recipients: { list_id: process.env.MAILCHIMP_AUDIENCE_ID },
    settings: {
      subject_line: `[TEST] ${pdf.title}`,
      title: `TEST ONLY - do not send: ${pdf.title}`,
      from_name: process.env.MAILCHIMP_FROM_NAME || 'Loyalist Exploration',
      reply_to: process.env.MAILCHIMP_REPLY_TO || 'loyalistexploration@gmail.com',
    },
  }, { headers });
  console.log(`📝 Draft campaign created: ${campaign.id}`);

  try {
    // 2) Same HTML the real campaign uses
    await axios.put(`${base}/campaigns/${campaign.id}/content`, { html: buildCampaignHtml(pdf.title, viewUrl) }, { headers });

    // 3) TEST send — goes ONLY to these addresses, never the audience
    await axios.post(`${base}/campaigns/${campaign.id}/actions/test`, { test_emails: TEST_EMAILS, send_type: 'html' }, { headers });
    console.log(`✉️ Test email sent to: ${TEST_EMAILS.join(', ')}`);
  } finally {
    // 4) Remove the draft so it can't be sent to the audience by accident
    await axios.delete(`${base}/campaigns/${campaign.id}`, { headers })
      .then(() => console.log('🗑️ Draft campaign deleted — nothing left in Mailchimp to send.'))
      .catch(err => console.error(`⚠️ Could not delete draft ${campaign.id} — delete it manually in Mailchimp:`, err.response?.data?.detail || err.message));
  }
})().catch(err => { console.error('❌ Test send failed:', err.response?.data || err.message); process.exit(1); });
