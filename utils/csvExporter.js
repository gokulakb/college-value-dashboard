class CSVExporter {
  generateCollegeReport(metrics, collegeName) {
    const headers = [
      'College Name',
      'Total Students',
      'Eligible Students',
      'Placed Students',
      'Placement Rate (%)',
      'Engagement Rate (%)',
      'Profile Completion Rate (%)',
      'Skill Readiness Rate (%)',
      'Total Applications',
      'Total Offers',
      'Offer Acceptance Rate (%)',
      'Active Recruiters',
      'Average Salary (LPA)',
      'Generated At'
    ];
    
    const row = [
      collegeName,
      metrics.totalStudents,
      metrics.eligibleStudents,
      metrics.placedStudents,
      metrics.placementRate,
      metrics.engagementRate,
      metrics.profileCompletionRate,
      metrics.skillReadinessRate,
      metrics.totalApplications,
      metrics.totalOffers,
      metrics.offerAcceptanceRate,
      metrics.activeRecruiters,
      metrics.averageSalary,
      new Date().toISOString()
    ];
    
    // Escape fields with commas
    const escapedRow = row.map(field => {
      if (typeof field === 'string' && field.includes(',')) {
        return `"${field}"`;
      }
      return field;
    });
    
    return [headers.join(','), escapedRow.join(',')].join('\n');
  }
  
  generateAdminReport(colleges) {
    const headers = [
      'College Name',
      'Total Students',
      'Placement Rate (%)',
      'Engagement Rate (%)',
      'Skill Readiness Rate (%)',
      'Applications',
      'Offers',
      'Offer Acceptance Rate (%)',
      'Active Recruiters',
      'Status'
    ];
    
    const rows = colleges.map(college => {
      const row = [
        college.collegeName,
        college.totalStudents,
        college.placementRate,
        college.engagementRate,
        college.skillReadinessRate,
        college.totalApplications,
        college.totalOffers,
        college.offerAcceptanceRate,
        college.activeRecruiters,
        college.status || 'Unknown'
      ];
      
      return row.map(field => {
        if (typeof field === 'string' && field.includes(',')) {
          return `"${field}"`;
        }
        return field;
      }).join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
  }
}

module.exports = new CSVExporter();