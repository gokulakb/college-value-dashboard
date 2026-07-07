const { getDb } = require('../config/database');

class DataQualityService {
  // Run all quality checks for a college
  checkCollegeDataQuality(collegeId) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      const checks = [];
      
      // Check 1: Missing student names
      db.get(
        'SELECT COUNT(*) as count FROM students WHERE college_id = ? AND (student_name IS NULL OR student_name = "")',
        [collegeId],
        (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          checks.push({
            name: 'Missing student names',
            passed: result.count === 0,
            details: result.count > 0 ? `${result.count} students have missing names` : 'No issues found'
          });
          
          // Check 2: Missing college IDs
          db.get(
            'SELECT COUNT(*) as count FROM students WHERE college_id IS NULL',
            [],
            (err, result) => {
              if (err) {
                reject(err);
                return;
              }
              checks.push({
                name: 'Missing college IDs',
                passed: result.count === 0,
                details: result.count > 0 ? `${result.count} students have missing college IDs` : 'No issues found'
              });
              
              // Check 3: Duplicate student records
              db.get(
                `SELECT COUNT(*) as count FROM (
                  SELECT student_name, department, graduation_year, COUNT(*) as dup_count
                  FROM students WHERE college_id = ?
                  GROUP BY student_name, department, graduation_year
                  HAVING COUNT(*) > 1
                )`,
                [collegeId],
                (err, result) => {
                  if (err) {
                    reject(err);
                    return;
                  }
                  checks.push({
                    name: 'Duplicate student records',
                    passed: result.count === 0,
                    details: result.count > 0 ? `${result.count} duplicate groups found` : 'No issues found'
                  });
                  
                  // Check 4: Invalid offer statuses
                  db.get(
                    `SELECT COUNT(*) as count FROM offers 
                    WHERE college_id = ? AND offer_status NOT IN ('pending', 'accepted', 'rejected', 'expired')`,
                    [collegeId],
                    (err, result) => {
                      if (err) {
                        reject(err);
                        return;
                      }
                      checks.push({
                        name: 'Invalid offer statuses',
                        passed: result.count === 0,
                        details: result.count > 0 ? `${result.count} offers have invalid status` : 'No issues found'
                      });
                      
                      // Check 5: Invalid application statuses
                      db.get(
                        `SELECT COUNT(*) as count FROM applications 
                        WHERE college_id = ? AND application_status NOT IN ('applied', 'shortlisted', 'interview', 'offered', 'hired', 'rejected')`,
                        [collegeId],
                        (err, result) => {
                          if (err) {
                            reject(err);
                            return;
                          }
                          checks.push({
                            name: 'Invalid application statuses',
                            passed: result.count === 0,
                            details: result.count > 0 ? `${result.count} applications have invalid status` : 'No issues found'
                          });
                          
                          // Check 6: Negative salary values
                          db.get(
                            `SELECT COUNT(*) as count FROM offers 
                            WHERE college_id = ? AND salary_lpa < 0`,
                            [collegeId],
                            (err, result) => {
                              if (err) {
                                reject(err);
                                return;
                              }
                              checks.push({
                                name: 'Negative salary values',
                                passed: result.count === 0,
                                details: result.count > 0 ? `${result.count} offers have negative salary` : 'No issues found'
                              });
                              
                              // Check 7: Orphan student references
                              db.get(
                                `SELECT COUNT(*) as count FROM applications a
                                LEFT JOIN students s ON a.student_id = s.id
                                WHERE a.college_id = ? AND s.id IS NULL`,
                                [collegeId],
                                (err, result) => {
                                  if (err) {
                                    reject(err);
                                    return;
                                  }
                                  checks.push({
                                    name: 'Orphan student references',
                                    passed: result.count === 0,
                                    details: result.count > 0 ? `${result.count} applications have orphan student references` : 'No issues found'
                                  });
                                  
                                  // Check 8: Stale portal events
                                  db.get(
                                    `SELECT COUNT(*) as count FROM portal_events 
                                    WHERE college_id = ? 
                                    AND event_timestamp < datetime('now', '-90 days')`,
                                    [collegeId],
                                    (err, result) => {
                                      if (err) {
                                        reject(err);
                                        return;
                                      }
                                      checks.push({
                                        name: 'Stale portal events',
                                        passed: result.count === 0,
                                        details: result.count > 0 ? `${result.count} stale events found (>90 days)` : 'No issues found'
                                      });
                                      
                                      // Calculate quality score
                                      const totalChecks = checks.length;
                                      const passedChecks = checks.filter(c => c.passed).length;
                                      const qualityScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;
                                      
                                      resolve({
                                        totalChecks,
                                        passedChecks,
                                        failedChecks: totalChecks - passedChecks,
                                        qualityScore,
                                        checks
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
                }
              );
            }
          );
        }
      );
    });
  }
  
  // Get platform-wide data quality
  getPlatformDataQuality() {
    return new Promise((resolve, reject) => {
      const db = getDb();
      const checks = [];
      
      // Check 1: Missing student names
      db.get(
        'SELECT COUNT(*) as count FROM students WHERE student_name IS NULL OR student_name = ""',
        [],
        (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          checks.push({
            name: 'Missing student names',
            passed: result.count === 0,
            details: result.count > 0 ? `${result.count} students have missing names` : 'No issues found'
          });
          
          // Check 2: Missing college IDs
          db.get(
            'SELECT COUNT(*) as count FROM students WHERE college_id IS NULL',
            [],
            (err, result) => {
              if (err) {
                reject(err);
                return;
              }
              checks.push({
                name: 'Missing college IDs',
                passed: result.count === 0,
                details: result.count > 0 ? `${result.count} students have missing college IDs` : 'No issues found'
              });
              
              // Check 3: Duplicate student records
              db.get(
                `SELECT COUNT(*) as count FROM (
                  SELECT student_name, department, graduation_year, college_id, COUNT(*) as dup_count
                  FROM students
                  GROUP BY student_name, department, graduation_year, college_id
                  HAVING COUNT(*) > 1
                )`,
                [],
                (err, result) => {
                  if (err) {
                    reject(err);
                    return;
                  }
                  checks.push({
                    name: 'Duplicate student records',
                    passed: result.count === 0,
                    details: result.count > 0 ? `${result.count} duplicate groups found` : 'No issues found'
                  });
                  
                  // Check 4: Invalid offer statuses
                  db.get(
                    `SELECT COUNT(*) as count FROM offers 
                    WHERE offer_status NOT IN ('pending', 'accepted', 'rejected', 'expired')`,
                    [],
                    (err, result) => {
                      if (err) {
                        reject(err);
                        return;
                      }
                      checks.push({
                        name: 'Invalid offer statuses',
                        passed: result.count === 0,
                        details: result.count > 0 ? `${result.count} offers have invalid status` : 'No issues found'
                      });
                      
                      // Check 5: Invalid application statuses
                      db.get(
                        `SELECT COUNT(*) as count FROM applications 
                        WHERE application_status NOT IN ('applied', 'shortlisted', 'interview', 'offered', 'hired', 'rejected')`,
                        [],
                        (err, result) => {
                          if (err) {
                            reject(err);
                            return;
                          }
                          checks.push({
                            name: 'Invalid application statuses',
                            passed: result.count === 0,
                            details: result.count > 0 ? `${result.count} applications have invalid status` : 'No issues found'
                          });
                          
                          // Check 6: Negative salary values
                          db.get(
                            `SELECT COUNT(*) as count FROM offers WHERE salary_lpa < 0`,
                            [],
                            (err, result) => {
                              if (err) {
                                reject(err);
                                return;
                              }
                              checks.push({
                                name: 'Negative salary values',
                                passed: result.count === 0,
                                details: result.count > 0 ? `${result.count} offers have negative salary` : 'No issues found'
                              });
                              
                              // Check 7: Orphan student references
                              db.get(
                                `SELECT COUNT(*) as count FROM applications a
                                LEFT JOIN students s ON a.student_id = s.id
                                WHERE s.id IS NULL`,
                                [],
                                (err, result) => {
                                  if (err) {
                                    reject(err);
                                    return;
                                  }
                                  checks.push({
                                    name: 'Orphan student references',
                                    passed: result.count === 0,
                                    details: result.count > 0 ? `${result.count} applications have orphan student references` : 'No issues found'
                                  });
                                  
                                  // Check 8: Stale portal events
                                  db.get(
                                    `SELECT COUNT(*) as count FROM portal_events 
                                    WHERE event_timestamp < datetime('now', '-90 days')`,
                                    [],
                                    (err, result) => {
                                      if (err) {
                                        reject(err);
                                        return;
                                      }
                                      checks.push({
                                        name: 'Stale portal events',
                                        passed: result.count === 0,
                                        details: result.count > 0 ? `${result.count} stale events found (>90 days)` : 'No issues found'
                                      });
                                      
                                      // Calculate quality score
                                      const totalChecks = checks.length;
                                      const passedChecks = checks.filter(c => c.passed).length;
                                      const qualityScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;
                                      
                                      resolve({
                                        totalChecks,
                                        passedChecks,
                                        failedChecks: totalChecks - passedChecks,
                                        qualityScore,
                                        checks
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
                }
              );
            }
          );
        }
      );
    });
  }
}

module.exports = new DataQualityService();