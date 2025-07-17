const express = require('express');
const router = express.Router();
const {
  subscribe,
  getAllSubscribers,
  deleteSubscriber
} = require('../controllers/subscriptionController');

router.post('/', subscribe);
router.get('/', getAllSubscribers);
router.delete('/:id', deleteSubscriber);

module.exports = router;
