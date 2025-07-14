const express = require('express');
const Swap = require('../models/Swap');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { adminAuth } = require('../middleware/adminAuth');

const router = express.Router();

// Create a new swap request
router.post('/', auth, [
    body('recipientId').isMongoId().withMessage('Valid recipient ID is required'),
    body('skillOffered').trim().notEmpty().withMessage('Skill offered is required'),
    body('skillRequested').trim().notEmpty().withMessage('Skill requested is required'),
    body('message').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { recipientId, skillOffered, skillRequested, message } = req.body;

        // Check if recipient exists and is not banned
        const recipient = await User.findById(recipientId);
        if (!recipient || recipient.isBanned) {
            return res.status(404).json({ message: 'Recipient not found' });
        }

        // Check if requester has the skill they're offering
        const requester = await User.findById(req.user._id);
        if (!requester.skillsOffered.includes(skillOffered)) {
            return res.status(400).json({ message: 'You must have this skill in your offered skills' });
        }

        // Check if recipient has the skill they're being asked for
        if (!recipient.skillsOffered.includes(skillRequested)) {
            return res.status(400).json({ message: 'Recipient does not offer this skill' });
        }

        // Check if there's already a pending swap between these users
        const existingSwap = await Swap.findOne({
            $or: [
                { requester: req.user._id, recipient: recipientId },
                { requester: recipientId, recipient: req.user._id }
            ],
            status: 'pending'
        });

        if (existingSwap) {
            return res.status(400).json({ message: 'You already have a pending swap with this user' });
        }

        const swap = new Swap({
            requester: req.user._id,
            recipient: recipientId,
            skillOffered,
            skillRequested,
            message
        });

        await swap.save();

        const populatedSwap = await Swap.findById(swap._id)
            .populate('requester', 'name profilePhoto')
            .populate('recipient', 'name profilePhoto');

        res.status(201).json(populatedSwap);
    } catch (error) {
        console.error('Swap creation error:', error);
        res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
    }
});

