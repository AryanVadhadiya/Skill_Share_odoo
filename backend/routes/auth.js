const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
// Add Cloudinary dependencies
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const config = require('../config');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer-storage-cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: process.env.CLOUDINARY_PROFILE_PHOTO_FOLDER || 'profile_photos',
    allowed_formats: (process.env.CLOUDINARY_ALLOWED_FORMATS || 'jpg,jpeg,png,gif').split(','),
    transformation: [
      (() => {
        const t = process.env.CLOUDINARY_IMAGE_TRANSFORMATION || 'width:400,height:400,crop:limit';
        // Convert 'width:400,height:400,crop:limit' to { width: 400, height: 400, crop: 'limit' }
        return Object.fromEntries(t.split(',').map(pair => {
          const [k, v] = pair.split(':');
          return [k.trim(), isNaN(v) ? v.trim() : Number(v)];
        }));
      })()
    ],
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: (parseInt(process.env.CLOUDINARY_FILE_SIZE_LIMIT_MB, 10) || 5) * 1024 * 1024 }, // MB to bytes
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const router = express.Router();

// Register user
router.post('/register', [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        console.log('Register request body:', req.body);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, location } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            console.log('User already exists:', email);
            return res.status(400).json({ message: 'User already exists' });
        }

                // Generate random initial rating between 3.5 and 4.2
        const initialRating = Math.round((Math.random() * (4.2 - 3.5) + 3.5) * 10) / 10;
        console.log(`Generated initial rating for ${email}: ${initialRating}`);

        // Create new user
        user = new User({
            name,
            email,
            password,
            location,
            rating: initialRating,
            totalRatings: 0
        });

        await user.save();

        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: process.env.JWT_EXPIRY || '7d' }
        );

        // Return full user object (minus password)
        const userObj = await User.findById(user._id).select('-password');
        res.status(201).json({
            token,
            user: userObj
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
    }
});

// Login user
router.post('/login', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if user is banned
        if (user.isBanned) {
            return res.status(403).json({ message: 'Account has been banned' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        // Return full user object (minus password)
        const userObj = await User.findById(user._id).select('-password');
        res.json({
            token,
            user: userObj
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload profile photo
router.post('/upload-photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePhoto: req.file.path },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
