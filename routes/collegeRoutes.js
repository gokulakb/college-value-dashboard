const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController');
const { requireCollege } = require('../middleware/auth');

// All college routes require college authentication
router.use(requireCollege);

router.get('/overview', collegeController.getOverview);
router.get('/funnel', collegeController.getFunnel);
router.get('/application-trend', collegeController.getApplicationTrend);
router.get('/offer-distribution', collegeController.getOfferDistribution);
router.get('/department-performance', collegeController.getDepartmentPerformance);
router.get('/recruiter-trend', collegeController.getRecruiterTrend);
router.get('/insights', collegeController.getInsights);
router.get('/metric-dictionary', collegeController.getMetricDictionary);
router.get('/data-trust', collegeController.getDataTrust);
router.get('/data-quality', collegeController.getDataQuality);

module.exports = router;