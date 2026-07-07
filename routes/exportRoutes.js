const express = require('express');
const router = express.Router();
const { requireCollege } = require('../middleware/auth');
const { getCollegeIdFromSession } = require('../middleware/auth');
const metricsService = require('../services/metricsService');
const csvExporter = require('../utils/csvExporter');
const auditService = require('../services/auditService');
const { getDb } = require('../config/database');

router.get('/college-report', requireCollege, async (req, res) => {
  try {
    const collegeId = getCollegeIdFromSession(req);
    const userId = req.session.user.id;
    
    if (!collegeId) {
      return res.status(403).json({
        success: false,
        error: 'No college associated with this account'
      });
    }
    
    // Get college name
    const db = getDb();
    const college = await new Promise((resolve, reject) => {
      db.get('SELECT college_name FROM colleges WHERE id = ?', [collegeId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!college) {
      return res.status(404).json({
        success: false,
        error: 'College not found'
      });
    }
    
    // Get metrics
    const metrics = await metricsService.getCollegeOverview(collegeId);
    
    // Generate CSV
    const csv = csvExporter.generateCollegeReport(metrics, college.college_name);
    
    // Log export action
    auditService.logAction(userId, collegeId, 'csv_export', 'college-report')
      .catch(err => console.error('Audit log error:', err));
    
    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=college-report-${college.college_name}-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting college report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export report'
    });
  }
});

module.exports = router;