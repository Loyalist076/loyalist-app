// Run: node routes/pdfRoutes.test.js
// Stubs axios so no real Mailchimp call is made; asserts the create→content→send flow.
const assert = require('assert');

process.env.MAILCHIMP_API_KEY = 'test-key';
process.env.MAILCHIMP_SERVER_PREFIX = 'us6';
process.env.MAILCHIMP_AUDIENCE_ID = 'aud123';

const axios = require('axios');
const calls = [];
axios.post = async (url, body) => { calls.push(['POST', url, body]); return { data: { id: 'camp1' } }; };
axios.put = async (url, body) => { calls.push(['PUT', url, body]); return { data: {} }; };

const { sendMailchimpCampaign } = require('./pdfRoutes');

(async () => {
  await sendMailchimpCampaign('Q2 Results', 'http://x/api/pdf/view/1');

  const base = 'https://us6.api.mailchimp.com/3.0';
  assert.strictEqual(calls.length, 3, 'expected 3 API calls');
  // 1) create campaign to the audience
  assert.deepStrictEqual([calls[0][0], calls[0][1]], ['POST', `${base}/campaigns`]);
  assert.strictEqual(calls[0][2].recipients.list_id, 'aud123');
  assert.strictEqual(calls[0][2].settings.subject_line, 'Q2 Results');
  // 2) set content, referencing the returned campaign id + the link
  assert.deepStrictEqual([calls[1][0], calls[1][1]], ['PUT', `${base}/campaigns/camp1/content`]);
  assert.ok(calls[1][2].html.includes('http://x/api/pdf/view/1'));
  // 3) send that campaign
  assert.deepStrictEqual([calls[2][0], calls[2][1]], ['POST', `${base}/campaigns/camp1/actions/send`]);

  // skips cleanly when unconfigured
  delete process.env.MAILCHIMP_API_KEY;
  calls.length = 0;
  await sendMailchimpCampaign('x', 'y');
  assert.strictEqual(calls.length, 0, 'should skip when not configured');

  console.log('✅ all assertions passed');
})();
