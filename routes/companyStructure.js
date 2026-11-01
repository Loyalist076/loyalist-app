const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyStructureController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.get('/', companyController.getCompanyStructure);
router.post('/', authenticate, isAdmin, companyController.postCompanyStructure);

module.exports = router;
