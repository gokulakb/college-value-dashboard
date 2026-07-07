const { getDb, initDatabase } = require('./config/database');

initDatabase();

const db = getDb();

// Check if tables exist and have data
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='colleges'", (err, table) => {
  if (err) {
    console.error('Error checking tables:', err.message);
    return;
  }
  
  if (!table) {
    console.log('❌ Tables do not exist! Database needs to be initialized.');
    return;
  }
  
  console.log('✅ Tables exist. Checking data...');
  
  // Check colleges
  db.get('SELECT COUNT(*) as count FROM colleges', (err, result) => {
    if (err) {
      console.error('Error checking colleges:', err.message);
      return;
    }
    
    console.log(`Colleges: ${result.count}`);
    
    if (result.count === 0) {
      console.log('❌ No colleges found! Need to seed the database.');
      console.log('Run: npm run seed');
      return;
    }
    
    // Check users
    db.get('SELECT COUNT(*) as count FROM users', (err, result2) => {
      if (err) {
        console.error('Error checking users:', err.message);
        return;
      }
      
      console.log(`Users: ${result2.count}`);
      
      if (result2.count === 0) {
        console.log('❌ No users found! Need to seed the database.');
        console.log('Run: npm run seed');
        return;
      }
      
      // Show users
      db.all('SELECT id, email, name, role, college_id FROM users', (err, users) => {
        if (err) {
          console.error('Error getting users:', err.message);
          return;
        }
        
        console.log('\n📋 Users in database:');
        users.forEach(user => {
          console.log(`  - ${user.email} (${user.role})${user.college_id ? ` - College ID: ${user.college_id}` : ''}`);
        });
        
        console.log('\n✅ Database appears to be seeded correctly!');
        console.log('\nTry logging in with:');
        console.log('  Admin: admin@collegevalue.com / admin123');
        console.log('  College: officer@iitb.edu / demo123');
        
        db.close();
      });
    });
  });
});