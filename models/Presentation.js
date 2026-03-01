const mongoose = require('mongoose');

const presentationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Presentation', presentationSchema);
