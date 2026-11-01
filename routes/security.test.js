// Run: node routes/security.test.js
// Stubs the models, Mailchimp and SendGrid, so no database or real account is touched.
// Asserts admin-only routes stay closed and public routes stay open.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

process.env.JWT_SECRET = 'test-secret';
process.env.SENDGRID_API_KEY = 'SG.test';

const axios = require('axios');
const express = require('express');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const CompanyStructure = require('../models/CompanyStructure');
const Subscription = require('../models/Subscription');
const User = require('../models/User');

const users = {
  admin: { role: 'admin', isAdminApproved: true },
  pending: { role: 'admin', isAdminApproved: false },
  visitor: { role: 'user', isAdminApproved: true }
};
const reached = [];

User.findById = (id) => ({ select: async () => users[id] });
Subscription.find = () => ({
  sort: async () => { reached.push('list subscribers'); return []; }
});
Subscription.findByIdAndDelete = async () => { reached.push('delete subscriber'); return null; };
Subscription.findOne = async () => ({ email: 'a@b.co', _id: 'sub1' });
CompanyStructure.findOne = async () => {
  reached.push('company structure');
  return { save: async () => reached.push('save company structure') };
};
axios.put = async () => ({ data: {} });
sgMail.send = async () => { reached.push('send email'); };

const app = express();
app.use(express.json());
app.use('/api/subscribe', require('./subscriptionRoutes'));
app.use('/api/company-structure', require('./companyStructure'));
app.use('/api/test', require('./testRoutes'));

const adminOnly = [
  ['GET', '/api/subscribe'],
  ['DELETE', '/api/subscribe/abc'],
  ['POST', '/api/company-structure'],
  ['GET', '/api/test/test-sendgrid'],
  ['GET', '/api/test/test-cloudinary']
];

const server = app.listen(0, async () => {
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, url, as, body) => {
    const headers = { 'Content-Type': 'application/json' };
    if (as) headers.Authorization = `Bearer ${jwt.sign({ userId: as }, process.env.JWT_SECRET)}`;
    const res = await fetch(base + url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    return res.status;
  };

  try {
    // Admin-only routes turn everyone else away before reaching any data
    for (const [method, url] of adminOnly) {
      assert.strictEqual(await call(method, url), 401, `${method} ${url} without a token`);
      assert.strictEqual(await call(method, url, 'visitor'), 403, `${method} ${url} as a visitor`);
      assert.strictEqual(await call(method, url, 'pending'), 403, `${method} ${url} as a pending admin`);
    }
    assert.deepStrictEqual(reached, [], 'a closed route reached its handler');

    // Approved admins get through
    assert.strictEqual(await call('GET', '/api/subscribe', 'admin'), 200);
    assert.strictEqual(await call('DELETE', '/api/subscribe/abc', 'admin'), 404);
    assert.strictEqual(await call('POST', '/api/company-structure', 'admin', {}), 200);
    assert.deepStrictEqual(reached, [
      'list subscribers', 'delete subscriber', 'company structure', 'save company structure'
    ]);

    // Public routes stay public
    assert.strictEqual(await call('POST', '/api/subscribe', null, { email: 'a@b.co' }), 200);
    assert.strictEqual(await call('GET', '/api/company-structure'), 200);

    // Visitor text cannot become markup on admin pages
    const sandbox = {};
    const script = path.join(__dirname, '../public/admin/escape-html.js');
    vm.runInNewContext(fs.readFileSync(script, 'utf8'), sandbox);
    assert.strictEqual(
      sandbox.escapeHtml('<img src=x onerror="alert(1)">'),
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'
    );
    assert.strictEqual(sandbox.escapeHtml(undefined), '');

    console.log('OK: admin routes closed, public routes open, admin text escaped');
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
