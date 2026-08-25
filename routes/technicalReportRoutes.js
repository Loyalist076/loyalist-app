const express = require('express');
const router = express.Router();
const technicalReportController = require('../controllers/technicalReportController');
const { authenticate, isAdmin } = require('../middleware/auth');
const { createPdfUpload } = require('../middleware/upload');

const technicalReportUpload = createPdfUpload('public/uploads/technical-reports');

// Routes (protected)
router.post('/upload', authenticate, isAdmin, technicalReportUpload.single('pdfFile'), technicalReportController.createReport);

router.get('/', technicalReportController.getAllReports);

router.delete('/:id', authenticate, isAdmin, technicalReportController.deleteReport);

module.exports = router;
