const express = require('express');
const router = express.Router();
const {
  subscribe,
  getAllSubscribers,
  deleteSubscriber
} = require('../controllers/subscriptionController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.post('/', subscribe);
router.get('/', authenticate, isAdmin, getAllSubscribers);
router.delete('/:id', authenticate, isAdmin, deleteSubscriber);

module.exports = router;
