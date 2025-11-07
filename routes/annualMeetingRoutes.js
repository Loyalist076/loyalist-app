const express = require('express');
const router = express.Router();
const annualMeetingController = require('../controllers/annualMeetingController');
const { authenticate, isAdmin } = require('../middleware/auth');
const { tempUpload } = require('../middleware/upload');

// ================================
// Annual Meeting Documents API Routes
// ================================

// @route   GET /api/annual-meeting-documents
// @desc    Get all annual meeting documents (public)
// @query   ?year=2024&active=true
router.get('/', annualMeetingController.getAllDocuments);

// @route   GET /api/annual-meeting-documents/by-year
// @desc    Get documents grouped by year (public)
router.get('/by-year', annualMeetingController.getDocumentsByYear);

// @route   GET /api/annual-meeting-documents/years
// @desc    Get available years (public)
router.get('/years', annualMeetingController.getAvailableYears);

// @route   GET /api/annual-meeting-documents/view/:id
// @desc    View PDF inline (public, proxied through server)
router.get('/view/:id', annualMeetingController.viewDocument);

// @route   GET /api/annual-meeting-documents/download/:id
// @desc    Download PDF (public, proxied through server)
router.get('/download/:id', annualMeetingController.downloadDocument);

// @route   GET /api/annual-meeting-documents/:id
// @desc    Get single document by ID (public)
// NOTE: This route must come AFTER specific routes like /by-year, /years, /view, /download
router.get('/:id', annualMeetingController.getDocumentById);

// @route   POST /api/annual-meeting-documents
// @desc    Upload new annual meeting document (admin only)
router.post('/', authenticate, isAdmin, tempUpload.single('pdf'), annualMeetingController.uploadDocument);

// @route   PUT /api/annual-meeting-documents/:id
// @desc    Update document metadata (admin only)
router.put('/:id', authenticate, isAdmin, annualMeetingController.updateDocument);

// @route   DELETE /api/annual-meeting-documents/:id
// @desc    Delete document (admin only)
router.delete('/:id', authenticate, isAdmin, annualMeetingController.deleteDocument);

module.exports = router;
