const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyStructureController');

router.get('/', companyController.getCompanyStructure);
router.post('/', companyController.postCompanyStructure);

module.exports = router;
