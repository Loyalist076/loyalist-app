const UpcomingEvent = require('../models/UpcomingEvent');

// Get all events (sorted by date ascending)
exports.getAllEvents = async (req, res) => {
  try {
    console.log("Fetching events...");
    const events = await UpcomingEvent.find().sort({ date: 1});
    console.log("Sending 200 response");
    return res.status(200).json(events);
  } catch (err) {
    console.error("Error caught, sending 500 response");
    return res.status(500).json({ message: 'Server error while fetching events' });
  }
};

// Create a new event
exports.createEvent = async (req, res) => {
    const { title, date, description } = req.body;

    if (!title || !date || !description) {
        return res.status(400).json({ message: 'Title, date, and description are required' });
    }

    try {
        const event = new UpcomingEvent({ title, date, description });
        const savedEvent = await event.save();
        res.status(201).json(savedEvent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create event' });
    }
};

// Update an existing event
exports.updateEvent = async (req, res) => {
    const { title, date, description } = req.body;

    try {
        const updatedEvent = await UpcomingEvent.findByIdAndUpdate(
            req.params.id,
            { title, date, description },
            { new: true, runValidators: true }
        );

        if (!updatedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json(updatedEvent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update event' });
    }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
    try {
        const deletedEvent = await UpcomingEvent.findByIdAndDelete(req.params.id);

        if (!deletedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete event' });
    }
};
