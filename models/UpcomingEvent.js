const mongoose = require('mongoose');

const upcomingEventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Event title is required'],
        trim: true,
        minlength: [5, 'Title must be at least 5 characters']
    },
    date: {
        type: Date,
        required: [true, 'Event date is required'],
        validate: {
            validator: function (value) {
                return value >= new Date();
            },
            message: 'Event date must be today or in the future'
        }
    },
    description: {
        type: String,
        required: [true, 'Event description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters']
    }
}, { timestamps: true });

module.exports = mongoose.model('UpcomingEvent', upcomingEventSchema);
