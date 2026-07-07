const { getDb } = require('../config/database');

class AuditService {
  logAction(userId, collegeId, action, resource) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      
      db.run(
        'INSERT INTO audit_logs (user_id, college_id, action, resource) VALUES (?, ?, ?, ?)',
        [userId, collegeId, action, resource],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ id: this.lastID });
        }
      );
    });
  }
  
  getAuditLogs(userId, limit = 100) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      
      db.all(
        `SELECT * FROM audit_logs 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?`,
        [userId, limit],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows);
        }
      );
    });
  }
}

module.exports = new AuditService();