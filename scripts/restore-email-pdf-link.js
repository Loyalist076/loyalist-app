// One-time fix: the Aug 21 press release email links to a Pdf _id that was
// deleted and re-uploaded. Re-create the old _id pointing at the current record
// so the emailed "View Press Release" button opens the PDF again.
// Run on the server: node scripts/restore-email-pdf-link.js
require('dotenv').config();
const mongoose = require('mongoose');
const Pdf = require('../models/Pdf');

const OLD_ID = '6a88c8104ebb1ae029fe3c12'; // id in the sent email (deleted)
const CURRENT_ID = '6a88c8914ebb1ae029fe3c2c'; // live record for the same press release

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  if (await Pdf.findById(OLD_ID)) {
    console.log('Old id already exists — nothing to do.');
  } else {
    const current = await Pdf.findById(CURRENT_ID).lean();
    if (!current) throw new Error(`Current record ${CURRENT_ID} not found`);
    const { _id, createdAt, updatedAt, __v, ...fields } = current;
    await Pdf.collection.insertOne({ _id: new mongoose.Types.ObjectId(OLD_ID), ...fields, createdAt, updatedAt });
    console.log(`✅ Restored ${OLD_ID} → same PDF as ${CURRENT_ID}. Emailed link works again.`);
  }

  await mongoose.disconnect();
})();
