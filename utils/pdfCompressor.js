const { PDFDocument } = require('pdf-lib');

const MIN_SIZE_BYTES = 2 * 1024 * 1024; // Skip compression for small files (<2MB)

/**
 * Compress a PDF buffer by re-encoding it with object streams.
 * Falls back to the original buffer if compression fails.
 * @param {Buffer} buffer
 * @returns {Promise<Buffer>}
 */
async function compressPdfBuffer(buffer) {
  if (!buffer || buffer.length < MIN_SIZE_BYTES) {
    return buffer;
  }

  try {
    const pdfDoc = await PDFDocument.load(buffer, { updateMetadata: false });
    const compressed = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false
    });

    return Buffer.from(compressed);
  } catch (err) {
    console.error('PDF compression failed, using original buffer:', err.message);
    return buffer;
  }
}

module.exports = { compressPdfBuffer };
