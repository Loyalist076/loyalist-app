// Intensive scenario test for the press-release email flow.
// Run: node scripts/test-press-release-scenario.js
// No DB, no Cloudinary, no Mailchimp — everything external is stubbed.
// Simulates: upload → email link captured → delete → stale link redirects →
// replace keeps the same id and sends no email.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');

process.env.MAILCHIMP_API_KEY = 'test-key';
process.env.MAILCHIMP_SERVER_PREFIX = 'us6';
process.env.MAILCHIMP_AUDIENCE_ID = 'aud123';
process.env.BASE_URL = 'http://test.local';
process.env.CLOUDINARY_CLOUD_NAME = 'test';
process.env.CLOUDINARY_API_KEY = 'test';
process.env.CLOUDINARY_API_SECRET = 'test';

// --- Stub axios (Mailchimp calls) ---
const axios = require('axios');
const mailchimpCalls = [];
axios.post = async (url, body) => { mailchimpCalls.push(['POST', url, body]); return { data: { id: 'camp1' } }; };
axios.put = async (url, body) => { mailchimpCalls.push(['PUT', url, body]); return { data: {} }; };

// --- Stub auth + multer before the router is loaded ---
const auth = require('../middleware/auth');
auth.authenticate = (req, res, next) => next();
auth.isAdmin = (req, res, next) => next();
const upload = require('../middleware/upload');
let fakeFile = null;
upload.tempUpload.single = () => (req, res, next) => { req.file = fakeFile; next(); };

// --- Stub the Pdf model (in-memory store, no MongoDB) ---
const Pdf = require('../models/Pdf');
const store = new Map();
Pdf.prototype.save = async function () { store.set(String(this._id), this); return this; };
Pdf.findById = async (id) => store.get(String(id)) || null;
Pdf.findByIdAndDelete = async (id) => { const doc = store.get(String(id)); store.delete(String(id)); return doc; };

// --- Stub cloudinary uploads (for the replace-with-file test) ---
const cloudinary = require('cloudinary').v2;
cloudinary.uploader.upload = async () => ({ secure_url: 'https://cloudinary.test/new.pdf', public_id: 'pdfs/new' });
cloudinary.uploader.destroy = async () => ({ result: 'ok' });

const pdfRoutes = require('../routes/pdfRoutes');
const { buildCampaignHtml } = pdfRoutes;

const app = express();
app.use(express.urlencoded({ extended: true })); // multer normally parses fields; our stub bypasses it
app.use('/api/pdf', pdfRoutes);
const server = http.createServer(app).listen(0);
const port = server.address().port;
const call = (method, urlPath, fields) =>
  fetch(`http://127.0.0.1:${port}${urlPath}`, {
    method,
    redirect: 'manual',
    headers: fields ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {},
    body: fields ? new URLSearchParams(fields).toString() : undefined,
  });

// A tiny stand-in PDF file for the local-storage upload path
const scratchPdf = path.join(__dirname, 'tmp-test.pdf');
const writeScratch = () => fs.writeFileSync(scratchPdf, '%PDF-1.4\n%%EOF\n');

