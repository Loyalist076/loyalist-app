const express = require('express');
const router = express.Router();
const upcomingEventController = require('../controllers/upcomingEventController');

// ================================
// Upcoming Events API Routes
// ================================

// @route   GET /api/upcoming-events
// @desc    Get all upcoming events   
router.get('/', upcomingEventController.getAllEvents);

// @route   POST /api/upcoming-events
// @desc    Create a new upcoming event
router.post('/', upcomingEventController.createEvent);

// @route   PUT /api/upcoming-events/:id
// @desc    Update an existing event by ID
router.put('/:id', upcomingEventController.updateEvent);

// @route   DELETE /api/upcoming-events/:id
// @desc    Delete an event by ID
router.delete('/:id', upcomingEventController.deleteEvent);

module.exports = router;
