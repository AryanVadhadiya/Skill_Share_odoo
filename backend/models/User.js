const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    location: {
        type: String,
        trim: true
    },
    profilePhoto: {
        type: String
    },
    skillsOffered: [{
        type: String,
        trim: true
    }],
    skillDescriptions: {
        type: Map,
        of: String,
        default: {}
    },
    skillsWanted: [{
        type: String,
        trim: true
    }],
    availability: {
        weekdays: { type: Boolean, default: false },
        weekends: { type: Boolean, default: false },
        evenings: { type: Boolean, default: false },
        mornings: { type: Boolean, default: false }
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        default: 3.5,
        min: 0,
        max: 5
    },
    totalRatings: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 