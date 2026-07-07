const metricsService = require('../services/metricsService');
const dataQualityService = require('../services/dataQualityService');
const auditService = require('../services/auditService');
const { getCollegeIdFromSession } = require('../middleware/auth');

// Helper to get college ID from session
const getCollegeId = (req) => {
  return getCollegeIdFromSession(req);
};

const getOverview = async (req, res) => {
  try {
    const collegeId = getCollegeId(req);
    if (!collegeId) {
      return res.status(403).json({
        success: false,
        error: 'No college associated with this account'
      });
    }
    
    const metrics = await metricsService.getCollegeOverview(collegeId);
    
    // Log dashboard view
    const userId = req.session.user.id;
    auditService.logAction(userId, collegeId, 'dashboard_view', 'college-dashboard')
      .catch(err => console.error('Audit log error:', err));
    
    res.json({
      success: true,
      data: metrics,
      meta: {
        source: 'SQLite database',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting college overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load college overview data'
    });
  }
};

const getFunnel = async (req, res) => {
  try {
    const collegeId = getCollegeId(req);
    if (!collegeId) {
      return res.status(403).json({
        success: false,
        error: 'No college associated with this account'
      });
    }
    
    const data = await metricsService.getFunnelData(collegeId);
    
    res.json({
      success: true,
      data,
      meta: {
        source: 'SQLite database',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting funnel data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load funnel data'
    });
  }
};

const getApplicationTrend = async (req, res) => {
  try {
    const collegeId = getCollegeId(req);
    if (!collegeId) {
      return res.status(403).json({
        success: false,
        error: 'No college associated with this account'
      });
    }
    
    const data = await metricsService.getApplicationTrend(collegeId);
    
    res.json({
      success: true,
      data,
      meta: {
        source: 'SQLite database',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting application trend:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load application trend data'
    });
  }
};

const getOfferDistribution = async (req, res) => {
  try {
    const collegeId = getCollegeId(req);
    if (!collegeId) {
      return res.status(403).json({
        success: false,
        error: 'No college associated with this account'
      });
    }
    
    const data = await metricsService.getOfferDistribution(collegeId);
    
    res.json({
      success: true,
      data,
      meta: {
        source: 'SQLite database',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting offer distribution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load offer distribution data'
    });
  }
};

const getDepartmentPerformance = async (req, res) => {
  try {
    const collegeId = getCollegeId(req);
    if (!collegeId) {
      return res.status(403).json({
        success: false,
        error: 'No college associated with this account'
      });
    }
    
    const data = await metricsService.getDepartmentPerformance(collegeId);
    
    res.json({
      success: true,
      data,
      meta: {
        source: 'SQLite database',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting department performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load department performance data'
    });
  }
};

const getRecruiterTrend = async (req, res) => {
  try {
    const collegeId = getCollegeId(req);
    if (!collegeId) {
      return res.status(403).json({
        success: false,
        error: 'No college associated with this account'
      });
    }
    
    const data = await metricsService.getRecruiterTrend(collegeId);
    
    res.json({
      success: true,
      data,
      meta: {
        source: 'SQLite database',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting recruiter trend:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load recruiter trend data'
    });
  }
};

const getInsights = async (req, res) => {
  try {
    const collegeId = getCollegeId(req);
    if (!collegeId) {
      return res.status(403).json({
        success: false,
        error: 'No college associated with this account'
      });
    }
    
    const insights = await metricsService.getInsights(collegeId);
    
    res.json({
      success: true,
      data: insights,
      meta: {
        source: 'SQLite database',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load insights'
    });
  }
};

const getMetricDictionary = (req, res) => {
  try {
    const dictionary = metricsService.getMetricDictionary();
    
    res.json({
      success: true,
      data: dictionary,
      meta: {
        source: 'Documentation',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting metric dictionary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load metric dictionary'
    });
  }
};

const getDataTrust = async (req, res) => {
  try {
    const collegeId = getCollegeId(req);
    if (!collegeId) {
      return res.status(403).json({
        success: false,
        error: 'No college associated with this account'
      });
    }
    
    const db = require('../config/database').getDb();
    
    // Get latest event
    db.get(
      'SELECT event_timestamp, event_name FROM portal_events WHERE college_id = ? ORDER BY event_timestamp DESC LIMIT 1',
      [collegeId],
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
          'SELECT COUNT(*) as count FROM portal_events WHERE college_id = ?',
          [collegeId],
          (err, eventCount) => {
            if (err) {
              console.error('Error getting event count:', err);
              return res.status(500).json({
                success: false,
                error: 'Failed to load data trust information'
              });
            }
            
            // Get latest event timestamp
            let latestTimestamp = null;
            let dataAge = 'No events found';
            let freshnessStatus = 'No data';
            
            if (latestEvent) {
              latestTimestamp = latestEvent.event_timestamp;
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
            }
            
            res.json({
              success: true,
              data: {
                latestEvent: latestEvent ? {
                  timestamp: latestEvent.event_timestamp,
                  eventName: latestEvent.event_name
                } : null,
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
      }
    );
  } catch (error) {
    console.error('Error getting data trust:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load data trust information'
    });
  }
};

const getDataQuality = async (req, res) => {
  try {
    const collegeId = getCollegeId(req);
    if (!collegeId) {
      return res.status(403).json({
        success: false,
        error: 'No college associated with this account'
      });
    }
    
    const qualityData = await dataQualityService.checkCollegeDataQuality(collegeId);
    
    res.json({
      success: true,
      data: qualityData,
      meta: {
        source: 'SQLite database - data quality service',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting data quality:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load data quality information'
    });
  }
};

module.exports = {
  getOverview,
  getFunnel,
  getApplicationTrend,
  getOfferDistribution,
  getDepartmentPerformance,
  getRecruiterTrend,
  getInsights,
  getMetricDictionary,
  getDataTrust,
  getDataQuality
};