/**
 * Technical Report Service - Business logic for technical reports
 * @module technicalReportService
 */

const fs = require('fs');
const path = require('path');
const TechnicalReport = require('../../models/TechnicalReport');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Upload a new technical report
 * @param {Object} data - Report data
 * @param {string} data.title - Report title
 * @param {Object} data.file - Multer file object
 * @returns {Promise<Object>} Created report object
 */
const uploadReport = async ({ title, file }) => {
  const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
  const targetDir = path.join(__dirname, '../../public/uploads/technical-reports');
  const targetPath = path.join(targetDir, filename);

  // Ensure directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Move file from temp to target
  fs.copyFileSync(file.path, targetPath);
  fs.unlinkSync(file.path);

  const report = new TechnicalReport({
    title,
    url: `/uploads/technical-reports/${filename}`,
    filename
  });
  await report.save();

  return report;
};

/**
 * Get all active technical reports
 * @returns {Promise<Array>} Array of report objects
 */
const getActiveReports = async () => {
  return TechnicalReport.find({ isActive: true }).sort({ uploadedAt: -1 });
};

/**
 * Get all technical reports (admin)
 * @returns {Promise<Array>} Array of all report objects
 */
const getAllReports = async () => {
  return TechnicalReport.find().sort({ uploadedAt: -1 });
};

/**
 * Update report status
 * @param {string} id - Report ID
 * @param {boolean} isActive - Active status
 * @returns {Promise<Object>} Updated report
 * @throws {ApiError} If report not found
 */
const updateReportStatus = async (id, isActive) => {
  const report = await TechnicalReport.findByIdAndUpdate(
    id,
    { isActive },
    { new: true }
  );
  if (!report) {
    throw new ApiError(404, 'Technical report not found');
  }
  return report;
};

/**
 * Delete a technical report
 * @param {string} id - Report ID
 * @returns {Promise<void>}
 * @throws {ApiError} If report not found
 */
const deleteReport = async (id) => {
  const report = await TechnicalReport.findById(id);
  if (!report) {
    throw new ApiError(404, 'Technical report not found');
  }

  // Delete file from disk
  const filePath = path.join(__dirname, '../../public', report.url);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await report.deleteOne();
};

module.exports = {
  uploadReport,
  getActiveReports,
  getAllReports,
  updateReportStatus,
  deleteReport
};