// Get user's swaps (sent and received)
router.get('/my-swaps', auth, async (req, res) => {
    try {
        const swaps = await Swap.find({
            $or: [
                { requester: req.user._id },
                { recipient: req.user._id }
            ]
        })
        .populate('requester', 'name profilePhoto')
        .populate('recipient', 'name profilePhoto')
        .sort({ createdAt: -1 });

        res.json(swaps);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Accept a swap request
router.put('/:id/accept', auth, async (req, res) => {
    try {
        const swap = await Swap.findById(req.params.id);

        if (!swap) {
            return res.status(404).json({ message: 'Swap not found' });
        }

        if (swap.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to accept this swap' });
        }

        if (swap.status !== 'pending') {
            return res.status(400).json({ message: 'Swap is not pending' });
        }

        swap.status = 'accepted';
        await swap.save();

        const populatedSwap = await Swap.findById(swap._id)
            .populate('requester', 'name profilePhoto')
            .populate('recipient', 'name profilePhoto');

        res.json(populatedSwap);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reject a swap request
router.put('/:id/reject', auth, async (req, res) => {
    try {
        const swap = await Swap.findById(req.params.id);

        if (!swap) {
            return res.status(404).json({ message: 'Swap not found' });
        }

        if (swap.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to reject this swap' });
        }

        if (swap.status !== 'pending') {
            return res.status(400).json({ message: 'Swap is not pending' });
        }

        swap.status = 'rejected';
        await swap.save();

        const populatedSwap = await Swap.findById(swap._id)
            .populate('requester', 'name profilePhoto')
            .populate('recipient', 'name profilePhoto');

        res.json(populatedSwap);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Cancel a swap request (only by requester)
router.put('/:id/cancel', auth, async (req, res) => {
    try {
        const swap = await Swap.findById(req.params.id);

        if (!swap) {
            return res.status(404).json({ message: 'Swap not found' });
        }

        if (swap.requester.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to cancel this swap' });
        }

        if (swap.status !== 'pending') {
            return res.status(400).json({ message: 'Can only cancel pending swaps' });
        }

        swap.status = 'cancelled';
        await swap.save();

        const populatedSwap = await Swap.findById(swap._id)
            .populate('requester', 'name profilePhoto')
            .populate('recipient', 'name profilePhoto');

        res.json(populatedSwap);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Complete a swap (admin or participants)
router.put('/:id/complete', auth, async (req, res) => {
    try {
        const swap = await Swap.findById(req.params.id);

        if (!swap) {
            return res.status(404).json({ message: 'Swap not found' });
        }

        // Check if user is admin or one of the swap participants
        const isAdmin = req.user.role === 'admin';
        const isParticipant = swap.requester.toString() === req.user._id.toString() ||
                             swap.recipient.toString() === req.user._id.toString();

        if (!isAdmin && !isParticipant) {
            return res.status(403).json({ message: 'Not authorized to complete this swap' });
        }

        if (swap.status !== 'accepted') {
            return res.status(400).json({ message: 'Can only complete accepted swaps' });
        }

        swap.status = 'completed';
        swap.completedAt = new Date();
        await swap.save();

        const populatedSwap = await Swap.findById(swap._id)
            .populate('requester', 'name email')
            .populate('recipient', 'name email');

        res.json(populatedSwap);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit rating and feedback for a completed swap
router.post('/:id/rate', auth, async (req, res) => {
  try {
    const { rating, comment, forRole } = req.body; // forRole: 'requester' or 'recipient'
    if (![1,2,3,4,5].includes(rating)) return res.status(400).json({ message: 'Invalid rating' });

    const swap = await Swap.findById(req.params.id);
    if (!swap || swap.status !== 'completed') return res.status(404).json({ message: 'Swap not found or not completed' });

    if (forRole === 'recipient' && swap.recipient.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    if (forRole === 'requester' && swap.requester.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

    const ratingObj = { rating, comment, date: new Date() };
    if (forRole === 'recipient') swap.recipientRating = ratingObj;
    else swap.requesterRating = ratingObj;
    await swap.save();

    // Update user rating
    const userId = forRole === 'recipient' ? swap.recipient : swap.requester;
    await updateUserRating(userId);

    const updatedUser = await User.findById(userId).select('-password');
    res.json({ message: 'Feedback submitted', user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to update user rating
async function updateUserRating(userId) {
  try {
    const swaps = await Swap.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: 'completed'
    });

    let ratings = [];
    swaps.forEach(s => {
      if (s.requester.toString() === userId.toString() && s.requesterRating) {
        ratings.push(s.requesterRating.rating);
      }
      if (s.recipient.toString() === userId.toString() && s.recipientRating) {
        ratings.push(s.recipientRating.rating);
      }
    });

    const user = await User.findById(userId);
    if (ratings.length > 0) {
      user.rating = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
      user.totalRatings = ratings.length;
    } else {
      // If no ratings, keep the initial random rating
      user.rating = user.rating || Math.round((Math.random() * (4.2 - 3.5) + 3.5) * 10) / 10;
      user.totalRatings = 0;
    }

    await user.save();
    return user;
  } catch (error) {
    console.error('Error updating user rating:', error);
    throw error;
  }
}

// Admin: delete feedback from a swap
router.delete('/:id/feedback/:role', adminAuth, async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id);
    if (!swap) return res.status(404).json({ message: 'Swap not found' });
    if (req.params.role === 'recipient') swap.recipientRating = undefined;
    else swap.requesterRating = undefined;
    await swap.save();
    res.json({ message: 'Feedback deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get swap by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const swap = await Swap.findById(req.params.id)
            .populate('requester', 'name profilePhoto')
            .populate('recipient', 'name profilePhoto');

        if (!swap) {
            return res.status(404).json({ message: 'Swap not found' });
        }

        // Check if user is part of this swap
        if (swap.requester._id.toString() !== req.user._id.toString() &&
            swap.recipient._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this swap' });
        }

        res.json(swap);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
