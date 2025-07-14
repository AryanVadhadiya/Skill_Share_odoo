const express = require('express');
const User = require('../models/User');
const Swap = require('../models/Swap');
const Message = require('../models/Message');
const { adminAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Make user admin (for testing purposes)
router.put('/make-admin/:email', async (req, res) => {
    try {
        const user = await User.findOneAndUpdate(
            { email: req.params.email },
            { role: 'admin' },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User made admin successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all users (admin only)
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Ban/unban user
router.put('/users/:id/ban', adminAuth, async (req, res) => {
    try {
        const { isBanned } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isBanned },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all swaps (admin only)
router.get('/swaps', adminAuth, async (req, res) => {
    try {
        const swaps = await Swap.find({})
            .populate('requester', 'name email')
            .populate('recipient', 'name email')
            .sort({ createdAt: -1 });
        res.json(swaps);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get platform statistics
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalSwaps = await Swap.countDocuments();
        const pendingSwaps = await Swap.countDocuments({ status: 'pending' });
        const completedSwaps = await Swap.countDocuments({ status: 'completed' });
        const bannedUsers = await User.countDocuments({ isBanned: true });

        const stats = {
            totalUsers,
            totalSwaps,
            pendingSwaps,
            completedSwaps,
            bannedUsers,
            completionRate: totalSwaps > 0 ? (completedSwaps / totalSwaps * 100).toFixed(2) : 0
        };

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create platform-wide message
router.post('/messages', adminAuth, [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('content').trim().notEmpty().withMessage('Content is required'),
    body('type').isIn(['info', 'warning', 'alert', 'update']).withMessage('Invalid message type')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, content, type } = req.body;
        const message = new Message({
            title,
            content,
            type,
            createdBy: req.user._id
        });

        await message.save();
        res.status(201).json(message);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all platform messages
router.get('/messages', adminAuth, async (req, res) => {
    try {
        const messages = await Message.find({})
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update message status
router.put('/messages/:id', adminAuth, [
    body('isActive').isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { isActive } = req.body;
        const message = await Message.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        ).populate('createdBy', 'name');

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        res.json(message);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete message
router.delete('/messages/:id', adminAuth, async (req, res) => {
    try {
        const message = await Message.findByIdAndDelete(req.params.id);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user activity report
router.get('/reports/user-activity', adminAuth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = {};

        if (startDate && endDate) {
            dateFilter = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        const users = await User.find(dateFilter).select('-password');
        const swaps = await Swap.find(dateFilter);

        const report = {
            period: { startDate, endDate },
            totalUsers: users.length,
            totalSwaps: swaps.length,
            newUsers: users.filter(user => user.createdAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
            activeUsers: users.filter(user => !user.isBanned).length,
            bannedUsers: users.filter(user => user.isBanned).length
        };

        res.json(report);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get swap statistics report
router.get('/reports/swap-stats', adminAuth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = {};

        if (startDate && endDate) {
            dateFilter = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        const swaps = await Swap.find(dateFilter);
        
        const stats = {
            period: { startDate, endDate },
            totalSwaps: swaps.length,
            pendingSwaps: swaps.filter(swap => swap.status === 'pending').length,
            acceptedSwaps: swaps.filter(swap => swap.status === 'accepted').length,
            completedSwaps: swaps.filter(swap => swap.status === 'completed').length,
            rejectedSwaps: swaps.filter(swap => swap.status === 'rejected').length,
            cancelledSwaps: swaps.filter(swap => swap.status === 'cancelled').length,
            completionRate: swaps.length > 0 ? 
                (swaps.filter(swap => swap.status === 'completed').length / swaps.length * 100).toFixed(2) : 0
        };

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Download user activity report as CSV
router.get('/reports/user-activity/download', adminAuth, async (req, res) => {
    try {
        const { format = 'json' } = req.query;
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        
        if (format === 'csv') {
            const csvHeader = 'Name,Email,Location,Rating,Total Ratings,Skills Offered,Skills Wanted,Is Banned,Is Public,Created At\n';
            const csvData = users.map(user => {
                return `"${user.name}","${user.email}","${user.location || ''}","${user.rating}","${user.totalRatings}","${user.skillsOffered.join('; ')}","${user.skillsWanted.join('; ')}","${user.isBanned}","${user.isPublic}","${user.createdAt}"`;
            }).join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=user-activity-report.csv');
            res.send(csvHeader + csvData);
        } else {
            res.json({
                totalUsers: users.length,
                activeUsers: users.filter(u => !u.isBanned).length,
                bannedUsers: users.filter(u => u.isBanned).length,
                users: users
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Download feedback logs report
router.get('/reports/feedback-logs/download', adminAuth, async (req, res) => {
    try {
        const { format = 'json' } = req.query;
        const swaps = await Swap.find({ 
            $or: [{ requesterRating: { $exists: true } }, { recipientRating: { $exists: true } }] 
        })
        .populate('requester', 'name email')
        .populate('recipient', 'name email')
        .sort({ createdAt: -1 });
        
        const feedbackData = [];
        swaps.forEach(swap => {
            if (swap.requesterRating) {
                feedbackData.push({
                    swapId: swap._id,
                    rater: swap.requester.name,
                    rated: swap.recipient.name,
                    rating: swap.requesterRating.rating,
                    comment: swap.requesterRating.comment,
                    date: swap.requesterRating.date,
                    skillOffered: swap.skillOffered,
                    skillRequested: swap.skillRequested
                });
            }
            if (swap.recipientRating) {
                feedbackData.push({
                    swapId: swap._id,
                    rater: swap.recipient.name,
                    rated: swap.requester.name,
                    rating: swap.recipientRating.rating,
                    comment: swap.recipientRating.comment,
                    date: swap.recipientRating.date,
                    skillOffered: swap.skillRequested,
                    skillRequested: swap.skillOffered
                });
            }
        });
        
        if (format === 'csv') {
            const csvHeader = 'Swap ID,Rater,Rated,Rating,Comment,Date,Skill Offered,Skill Requested\n';
            const csvData = feedbackData.map(feedback => {
                return `"${feedback.swapId}","${feedback.rater}","${feedback.rated}","${feedback.rating}","${feedback.comment || ''}","${feedback.date}","${feedback.skillOffered}","${feedback.skillRequested}"`;
            }).join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=feedback-logs-report.csv');
            res.send(csvHeader + csvData);
        } else {
            res.json({
                totalFeedback: feedbackData.length,
                averageRating: feedbackData.length > 0 ? 
                    (feedbackData.reduce((sum, f) => sum + f.rating, 0) / feedbackData.length).toFixed(2) : 0,
                feedback: feedbackData
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Download swap statistics report
router.get('/reports/swap-stats/download', adminAuth, async (req, res) => {
    try {
        const { format = 'json' } = req.query;
        const swaps = await Swap.find({})
            .populate('requester', 'name email')
            .populate('recipient', 'name email')
            .sort({ createdAt: -1 });
        
        const stats = {
            totalSwaps: swaps.length,
            pendingSwaps: swaps.filter(s => s.status === 'pending').length,
            acceptedSwaps: swaps.filter(s => s.status === 'accepted').length,
            completedSwaps: swaps.filter(s => s.status === 'completed').length,
            rejectedSwaps: swaps.filter(s => s.status === 'rejected').length,
            cancelledSwaps: swaps.filter(s => s.status === 'cancelled').length,
            completionRate: swaps.length > 0 ? ((swaps.filter(s => s.status === 'completed').length / swaps.length) * 100).toFixed(2) : 0,
            averageRating: 0
        };
        
        // Calculate average rating
        const ratedSwaps = swaps.filter(s => s.requesterRating || s.recipientRating);
        if (ratedSwaps.length > 0) {
            let totalRating = 0;
            let ratingCount = 0;
            ratedSwaps.forEach(swap => {
                if (swap.requesterRating) {
                    totalRating += swap.requesterRating.rating;
                    ratingCount++;
                }
                if (swap.recipientRating) {
                    totalRating += swap.recipientRating.rating;
                    ratingCount++;
                }
            });
            stats.averageRating = (totalRating / ratingCount).toFixed(2);
        }
        
        if (format === 'csv') {
            const csvHeader = 'Swap ID,Requester,Recipient,Skill Offered,Skill Requested,Status,Created At,Completed At\n';
            const csvData = swaps.map(swap => {
                return `"${swap._id}","${swap.requester.name}","${swap.recipient.name}","${swap.skillOffered}","${swap.skillRequested}","${swap.status}","${swap.createdAt}","${swap.completedAt || ''}"`;
            }).join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=swap-stats-report.csv');
            res.send(csvHeader + csvData);
        } else {
            res.json({
                ...stats,
                swaps: swaps
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get comprehensive platform analytics
router.get('/analytics', adminAuth, async (req, res) => {
    try {
        const users = await User.find({});
        const swaps = await Swap.find({});
        
        // User analytics
        const userAnalytics = {
            totalUsers: users.length,
            activeUsers: users.filter(u => !u.isBanned).length,
            bannedUsers: users.filter(u => u.isBanned).length,
            publicProfiles: users.filter(u => u.isPublic).length,
            averageRating: users.length > 0 ? 
                (users.reduce((sum, u) => sum + u.rating, 0) / users.length).toFixed(2) : 0,
            usersWithSkills: users.filter(u => u.skillsOffered.length > 0).length,
            topSkills: getTopSkills(users)
        };
        
        // Swap analytics
        const swapAnalytics = {
            totalSwaps: swaps.length,
            byStatus: {
                pending: swaps.filter(s => s.status === 'pending').length,
                accepted: swaps.filter(s => s.status === 'accepted').length,
                completed: swaps.filter(s => s.status === 'completed').length,
                rejected: swaps.filter(s => s.status === 'rejected').length,
                cancelled: swaps.filter(s => s.status === 'cancelled').length
            },
            completionRate: swaps.length > 0 ? 
                ((swaps.filter(s => s.status === 'completed').length / swaps.length) * 100).toFixed(2) : 0,
            averageRating: 0
        };
        
        // Calculate average swap rating
        const ratedSwaps = swaps.filter(s => s.requesterRating || s.recipientRating);
        if (ratedSwaps.length > 0) {
            let totalRating = 0;
            let ratingCount = 0;
            ratedSwaps.forEach(swap => {
                if (swap.requesterRating) {
                    totalRating += swap.requesterRating.rating;
                    ratingCount++;
                }
                if (swap.recipientRating) {
                    totalRating += swap.recipientRating.rating;
                    ratingCount++;
                }
            });
            swapAnalytics.averageRating = (totalRating / ratingCount).toFixed(2);
        }
        
        res.json({
            userAnalytics,
            swapAnalytics,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Helper function to get top skills
function getTopSkills(users) {
    const skillCount = {};
    users.forEach(user => {
        user.skillsOffered.forEach(skill => {
            skillCount[skill] = (skillCount[skill] || 0) + 1;
        });
    });
    
    return Object.entries(skillCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([skill, count]) => ({ skill, count }));
}

module.exports = router; 