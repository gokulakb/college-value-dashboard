const { getDb } = require('../config/database');
const metricsService = require('../services/metricsService');
const dataQualityService = require('../services/dataQualityService');

// Get platform-wide analytics for admin
const getPlatformAnalytics = async (req, res) => {
  try {
    const db = getDb();
    
    // Get all colleges
    const colleges = await new Promise((resolve, reject) => {
      db.all('SELECT id, college_name FROM colleges', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // Get metrics for each college
    const collegeMetrics = await Promise.all(
      colleges.map(async (college) => {
        try {
          const metrics = await metricsService.getCollegeOverview(college.id);
          return {
            ...metrics,
            id: college.id
          };
        } catch (error) {
          console.error(`Error getting metrics for college ${college.id}:`, error);
          return null;
        }
      })
    );
    
    const validMetrics = collegeMetrics.filter(m => m !== null);
    
    // Calculate platform-wide metrics
    const totalColleges = colleges.length;
    const totalStudents = validMetrics.reduce((sum, m) => sum + m.totalStudents, 0);
    const totalPlacedStudents = validMetrics.reduce((sum, m) => sum + m.placedStudents, 0);
    const totalEligibleStudents = validMetrics.reduce((sum, m) => sum + m.eligibleStudents, 0);
    const totalApplications = validMetrics.reduce((sum, m) => sum + m.totalApplications, 0);
    const totalOffers = validMetrics.reduce((sum, m) => sum + m.totalOffers, 0);
    const totalAcceptedOffers = validMetrics.reduce((sum, m) => sum + m.acceptedOffers, 0);
    const totalRejectedOffers = validMetrics.reduce((sum, m) => sum + m.rejectedOffers, 0);
    const totalActiveRecruiters = validMetrics.reduce((sum, m) => sum + m.activeRecruiters, 0);
    
    const overallPlacementRate = totalEligibleStudents > 0 
      ? Math.round((totalPlacedStudents / totalEligibleStudents) * 100 * 10) / 10 
      : 0;
    
    const overallOfferAcceptance = (totalAcceptedOffers + totalRejectedOffers) > 0
      ? Math.round((totalAcceptedOffers / (totalAcceptedOffers + totalRejectedOffers)) * 100 * 10) / 10
      : 0;
    
    // Get total portal events
    const eventCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM portal_events', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    res.json({
      success: true,
      data: {
        totalColleges,
        totalStudents,
        overallPlacementRate,
        totalApplications,
        totalOffers,
        overallOfferAcceptance,
        totalActiveRecruiters,
        totalPortalEvents: eventCount,
        collegeCount: validMetrics.length,
        colleges: validMetrics.map(m => ({
          name: m.collegeName,
          placementRate: m.placementRate,
          engagementRate: m.engagementRate,
          skillReadinessRate: m.skillReadinessRate,
          totalStudents: m.totalStudents
        }))
      },
      meta: {
        source: 'SQLite database',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting platform analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load platform analytics data'
    });
  }
};

// Get analytics for a specific college (admin view)
const getCollegeAnalytics = async (req, res) => {
  try {
    const { collegeId } = req.params;
    
    if (!collegeId) {
      return res.status(400).json({
        success: false,
        error: 'College ID is required'
      });
    }
    
    // Check if college exists
    const db = getDb();
    const college = await new Promise((resolve, reject) => {
      db.get('SELECT id, college_name FROM colleges WHERE id = ?', [collegeId], (err, row) => {
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
    
    const metrics = await metricsService.getCollegeOverview(parseInt(collegeId));
    const funnel = await metricsService.getFunnelData(parseInt(collegeId));
    const appTrend = await metricsService.getApplicationTrend(parseInt(collegeId));
    const offerDist = await metricsService.getOfferDistribution(parseInt(collegeId));
    const deptPerf = await metricsService.getDepartmentPerformance(parseInt(collegeId));
    const recTrend = await metricsService.getRecruiterTrend(parseInt(collegeId));
    const insights = await metricsService.getInsights(parseInt(collegeId));
    const quality = await dataQualityService.checkCollegeDataQuality(parseInt(collegeId));
    
    res.json({
      success: true,
      data: {
        college: {
          id: college.id,
          name: college.college_name
        },
        metrics,
        funnel,
        applicationTrend: appTrend,
        offerDistribution: offerDist,
        departmentPerformance: deptPerf,
        recruiterTrend: recTrend,
        insights,
        quality
      },
      meta: {
        source: 'SQLite database',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting college analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load college analytics data'
    });
  }
};

// Get trend analytics for platform
const getTrendAnalytics = async (req, res) => {
  try {
    const db = getDb();
    const { period = '6months' } = req.query;
    
    let dateFilter = "datetime('now', '-6 months')";
    if (period === '12months') {
      dateFilter = "datetime('now', '-12 months')";
    } else if (period === '3months') {
      dateFilter = "datetime('now', '-3 months')";
    }
    
    // Application trend across all colleges
    const appTrend = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          strftime('%Y-%m', applied_at) as month,
          COUNT(*) as applications,
          COUNT(DISTINCT college_id) as colleges
        FROM applications
        WHERE applied_at >= ${dateFilter}
        GROUP BY strftime('%Y-%m', applied_at)
        ORDER BY month ASC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    // Offer trend across all colleges
    const offerTrend = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          strftime('%Y-%m', offered_at) as month,
          COUNT(*) as offers,
          SUM(CASE WHEN offer_status = 'accepted' THEN 1 ELSE 0 END) as accepted,
          SUM(CASE WHEN offer_status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM offers
        WHERE offered_at >= ${dateFilter}
        GROUP BY strftime('%Y-%m', offered_at)
        ORDER BY month ASC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    // Recruiter trend across all colleges
    const recruiterTrend = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          strftime('%Y-%m', created_at) as month,
          COUNT(*) as activities,
          COUNT(DISTINCT recruiter_name) as recruiters,
          COUNT(DISTINCT college_id) as colleges
        FROM recruiter_activities
        WHERE created_at >= ${dateFilter}
        GROUP BY strftime('%Y-%m', created_at)
        ORDER BY month ASC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    // Student registration trend
    const studentTrend = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          strftime('%Y-%m', created_at) as month,
          COUNT(*) as students,
          COUNT(DISTINCT college_id) as colleges
        FROM students
        WHERE created_at >= ${dateFilter}
        GROUP BY strftime('%Y-%m', created_at)
        ORDER BY month ASC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    res.json({
      success: true,
      data: {
        period,
        applicationTrend: appTrend,
        offerTrend: offerTrend,
        recruiterTrend: recruiterTrend,
        studentTrend: studentTrend
      },
      meta: {
        source: 'SQLite database',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting trend analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load trend analytics data'
    });
  }
};

// Get comparative analytics between colleges
const getComparativeAnalytics = async (req, res) => {
  try {
    const db = getDb();
    const { metrics = 'placement,engagement,skill' } = req.query;
    
    const requestedMetrics = metrics.split(',');
    
    // Get all colleges
    const colleges = await new Promise((resolve, reject) => {
      db.all('SELECT id, college_name FROM colleges ORDER BY college_name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // Get metrics for each college
    const collegeData = await Promise.all(
      colleges.map(async (college) => {
        try {
          const metrics = await metricsService.getCollegeOverview(college.id);
          return {
            id: college.id,
            name: college.college_name,
            totalStudents: metrics.totalStudents,
            placementRate: metrics.placementRate,
            engagementRate: metrics.engagementRate,
            skillReadinessRate: metrics.skillReadinessRate,
            offerAcceptanceRate: metrics.offerAcceptanceRate,
            averageSalary: metrics.averageSalary,
            activeRecruiters: metrics.activeRecruiters,
            totalApplications: metrics.totalApplications,
            totalOffers: metrics.totalOffers
          };
        } catch (error) {
          console.error(`Error getting metrics for college ${college.id}:`, error);
          return null;
        }
      })
    );
    
    const validData = collegeData.filter(d => d !== null);
    
    // Calculate averages
    const averages = {
      placementRate: validData.reduce((sum, d) => sum + d.placementRate, 0) / validData.length,
      engagementRate: validData.reduce((sum, d) => sum + d.engagementRate, 0) / validData.length,
      skillReadinessRate: validData.reduce((sum, d) => sum + d.skillReadinessRate, 0) / validData.length,
      offerAcceptanceRate: validData.reduce((sum, d) => sum + d.offerAcceptanceRate, 0) / validData.length,
      averageSalary: validData.reduce((sum, d) => sum + d.averageSalary, 0) / validData.length,
      activeRecruiters: validData.reduce((sum, d) => sum + d.activeRecruiters, 0) / validData.length
    };
    
    // Find best and worst performers
    const bestPerformer = validData.length > 0 
      ? validData.reduce((best, current) => current.placementRate > best.placementRate ? current : best)
      : null;
    
    const worstPerformer = validData.length > 0
      ? validData.reduce((worst, current) => current.placementRate < worst.placementRate ? current : worst)
      : null;
    
    res.json({
      success: true,
      data: {
        colleges: validData,
        averages,
        bestPerformer: bestPerformer ? {
          name: bestPerformer.name,
          placementRate: bestPerformer.placementRate
        } : null,
        worstPerformer: worstPerformer ? {
          name: worstPerformer.name,
          placementRate: worstPerformer.placementRate
        } : null,
        totalColleges: validData.length
      },
      meta: {
        source: 'SQLite database',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting comparative analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load comparative analytics data'
    });
  }
};

// Get real-time analytics (for live dashboard updates)
const getRealtimeAnalytics = async (req, res) => {
  try {
    const db = getDb();
    
    // Get latest events
    const latestEvents = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          event_name,
          event_source,
          event_timestamp,
          college_id,
          (SELECT college_name FROM colleges WHERE id = portal_events.college_id) as college_name
        FROM portal_events
        ORDER BY event_timestamp DESC
        LIMIT 10`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    // Get activity counts for last hour
    const hourAgo = new Date();
    hourAgo.setHours(hourAgo.getHours() - 1);
    
    const activityCounts = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          COUNT(*) as total_events,
          COUNT(DISTINCT user_id) as active_users,
          COUNT(DISTINCT college_id) as active_colleges
        FROM portal_events
        WHERE event_timestamp >= ?`,
        [hourAgo.toISOString()],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    // Get event type distribution for last 24 hours
    const dayAgo = new Date();
    dayAgo.setHours(dayAgo.getHours() - 24);
    
    const eventDistribution = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          event_name,
          COUNT(*) as count
        FROM portal_events
        WHERE event_timestamp >= ?
        GROUP BY event_name
        ORDER BY count DESC`,
        [dayAgo.toISOString()],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    res.json({
      success: true,
      data: {
        latestEvents,
        activityCounts: {
          totalEvents: activityCounts.total_events || 0,
          activeUsers: activityCounts.active_users || 0,
          activeColleges: activityCounts.active_colleges || 0
        },
        eventDistribution,
        timestamp: new Date().toISOString()
      },
      meta: {
        source: 'SQLite database - portal_events table',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting realtime analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load realtime analytics data'
    });
  }
};

// Get export data for analytics
const getAnalyticsExport = async (req, res) => {
  try {
    const { format = 'json', collegeId } = req.query;
    const db = getDb();
    
    let data = {};
    
    if (collegeId) {
      // Get specific college data
      const metrics = await metricsService.getCollegeOverview(parseInt(collegeId));
      const funnel = await metricsService.getFunnelData(parseInt(collegeId));
      const deptPerf = await metricsService.getDepartmentPerformance(parseInt(collegeId));
      
      data = {
        type: 'college',
        metrics,
        funnel,
        departmentPerformance: deptPerf
      };
    } else {
      // Get platform data
      const colleges = await new Promise((resolve, reject) => {
        db.all('SELECT id, college_name FROM colleges', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      const collegeMetrics = await Promise.all(
        colleges.map(async (college) => {
          try {
            const metrics = await metricsService.getCollegeOverview(college.id);
            return {
              collegeName: college.college_name,
              ...metrics
            };
          } catch (error) {
            return null;
          }
        })
      );
      
      data = {
        type: 'platform',
        colleges: collegeMetrics.filter(m => m !== null),
        generatedAt: new Date().toISOString()
      };
    }
    
    if (format === 'json') {
      res.json({
        success: true,
        data,
        meta: {
          source: 'SQLite database',
          generatedAt: new Date().toISOString()
        }
      });
    } else {
      // CSV format
      const csv = require('../utils/csvExporter');
      let csvData;
      
      if (collegeId) {
        csvData = csv.generateCollegeReport(data.metrics, data.metrics.collegeName);
      } else {
        csvData = csv.generateAdminReport(data.colleges || []);
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-export-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvData);
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics data'
    });
  }
};

module.exports = {
  getPlatformAnalytics,
  getCollegeAnalytics,
  getTrendAnalytics,
  getComparativeAnalytics,
  getRealtimeAnalytics,
  getAnalyticsExport
};