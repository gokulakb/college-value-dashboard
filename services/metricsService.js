const { getDb } = require('../config/database');

class MetricsService {
  // Get college overview metrics
  getCollegeOverview(collegeId) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      
      // Get college info
      db.get(
        'SELECT id, college_name, total_students FROM colleges WHERE id = ?',
        [collegeId],
        (err, college) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (!college) {
            reject(new Error('College not found'));
            return;
          }
          
          // Get student stats
          db.get(
            `SELECT 
              COUNT(*) as total_students,
              SUM(CASE WHEN placement_status = 'placed' THEN 1 ELSE 0 END) as placed_students,
              SUM(CASE WHEN placement_status NOT IN ('not_eligible', 'inactive') THEN 1 ELSE 0 END) as eligible_students,
              SUM(CASE WHEN profile_completed = 1 THEN 1 ELSE 0 END) as completed_profiles,
              SUM(CASE WHEN skill_ready = 1 AND placement_status NOT IN ('not_eligible', 'inactive') THEN 1 ELSE 0 END) as skill_ready_students,
              SUM(CASE WHEN placement_status = 'inactive' THEN 1 ELSE 0 END) as inactive_students,
              SUM(CASE WHEN placement_status = 'not_eligible' THEN 1 ELSE 0 END) as not_eligible_students
            FROM students 
            WHERE college_id = ?`,
            [collegeId],
            (err, stats) => {
              if (err) {
                reject(err);
                return;
              }
              
              // Get application stats
              db.get(
                `SELECT 
                  COUNT(*) as total_applications,
                  COUNT(DISTINCT student_id) as students_with_applications
                FROM applications 
                WHERE college_id = ?`,
                [collegeId],
                (err, appStats) => {
                  if (err) {
                    reject(err);
                    return;
                  }
                  
                  // Get offer stats
                  db.get(
                    `SELECT 
                      COUNT(*) as total_offers,
                      SUM(CASE WHEN offer_status = 'accepted' THEN 1 ELSE 0 END) as accepted_offers,
                      SUM(CASE WHEN offer_status = 'rejected' THEN 1 ELSE 0 END) as rejected_offers,
                      SUM(CASE WHEN offer_status = 'pending' THEN 1 ELSE 0 END) as pending_offers,
                      SUM(CASE WHEN offer_status = 'expired' THEN 1 ELSE 0 END) as expired_offers,
                      AVG(CASE WHEN offer_status = 'accepted' THEN salary_lpa ELSE NULL END) as avg_salary
                    FROM offers 
                    WHERE college_id = ?`,
                    [collegeId],
                    (err, offerStats) => {
                      if (err) {
                        reject(err);
                        return;
                      }
                      
                      // Get active recruiters (last 30 days)
                      db.get(
                        `SELECT COUNT(DISTINCT recruiter_name) as active_recruiters
                        FROM recruiter_activities 
                        WHERE college_id = ? 
                        AND created_at >= datetime('now', '-30 days')`,
                        [collegeId],
                        (err, recruiterStats) => {
                          if (err) {
                            reject(err);
                            return;
                          }
                          
                          // Calculate metrics
                          const totalStudents = stats.total_students || 0;
                          const eligibleStudents = stats.eligible_students || 0;
                          const placedStudents = stats.placed_students || 0;
                          const studentsWithApps = appStats.students_with_applications || 0;
                          const totalApps = appStats.total_applications || 0;
                          const totalOffers = offerStats.total_offers || 0;
                          const acceptedOffers = offerStats.accepted_offers || 0;
                          const rejectedOffers = offerStats.rejected_offers || 0;
                          const respondedOffers = acceptedOffers + rejectedOffers;
                          
                          const placementRate = eligibleStudents > 0 ? (placedStudents / eligibleStudents) * 100 : 0;
                          const engagementRate = eligibleStudents > 0 ? (studentsWithApps / eligibleStudents) * 100 : 0;
                          const profileCompletionRate = totalStudents > 0 ? (stats.completed_profiles / totalStudents) * 100 : 0;
                          const skillReadinessRate = eligibleStudents > 0 ? (stats.skill_ready_students / eligibleStudents) * 100 : 0;
                          const offerAcceptanceRate = respondedOffers > 0 ? (acceptedOffers / respondedOffers) * 100 : 0;
                          const avgSalary = offerStats.avg_salary || 0;
                          const activeRecruiters = recruiterStats.active_recruiters || 0;
                          
                          resolve({
                            collegeName: college.college_name,
                            totalStudents,
                            eligibleStudents,
                            placedStudents,
                            placementRate: Math.round(placementRate * 10) / 10,
                            engagementRate: Math.round(engagementRate * 10) / 10,
                            profileCompletionRate: Math.round(profileCompletionRate * 10) / 10,
                            skillReadinessRate: Math.round(skillReadinessRate * 10) / 10,
                            totalApplications: totalApps,
                            totalOffers,
                            offerAcceptanceRate: Math.round(offerAcceptanceRate * 10) / 10,
                            activeRecruiters,
                            averageSalary: Math.round(avgSalary * 10) / 10,
                            pendingOffers: offerStats.pending_offers || 0,
                            expiredOffers: offerStats.expired_offers || 0,
                            rejectedOffers,
                            acceptedOffers,
                            inactiveStudents: stats.inactive_students || 0,
                            notEligibleStudents: stats.not_eligible_students || 0,
                            studentsWithApps
                          });
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  }
  
  // Get placement funnel data
  getFunnelData(collegeId) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      
      db.get(
        `SELECT 
          COUNT(*) as total_students,
          SUM(CASE WHEN placement_status NOT IN ('not_eligible') THEN 1 ELSE 0 END) as active_students,
          COUNT(DISTINCT CASE WHEN a.id IS NOT NULL THEN s.id ELSE NULL END) as applicants,
          COUNT(DISTINCT CASE WHEN a.application_status = 'shortlisted' THEN s.id ELSE NULL END) as shortlisted,
          COUNT(DISTINCT CASE WHEN a.application_status = 'interview' THEN s.id ELSE NULL END) as interviewed,
          COUNT(DISTINCT CASE WHEN o.id IS NOT NULL AND o.offer_status = 'pending' THEN s.id ELSE NULL END) as offered,
          COUNT(DISTINCT CASE WHEN o.offer_status = 'accepted' THEN s.id ELSE NULL END) as hired
        FROM students s
        LEFT JOIN applications a ON s.id = a.student_id AND a.college_id = ?
        LEFT JOIN offers o ON s.id = o.student_id AND o.college_id = ?
        WHERE s.college_id = ?`,
        [collegeId, collegeId, collegeId],
        (err, data) => {
          if (err) {
            reject(err);
            return;
          }
          
          resolve({
            totalStudents: data.total_students || 0,
            activeStudents: data.active_students || 0,
            applicants: data.applicants || 0,
            shortlisted: data.shortlisted || 0,
            interviewed: data.interviewed || 0,
            offered: data.offered || 0,
            hired: data.hired || 0
          });
        }
      );
    });
  }
  
  // Get application trend data
  getApplicationTrend(collegeId) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      
      db.all(
        `SELECT 
          strftime('%Y-%m', applied_at) as month,
          COUNT(*) as applications
        FROM applications
        WHERE college_id = ?
        AND applied_at >= datetime('now', '-6 months')
        GROUP BY strftime('%Y-%m', applied_at)
        ORDER BY month ASC`,
        [collegeId],
        (err, data) => {
          if (err) {
            reject(err);
            return;
          }
          
          resolve(data);
        }
      );
    });
  }
  
  // Get offer distribution data
  getOfferDistribution(collegeId) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      
      db.all(
        `SELECT 
          offer_status,
          COUNT(*) as count
        FROM offers
        WHERE college_id = ?
        GROUP BY offer_status`,
        [collegeId],
        (err, data) => {
          if (err) {
            reject(err);
            return;
          }
          
          resolve(data);
        }
      );
    });
  }
  
  // Get department performance
  getDepartmentPerformance(collegeId) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      
      db.all(
        `SELECT 
          s.department,
          COUNT(*) as total_students,
          SUM(CASE WHEN s.placement_status = 'placed' THEN 1 ELSE 0 END) as placed_students,
          SUM(CASE WHEN s.placement_status NOT IN ('not_eligible') THEN 1 ELSE 0 END) as eligible_students
        FROM students s
        WHERE s.college_id = ?
        GROUP BY s.department
        ORDER BY s.department`,
        [collegeId],
        (err, data) => {
          if (err) {
            reject(err);
            return;
          }
          
          const result = data.map(dept => ({
            department: dept.department,
            totalStudents: dept.total_students,
            placementRate: dept.eligible_students > 0 
              ? Math.round((dept.placed_students / dept.eligible_students) * 100 * 10) / 10 
              : 0
          }));
          
          resolve(result);
        }
      );
    });
  }
  
  // Get recruiter trend data
  getRecruiterTrend(collegeId) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      
      db.all(
        `SELECT 
          strftime('%Y-%m', created_at) as month,
          COUNT(*) as activities,
          COUNT(DISTINCT recruiter_name) as recruiters
        FROM recruiter_activities
        WHERE college_id = ?
        AND created_at >= datetime('now', '-6 months')
        GROUP BY strftime('%Y-%m', created_at)
        ORDER BY month ASC`,
        [collegeId],
        (err, data) => {
          if (err) {
            reject(err);
            return;
          }
          
          resolve(data);
        }
      );
    });
  }
  
  // Get insights based on metrics
  getInsights(collegeId) {
    return new Promise((resolve, reject) => {
      this.getCollegeOverview(collegeId)
        .then(metrics => {
          const insights = [];
          
          // Placement Rate
          if (metrics.placementRate < 60) {
            insights.push({
              metric: 'Placement Rate',
              value: metrics.placementRate,
              status: 'Critical',
              recommendation: 'Placement rate is below target. Increase recruiter outreach and targeted placement drives.'
            });
          } else if (metrics.placementRate < 75) {
            insights.push({
              metric: 'Placement Rate',
              value: metrics.placementRate,
              status: 'Watch',
              recommendation: 'Placement rate needs improvement. Focus on student preparation and employer engagement.'
            });
          } else {
            insights.push({
              metric: 'Placement Rate',
              value: metrics.placementRate,
              status: 'Healthy',
              recommendation: 'Placement rate is healthy. Maintain current momentum.'
            });
          }
          
          // Engagement Rate
          if (metrics.engagementRate < 70) {
            insights.push({
              metric: 'Student Engagement',
              value: metrics.engagementRate,
              status: 'Critical',
              recommendation: 'Student engagement is low. Run an application participation campaign.'
            });
          } else if (metrics.engagementRate < 85) {
            insights.push({
              metric: 'Student Engagement',
              value: metrics.engagementRate,
              status: 'Watch',
              recommendation: 'Student engagement needs attention. Encourage more students to apply.'
            });
          } else {
            insights.push({
              metric: 'Student Engagement',
              value: metrics.engagementRate,
              status: 'Healthy',
              recommendation: 'Student engagement is strong. Continue current initiatives.'
            });
          }
          
          // Profile Completion
          if (metrics.profileCompletionRate < 80) {
            insights.push({
              metric: 'Profile Completion',
              value: metrics.profileCompletionRate,
              status: 'Critical',
              recommendation: 'Student profiles require attention. Launch a profile completion drive.'
            });
          } else if (metrics.profileCompletionRate < 90) {
            insights.push({
              metric: 'Profile Completion',
              value: metrics.profileCompletionRate,
              status: 'Watch',
              recommendation: 'Profile completion needs improvement. Send reminders to students.'
            });
          } else {
            insights.push({
              metric: 'Profile Completion',
              value: metrics.profileCompletionRate,
              status: 'Healthy',
              recommendation: 'Profile completion is excellent. Maintain current standards.'
            });
          }
          
          // Skill Readiness
          if (metrics.skillReadinessRate < 70) {
            insights.push({
              metric: 'Skill Readiness',
              value: metrics.skillReadinessRate,
              status: 'Critical',
              recommendation: 'Skill readiness is below target. Prioritize training for unready students.'
            });
          } else if (metrics.skillReadinessRate < 85) {
            insights.push({
              metric: 'Skill Readiness',
              value: metrics.skillReadinessRate,
              status: 'Watch',
              recommendation: 'Skill readiness needs improvement. Consider targeted training programs.'
            });
          } else {
            insights.push({
              metric: 'Skill Readiness',
              value: metrics.skillReadinessRate,
              status: 'Healthy',
              recommendation: 'Skill readiness is strong. Maintain current training programs.'
            });
          }
          
          // Offer Acceptance
          if (metrics.offerAcceptanceRate < 70) {
            insights.push({
              metric: 'Offer Acceptance',
              value: metrics.offerAcceptanceRate,
              status: 'Critical',
              recommendation: 'Offer acceptance requires attention. Review salary, role and location preferences.'
            });
          } else if (metrics.offerAcceptanceRate < 85) {
            insights.push({
              metric: 'Offer Acceptance',
              value: metrics.offerAcceptanceRate,
              status: 'Watch',
              recommendation: 'Offer acceptance needs improvement. Gather student feedback on offers.'
            });
          } else {
            insights.push({
              metric: 'Offer Acceptance',
              value: metrics.offerAcceptanceRate,
              status: 'Healthy',
              recommendation: 'Offer acceptance is healthy. Continue current recruitment strategy.'
            });
          }
          
          // Active Recruiters
          if (metrics.activeRecruiters < 5) {
            insights.push({
              metric: 'Active Recruiters',
              value: metrics.activeRecruiters,
              status: 'Critical',
              recommendation: 'Recruiter activity is low. Increase employer engagement.'
            });
          } else if (metrics.activeRecruiters < 10) {
            insights.push({
              metric: 'Active Recruiters',
              value: metrics.activeRecruiters,
              status: 'Watch',
              recommendation: 'Recruiter activity needs improvement. Reach out to potential employers.'
            });
          } else {
            insights.push({
              metric: 'Active Recruiters',
              value: metrics.activeRecruiters,
              status: 'Healthy',
              recommendation: 'Recruiter activity is strong. Continue employer relationship management.'
            });
          }
          
          resolve(insights);
        })
        .catch(reject);
    });
  }
  
  // Get metric dictionary
  getMetricDictionary() {
    return [
      {
        metric: 'Total Students',
        definition: 'Total number of students in the college',
        formula: 'COUNT(*) FROM students WHERE college_id = ?',
        source: 'students table',
        decision: 'Shows the size of the placement population'
      },
      {
        metric: 'Placement Rate',
        definition: 'Percentage of eligible students who are placed',
        formula: 'Placed Students ÷ Eligible Students × 100',
        source: 'students table',
        decision: 'Determines whether employer outreach or placement intervention is needed'
      },
      {
        metric: 'Student Engagement Rate',
        definition: 'Percentage of eligible students with at least one application',
        formula: 'Students with Applications ÷ Eligible Students × 100',
        source: 'students and applications tables',
        decision: 'Identifies need for application drives and student counseling'
      },
      {
        metric: 'Profile Completion Rate',
        definition: 'Percentage of students with completed profiles',
        formula: 'Students with profile_completed = 1 ÷ Total Students × 100',
        source: 'students table',
        decision: 'Determines if profile completion campaigns are needed'
      },
      {
        metric: 'Skill Readiness Rate',
        definition: 'Percentage of eligible students who are skill-ready',
        formula: 'Students with skill_ready = 1 ÷ Eligible Students × 100',
        source: 'students table',
        decision: 'Identifies training and skill-gap intervention requirements'
      },
      {
        metric: 'Total Applications',
        definition: 'Total number of job applications submitted',
        formula: 'COUNT(*) FROM applications WHERE college_id = ?',
        source: 'applications table',
        decision: 'Shows student participation in available opportunities'
      },
      {
        metric: 'Total Offers',
        definition: 'Total number of job offers extended',
        formula: 'COUNT(*) FROM offers WHERE college_id = ?',
        source: 'offers table',
        decision: 'Shows hiring conversion volume'
      },
      {
        metric: 'Offer Acceptance Rate',
        definition: 'Percentage of responded offers that were accepted',
        formula: 'Accepted Offers ÷ Responded Offers × 100',
        source: 'offers table',
        decision: 'Helps identify salary, role, or location-related issues'
      },
      {
        metric: 'Active Recruiters',
        definition: 'Number of unique recruiters active in the last 30 days',
        formula: 'COUNT(DISTINCT recruiter_name) WHERE created_at >= last 30 days',
        source: 'recruiter_activities table',
        decision: 'Measures employer engagement and outreach effectiveness'
      },
      {
        metric: 'Average Salary',
        definition: 'Average salary of accepted offers',
        formula: 'AVG(salary_lpa) for offers with offer_status = accepted',
        source: 'offers table',
        decision: 'Evaluates placement quality and employer mix'
      }
    ];
  }
}

module.exports = new MetricsService();