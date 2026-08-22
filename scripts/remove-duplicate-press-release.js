// Removes the duplicate press-release record (6a88c891...) left over after
// restoring the emailed ID (6a88c810...). DB-only delete — it does NOT touch
// the Cloudinary file, which the restored record still uses.
// A backup of the removed record is written next to this script first.
// Run: node scripts/remove-duplicate-press-release.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Pdf = require('../models/Pdf');

const DUPLICATE_ID = '6a88c8914ebb1ae029fe3c2c'; // newer duplicate (safe to remove)
const KEPT_ID = '6a88c8104ebb1ae029fe3c12'; // the id in the sent email (must stay)

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const kept = await Pdf.findById(KEPT_ID);
  if (!kept) throw new Error(`Refusing to delete: emailed record ${KEPT_ID} is missing — run restore-email-pdf-link.js first.`);

  const dup = await Pdf.findById(DUPLICATE_ID).lean();
  if (!dup) {
    console.log('Duplicate already removed — nothing to do.');
  } else {
    fs.writeFileSync(path.join(__dirname, `backup-${DUPLICATE_ID}.json`), JSON.stringify(dup, null, 2));
    await Pdf.findByIdAndDelete(DUPLICATE_ID);
    console.log(`✅ Duplicate removed. Website now lists the press release once (id ${KEPT_ID}, the one in the email). Backup saved.`);
  }

  await mongoose.disconnect();
})().catch(err => { console.error('❌', err.message); process.exit(1); });
