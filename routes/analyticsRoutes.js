const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// All analytics routes require authentication
router.use(requireAuth);

// Platform analytics (admin only)
router.get('/platform', requireAdmin, analyticsController.getPlatformAnalytics);
router.get('/trends', requireAdmin, analyticsController.getTrendAnalytics);
router.get('/comparative', requireAdmin, analyticsController.getComparativeAnalytics);
router.get('/realtime', requireAdmin, analyticsController.getRealtimeAnalytics);
router.get('/export', requireAdmin, analyticsController.getAnalyticsExport);

// College-specific analytics (admin viewing college data)
router.get('/college/:collegeId', requireAdmin, analyticsController.getCollegeAnalytics);

module.exports = router;