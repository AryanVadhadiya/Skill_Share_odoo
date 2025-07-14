const mongoose = require('mongoose');

const swapSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    skillOffered: {
        type: String,
        required: true,
        trim: true
    },
    skillRequested: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
        default: 'pending'
    },
    message: {
        type: String,
        trim: true
    },
    requesterRating: {
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String, trim: true },
        date: { type: Date }
    },
    recipientRating: {
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String, trim: true },
        date: { type: Date }
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Swap', swapSchema); 