const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financialController');
const { authenticate, isAdmin } = require('../middleware/auth');
const { financialUpload } = require('../middleware/upload');

// Routes (protected)
router.post('/upload', authenticate, isAdmin, financialUpload.single('pdfFile'), financialController.createStatement);

router.get('/', financialController.getAllStatements);

router.delete('/:id', authenticate, isAdmin, financialController.deleteStatement);

module.exports = router;