(async () => {
  // 1) The campaign HTML contains the View Press Release button with the link
  const html = buildCampaignHtml('My Release', 'http://test.local/api/pdf/view/abc');
  assert.ok(html.includes('View Press Release'), 'button text present');
  assert.ok(html.includes('href="http://test.local/api/pdf/view/abc"'), 'button links to the view URL');

  // 2) Upload → record saved + exactly one Mailchimp campaign sent with that record's id
  writeScratch();
  fakeFile = { path: scratchPdf };
  const uploadRes = await call('POST', '/api/pdf/upload', { title: 'Test Release', date: '2026-08-22', useLocal: 'true' });
  assert.strictEqual(uploadRes.status, 201, 'upload succeeds');
  const emailedId = (await uploadRes.json()).pdf.viewUrl.split('/').pop();
  assert.ok(store.has(emailedId), 'record exists after upload');
  assert.strictEqual(mailchimpCalls.filter(c => c[1].endsWith('/actions/send')).length, 1, 'exactly one campaign send after upload');
  assert.ok(mailchimpCalls.find(c => c[1].endsWith('/content'))[2].html.includes(emailedId), 'emailed HTML contains the record id');

  // 3) The emailed link works while the record exists
  const viewOk = await call('GET', `/api/pdf/view/${emailedId}`);
  assert.strictEqual(viewOk.status, 200, 'emailed link serves the PDF');
  assert.ok((viewOk.headers.get('content-type') || '').includes('application/pdf'), 'served as PDF');

  // 4) THE BUG SCENARIO: delete the record → emailed link must NOT dead-end in a 404
  assert.strictEqual((await call('DELETE', `/api/pdf/${emailedId}`)).status, 200, 'delete succeeds');
  const stale = await call('GET', `/api/pdf/view/${emailedId}`);
  assert.strictEqual(stale.status, 302, 'stale emailed link redirects instead of 404');
  assert.strictEqual(stale.headers.get('location'), '/page/press-release', 'redirects to the press release page');

  // 5) Re-upload (what happened on Aug 21) → new id ≠ emailed id, and a SECOND email goes out
  writeScratch();
  fakeFile = { path: scratchPdf };
  const newId = (await (await call('POST', '/api/pdf/upload', { title: 'Test Release', date: '2026-08-22', useLocal: 'true' })).json()).pdf.viewUrl.split('/').pop();
  assert.notStrictEqual(newId, emailedId, 're-upload creates a different id (this is what broke the email)');
  assert.strictEqual(mailchimpCalls.filter(c => c[1].endsWith('/actions/send')).length, 2, 're-upload sends a second campaign — why delete+re-upload is dangerous');

  // 6) THE FIX: replace keeps the SAME id and sends NO email
  const callsBefore = mailchimpCalls.length;
  fakeFile = null;
  const rep = await call('PUT', `/api/pdf/replace/${newId}`, { title: 'Corrected Title' });
  assert.strictEqual(rep.status, 200, 'replace succeeds');
  assert.ok(store.has(newId), 'same id still exists after replace');
  assert.strictEqual(store.get(newId).title, 'Corrected Title', 'title updated in place');
  assert.strictEqual(mailchimpCalls.length, callsBefore, 'replace sent NO email');
  assert.strictEqual((await call('GET', `/api/pdf/view/${newId}`)).status, 200, 'link still works after replace');

  // 7) Replace with a new FILE also keeps the id (cloudinary stubbed)
  writeScratch();
  fakeFile = { path: scratchPdf };
  const repFile = await call('PUT', `/api/pdf/replace/${newId}`, { title: 'Corrected Title' });
  assert.strictEqual(repFile.status, 200, 'replace with file succeeds');
  assert.strictEqual(store.get(newId).url, 'https://cloudinary.test/new.pdf', 'file swapped on same record');
  assert.strictEqual(store.get(newId).storageType, 'cloudinary', 'storage type updated');
  assert.strictEqual(mailchimpCalls.length, callsBefore, 'still no email sent by replace');

  // cleanup files created by the useLocal upload path
  const uploadsDir = path.join(__dirname, '..', 'public', 'uploads', 'press-releases');
  fs.readdirSync(uploadsDir).filter(f => f.includes('Test-Release')).forEach(f => fs.unlinkSync(path.join(uploadsDir, f)));
  if (fs.existsSync(scratchPdf)) fs.unlinkSync(scratchPdf);

  server.close();
  console.log('✅ ALL SCENARIO TESTS PASSED');
  console.log('   1. Email HTML contains View Press Release button with correct link');
  console.log('   2. Upload saves record + sends exactly one campaign with that id');
  console.log('   3. Emailed link serves the PDF while record exists');
  console.log('   4. Deleted record → emailed link redirects to press-release page (no more 404)');
  console.log('   5. Re-upload proven to create a new id + send a second email (the Aug 21 bug)');
  console.log('   6. Replace keeps same id, updates title, sends NO email');
  console.log('   7. Replace with new file keeps same id, sends NO email');
})().catch(err => { server.close(); console.error('❌ TEST FAILED:', err.message); process.exit(1); });
