<<<<<<< HEAD
const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  title: String,
  url: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PDF', pdfSchema);
=======
const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  title: String,
  url: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PDF', pdfSchema);
>>>>>>> 9e0808d5ab29d3f3927d381c9b10252dd6cf5e30
