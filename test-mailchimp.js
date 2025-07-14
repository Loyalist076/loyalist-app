// test-mailchimp.js
const axios = require('axios');

const MAILCHIMP_API_KEY = 'c38100b77d1e065847171456b3a24ee1-us6';
const MAILCHIMP_SERVER_PREFIX = 'us6';
const MAILCHIMP_AUDIENCE_ID = 'b8d99f755e';
const email = 'swayamgandhi6@gmail.com';

const mailchimpUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`;

axios.post(mailchimpUrl, {
  email_address: email,
  status: 'subscribed'
}, {
  headers: {
    Authorization: `apikey ${MAILCHIMP_API_KEY}`,
    'Content-Type': 'application/json'
  }
})
.then(res => console.log('✅ Mailchimp success:', res.data))
.catch(err => console.error('❌ Mailchimp error:', err.response?.data || err.message));
