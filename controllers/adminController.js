const { getDb } = require('../config/database');
const metricsService = require('../services/metricsService');
const dataQualityService = require('../services/dataQualityService');
const auditService = require('../services/auditService');

const getOverview = async (req, res) => {
  try {
    const db = getDb();
    
    // Get all college IDs
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
    
    // Log admin dashboard view
    const userId = req.session.user.id;
    auditService.logAction(userId, null, 'dashboard_view', 'admin-dashboard')
      .catch(err => console.error('Audit log error:', err));
    
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
        collegeCount: validMetrics.length
      },
      meta: {
        source: 'SQLite database',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting admin overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load admin overview data'
    });
  }
};

const getCollegeComparison = async (req, res) => {
  try {
    const db = getDb();
    
    // Get all colleges
    const colleges = await new Promise((resolve, reject) => {
      db.all('SELECT id, college_name FROM colleges ORDER BY college_name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // Get metrics for each college
    const comparisonData = await Promise.all(
      colleges.map(async (college) => {
        try {
          const metrics = await metricsService.getCollegeOverview(college.id);
          
          // Determine status
          let status = 'Healthy';
          if (metrics.placementRate < 60 || metrics.engagementRate < 70 || metrics.skillReadinessRate < 70) {
            status = 'Critical';
          } else if (metrics.placementRate < 75 || metrics.engagementRate < 85 || metrics.skillReadinessRate < 85) {
            status = 'Watch';
          }
          
          return {
            id: college.id,
            collegeName: college.college_name,
            totalStudents: metrics.totalStudents,
            placementRate: metrics.placementRate,
            engagementRate: metrics.engagementRate,
            skillReadinessRate: metrics.skillReadinessRate,
            totalApplications: metrics.totalApplications,
            totalOffers: metrics.totalOffers,
            offerAcceptanceRate: metrics.offerAcceptanceRate,
            activeRecruiters: metrics.activeRecruiters,
            status
          };
        } catch (error) {
          console.error(`Error getting metrics for college ${college.id}:`, error);
          return null;
        }
      })
    );
    
    const validData = comparisonData.filter(d => d !== null);
    
    // Sort by placement rate descending
    validData.sort((a, b) => b.placementRate - a.placementRate);
    
    res.json({
      success: true,
      data: validData,
      meta: {
        source: 'SQLite database',
        generatedAt: new Date().toISOString(),
        highestPerforming: validData.length > 0 ? validData[0].collegeName : 'N/A',
        lowestPerforming: validData.length > 0 ? validData[validData.length - 1].collegeName : 'N/A'
      }
    });
  } catch (error) {
    console.error('Error getting college comparison:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load college comparison data'
    });
  }
};

const getEventTrend = async (req, res) => {
  try {
    const db = getDb();
    
    db.all(
      `SELECT 
        strftime('%Y-%m', event_timestamp) as month,
        COUNT(*) as events
      FROM portal_events
      WHERE event_timestamp >= datetime('now', '-6 months')
      GROUP BY strftime('%Y-%m', event_timestamp)
      ORDER BY month ASC`,
      [],
      (err, data) => {
        if (err) {
          console.error('Error getting event trend:', err);
          return res.status(500).json({
            success: false,
            error: 'Failed to load event trend data'
          });
        }
        
        res.json({
          success: true,
          data,
          meta: {
            source: 'SQLite database - portal_events table',
            generatedAt: new Date().toISOString()
          }
        });
      }
    );
  } catch (error) {
    console.error('Error getting event trend:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load event trend data'
    });
  }
};

const getDataQuality = async (req, res) => {
  try {
    const qualityData = await dataQualityService.getPlatformDataQuality();
    
    res.json({
      success: true,
      data: qualityData,
      meta: {
        source: 'SQLite database - data quality service',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting admin data quality:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load data quality information'
    });
  }
};

const getDataTrust = async (req, res) => {
  try {
    const db = getDb();
    
    // Get latest event across all colleges
    db.get(
      'SELECT event_timestamp, event_name, college_id FROM portal_events ORDER BY event_timestamp DESC LIMIT 1',
      [],
      (err, latestEvent) => {
        if (err) {
          console.error('Error getting latest event:', err);
          return res.status(500).json({
            success: false,
            error: 'Failed to load data trust information'
          });
        }
        
        // Get total events count
        db.get(
          'SELECT COUNT(*) as count FROM portal_events',
          [],
          (err, eventCount) => {
            if (err) {
              console.error('Error getting event count:', err);
              return res.status(500).json({
                success: false,
                error: 'Failed to load data trust information'
              });
            }
            
            // Get college name for latest event
            let latestEventData = null;
            let dataAge = 'No events found';
            let freshnessStatus = 'No data';
            
            if (latestEvent) {
              // Get college name
              db.get(
                'SELECT college_name FROM colleges WHERE id = ?',
                [latestEvent.college_id],
                (err, college) => {
                  if (err) {
                    console.error('Error getting college name:', err);
                  }
                  
                  const latestTimestamp = latestEvent.event_timestamp;
                  const now = new Date();
                  const eventDate = new Date(latestTimestamp);
                  const hoursDiff = Math.floor((now - eventDate) / (1000 * 60 * 60));
                  
                  if (hoursDiff < 24) {
                    freshnessStatus = 'Fresh';
                    dataAge = `${hoursDiff} hours ago`;
                  } else if (hoursDiff < 72) {
                    freshnessStatus = 'Warning';
                    dataAge = `${hoursDiff} hours ago`;
                  } else {
                    freshnessStatus = 'Stale';
                    dataAge = `${hoursDiff} hours ago`;
                  }
                  
                  latestEventData = {
                    timestamp: latestEvent.event_timestamp,
                    eventName: latestEvent.event_name,
                    collegeName: college ? college.college_name : 'Unknown'
                  };
                  
                  res.json({
                    success: true,
                    data: {
                      latestEvent: latestEventData,
                      dataAge,
                      totalEventsProcessed: eventCount.count,
                      freshnessStatus,
                      lastRefresh: new Date().toISOString()
                    },
                    meta: {
                      source: 'SQLite database - portal_events table',
                      generatedAt: new Date().toISOString()
                    }
                  });
                }
              );
            } else {
              res.json({
                success: true,
                data: {
                  latestEvent: null,
                  dataAge,
                  totalEventsProcessed: eventCount.count,
                  freshnessStatus,
                  lastRefresh: new Date().toISOString()
                },
                meta: {
                  source: 'SQLite database - portal_events table',
                  generatedAt: new Date().toISOString()
                }
              });
            }
          }
        );
      }
    );
  } catch (error) {
    console.error('Error getting admin data trust:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load data trust information'
    });
  }
};

module.exports = {
  getOverview,
  getCollegeComparison,
  getEventTrend,
  getDataQuality,
  getDataTrust
};