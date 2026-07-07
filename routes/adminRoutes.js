const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

// All admin routes require admin authentication
router.use(requireAdmin);

router.get('/overview', adminController.getOverview);
router.get('/college-comparison', adminController.getCollegeComparison);
router.get('/event-trend', adminController.getEventTrend);
router.get('/data-quality', adminController.getDataQuality);
router.get('/data-trust', adminController.getDataTrust);

module.exports = router;