const express = require('express');
const router = express.Router();
const upcomingEventController = require('../controllers/upcomingEventController');
const { authenticate, isAdmin } = require('../middleware/auth');

// ================================
// Upcoming Events API Routes
// ================================

// @route   GET /api/upcoming-events
// @desc    Get all upcoming events (public)
router.get('/', upcomingEventController.getAllEvents);

// @route   POST /api/upcoming-events
// @desc    Create a new upcoming event (admin only)
router.post('/', authenticate, isAdmin, upcomingEventController.createEvent);

// @route   PUT /api/upcoming-events/:id
// @desc    Update an existing event by ID (admin only)
router.put('/:id', authenticate, isAdmin, upcomingEventController.updateEvent);

// @route   DELETE /api/upcoming-events/:id
// @desc    Delete an event by ID (admin only)
router.delete('/:id', authenticate, isAdmin, upcomingEventController.deleteEvent);

module.exports = router;
