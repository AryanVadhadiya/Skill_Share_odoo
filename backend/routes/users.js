const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { adminAuth } = require('../middleware/adminAuth');

const router = express.Router();

// Optional auth middleware for browse endpoint
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId).select('-password');
      if (user && !user.isBanned) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Get all public users (for browsing) - works for both logged in and logged out users
router.get('/browse', optionalAuth, async (req, res) => {
  try {
    const { skill, location, availability, showAll } = req.query;
    let query = { isPublic: true, isBanned: false };

    // Location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Availability filter (can be array or string)
    if (availability) {
      const availArr = Array.isArray(availability) ? availability : [availability];
      query.$or = availArr.map(a => ({ [`availability.${a}`]: true }));
    }

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 4;
    let skip = (page - 1) * limit;

    // Get all public users
    let allUsers = await User.find(query)
      .select('name location skillsOffered skillsWanted availability rating profilePhoto')
      .sort({ rating: -1 });

    // Apply the comprehensive filtering logic based on your specifications
    if (req.user) {
      // Exclude current user from results
      allUsers = allUsers.filter(u => u._id.toString() !== req.user._id.toString());

      // 1) Normalize inputs
      const searchTerm = String(skill || '').trim().toLowerCase();
      const showAllEnabled = showAll === 'true';
      const myOffered = Array.isArray(req.user.skillsOffered)
                     ? req.user.skillsOffered.map(s => s.toLowerCase())
                     : [];

      console.log('[Browse] RAW INPUTS - skill="%s", showAll="%s"', skill, showAll);
      console.log('[Browse] PROCESSED - term="%s", showAll=%s, myOffered=%j',
                  searchTerm, showAllEnabled, myOffered);
      console.log('[Browse] Total users before filtering:', allUsers.length);

      let result;

      // CASE A: searching for a specific skill
      if (searchTerm) {
        if (showAllEnabled) {
          // A1: showAll=true → everyone who can TEACH the term
          result = allUsers.filter(u =>
            Array.isArray(u.skillsOffered) &&
            u.skillsOffered
              .map(s => s.toLowerCase())
              .includes(searchTerm)
          );

        } else {
          // A2: showAll=false → must TEACH term AND WANT one of your skills
          result = allUsers.filter(u => {
            const canTeach = Array.isArray(u.skillsOffered) &&
                             u.skillsOffered
                               .map(s => s.toLowerCase())
                               .includes(searchTerm);

            const wantsYou = Array.isArray(u.skillsWanted) &&
                             u.skillsWanted
                               .map(w => w.toLowerCase())
                               .some(w => myOffered.includes(w));

            return canTeach && wantsYou;
          });
        }

      // CASE B: no search term
      } else {
        if (showAllEnabled) {
          // B1: showAll=true → everyone
          result = allUsers;
        } else {
          // B2: showAll=false → anyone who WANTS one of your skills
          result = allUsers.filter(u =>
            Array.isArray(u.skillsWanted) &&
            u.skillsWanted
              .map(w => w.toLowerCase())
              .some(w => myOffered.includes(w))
          );
        }
      }

      console.log('[Browse] returning %d users', result.length);
      console.log('[Browse] Sample users in result:', result.slice(0, 3).map(u => ({ name: u.name, skillsOffered: u.skillsOffered, skillsWanted: u.skillsWanted })));
      allUsers = result;
    } else {
      // For logged out users, apply basic search filtering
      const searchTerm = String(skill || '').trim().toLowerCase();

      if (searchTerm) {
        // If searching for a specific skill, show users who can TEACH that skill
        allUsers = allUsers.filter(u => {
          if (!Array.isArray(u.skillsOffered) || u.skillsOffered.length === 0) return false;
          return u.skillsOffered
            .map(s => s.toLowerCase())
            .includes(searchTerm);
        });
      }

      // Always exclude any potential issues
      allUsers = allUsers.filter(u => u._id && u.name);

      console.log('[Browse] Logged out user - searchTerm="%s", returning %d users', searchTerm, allUsers.length);
    }

    // Calculate total after filtering
    const total = allUsers.length;

    // Apply pagination
    const users = allUsers.slice(skip, skip + limit);

    res.json({ users, total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all skill descriptions for moderation
router.get('/skills/descriptions', adminAuth, async (req, res) => {
  try {
    const users = await User.find({});
    const descriptions = [];
    users.forEach(user => {
      user.skillsOffered.forEach(skill => {
        const desc = user.skillDescriptions.get(skill);
        if (desc) {
          descriptions.push({ userId: user._id, userName: user.name, skill, description: desc });
        }
      });
    });
    res.json(descriptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if profile is private and user is not viewing their own profile
    if (!user.isPublic && req.user?._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Profile is private' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('location').optional().trim(),
  body('skillsOffered').optional().isArray().withMessage('Skills offered must be an array'),
  body('skillsWanted').optional().isArray().withMessage('Skills wanted must be an array'),
  body('availability').optional().isObject().withMessage('Availability must be an object'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updateFields = {};
    const allowedFields = ['name', 'location', 'skillsOffered', 'skillsWanted', 'availability', 'isPublic'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add skill to offered skills
router.post('/skills-offered', auth, [
  body('skill').trim().notEmpty().withMessage('Skill is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { skill } = req.body;
    const user = await User.findById(req.user._id);

    if (user.skillsOffered.includes(skill)) {
      return res.status(400).json({ message: 'Skill already exists' });
    }

    user.skillsOffered.push(skill);
    await user.save();

    res.json(user.skillsOffered);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove skill from offered skills
router.delete('/skills-offered/:skill', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.skillsOffered = user.skillsOffered.filter(skill => skill !== req.params.skill);
    await user.save();

    res.json(user.skillsOffered);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add skill to wanted skills
router.post('/skills-wanted', auth, [
  body('skill').trim().notEmpty().withMessage('Skill is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { skill } = req.body;
    const user = await User.findById(req.user._id);

    if (user.skillsWanted.includes(skill)) {
      return res.status(400).json({ message: 'Skill already exists' });
    }

    user.skillsWanted.push(skill);
    await user.save();

    res.json(user.skillsWanted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove skill from wanted skills
router.delete('/skills-wanted/:skill', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.skillsWanted = user.skillsWanted.filter(skill => skill !== req.params.skill);
    await user.save();

    res.json(user.skillsWanted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User: Set or update a skill description
router.post('/skills-offered/:skill/description', auth, async (req, res) => {
  try {
    const { description } = req.body;
    const user = await User.findById(req.user._id);
    if (!user.skillsOffered.includes(req.params.skill)) {
      return res.status(400).json({ message: 'You do not offer this skill' });
    }
    user.skillDescriptions.set(req.params.skill, description);
    await user.save();
    res.json({ skill: req.params.skill, description });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Remove a skill description (reject inappropriate)
router.delete('/skills-offered/:userId/:skill/description', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.skillDescriptions.delete(req.params.skill);
    await user.save();
    res.json({ message: 'Skill description removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
