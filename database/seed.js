const { getDb, initDatabase } = require('../config/database');

const seedData = () => {
  const db = getDb();
  
  // Check if tables are empty
  db.get('SELECT COUNT(*) as count FROM colleges', (err, row) => {
    if (err) {
      console.error('Error checking database:', err.message);
      return;
    }
    
    if (row.count > 0) {
      console.log('Database already has data. Skipping seed.');
      return;
    }
    
    console.log('Seeding database with sample data...');
    
    db.serialize(() => {
      // Insert Colleges
      const colleges = [
        ['IITB', 'Indian Institute of Technology Bombay', 'Mumbai', 'Maharashtra', 1200],
        ['REVA', 'REVA University', 'Bangalore', 'Karnataka', 800],
        ['NITK', 'National Institute of Technology Karnataka', 'Surathkal', 'Karnataka', 600],
        ['PESU', 'PES University', 'Bangalore', 'Karnataka', 500]
      ];
      
      const collegeIds = [];
      
      colleges.forEach(([code, name, city, state, total]) => {
        db.run(
          'INSERT INTO colleges (college_code, college_name, city, state, total_students) VALUES (?, ?, ?, ?, ?)',
          [code, name, city, state, total],
          function(err) {
            if (err) {
              console.error('Error inserting college:', err.message);
            } else {
              collegeIds.push(this.lastID);
              console.log(`Inserted college: ${name}`);
            }
          }
        );
      });
      
      // Wait for colleges to be inserted
      setTimeout(() => {
        // Insert Users
        const users = [
          ['IITB Officer', 'officer@iitb.edu', 'demo123', 'college', collegeIds[0]],
          ['REVA Officer', 'officer@reva.edu', 'demo123', 'college', collegeIds[1]],
          ['NITK Officer', 'officer@nitk.edu', 'demo123', 'college', collegeIds[2]],
          ['PESU Officer', 'officer@pes.edu', 'demo123', 'college', collegeIds[3]],
          ['Admin User', 'admin@collegevalue.com', 'admin123', 'admin', null]
        ];
        
        const userIds = [];
        
        users.forEach(([name, email, password, role, collegeId]) => {
          db.run(
            'INSERT INTO users (name, email, password, role, college_id) VALUES (?, ?, ?, ?, ?)',
            [name, email, password, role, collegeId],
            function(err) {
              if (err) {
                console.error('Error inserting user:', err.message);
              } else {
                userIds.push(this.lastID);
                console.log(`Inserted user: ${name}`);
              }
            }
          );
        });
        
        // Insert Students
        setTimeout(() => {
          const students = [
            // IITB Students (collegeIds[0]) - High performance
            ...Array(30).fill(null).map((_, i) => [collegeIds[0], `IITB Student ${i+1}`, ['CSE', 'AIML', 'ECE'][i % 3], 2024, 1, 1, 'placed']),
            ...Array(10).fill(null).map((_, i) => [collegeIds[0], `IITB Student ${i+31}`, ['CSE', 'ECE'][i % 2], 2024, 1, 1, 'active']),
            ...Array(5).fill(null).map((_, i) => [collegeIds[0], `IITB Student ${i+41}`, 'Mechanical', 2024, 0, 0, 'inactive']),
            
            // REVA Students (collegeIds[1]) - Medium performance
            ...Array(20).fill(null).map((_, i) => [collegeIds[1], `REVA Student ${i+1}`, ['CSE', 'AIML', 'ECE', 'EEE'][i % 4], 2024, 1, 1, 'placed']),
            ...Array(15).fill(null).map((_, i) => [collegeIds[1], `REVA Student ${i+21}`, ['CSE', 'ECE', 'Mechanical'][i % 3], 2024, 1, 0, 'active']),
            ...Array(10).fill(null).map((_, i) => [collegeIds[1], `REVA Student ${i+36}`, ['Civil', 'Mechanical'][i % 2], 2024, 0, 0, 'inactive']),
            
            // NITK Students (collegeIds[2]) - High skill readiness
            ...Array(25).fill(null).map((_, i) => [collegeIds[2], `NITK Student ${i+1}`, ['CSE', 'AIML', 'ECE', 'Mechanical'][i % 4], 2024, 1, 1, 'placed']),
            ...Array(10).fill(null).map((_, i) => [collegeIds[2], `NITK Student ${i+26}`, ['CSE', 'ECE'][i % 2], 2024, 1, 1, 'active']),
            ...Array(5).fill(null).map((_, i) => [collegeIds[2], `NITK Student ${i+36}`, 'Civil', 2024, 1, 0, 'not_eligible']),
            
            // PESU Students (collegeIds[3]) - Lower engagement
            ...Array(15).fill(null).map((_, i) => [collegeIds[3], `PESU Student ${i+1}`, ['CSE', 'AIML', 'ECE'][i % 3], 2024, 1, 1, 'placed']),
            ...Array(10).fill(null).map((_, i) => [collegeIds[3], `PESU Student ${i+16}`, ['CSE', 'Mechanical', 'Civil'][i % 3], 2024, 0, 0, 'active']),
            ...Array(15).fill(null).map((_, i) => [collegeIds[3], `PESU Student ${i+26}`, ['ECE', 'EEE', 'Mechanical'][i % 3], 2024, 0, 0, 'inactive'])
          ];
          
          const studentIds = [];
          
          students.forEach(([collegeId, name, dept, year, profile, skill, status]) => {
            db.run(
              'INSERT INTO students (college_id, student_name, department, graduation_year, profile_completed, skill_ready, placement_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [collegeId, name, dept, year, profile, skill, status],
              function(err) {
                if (err) {
                  console.error('Error inserting student:', err.message);
                } else {
                  studentIds.push({ id: this.lastID, collegeId });
                }
              }
            );
          });
          
          // Insert Applications
          setTimeout(() => {
            const applications = [];
            const companies = ['Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'TCS', 'Infosys', 'Accenture', 'Deloitte', 'PwC'];
            const roles = ['Software Engineer', 'Data Scientist', 'Product Manager', 'DevOps Engineer', 'Cloud Architect'];
            const statuses = ['applied', 'shortlisted', 'interview', 'offered', 'hired', 'rejected'];
            
            // Generate applications for each college
            studentIds.forEach(({ id: studentId, collegeId }) => {
              // Each student has 1-3 applications
              const numApps = Math.floor(Math.random() * 3) + 1;
              for (let i = 0; i < numApps; i++) {
                const company = companies[Math.floor(Math.random() * companies.length)];
                const role = roles[Math.floor(Math.random() * roles.length)];
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * 90));
                
                applications.push([collegeId, studentId, company, role, status, date.toISOString()]);
              }
            });
            
            applications.forEach(([collegeId, studentId, company, role, status, date]) => {
              db.run(
                'INSERT INTO applications (college_id, student_id, company_name, job_role, application_status, applied_at) VALUES (?, ?, ?, ?, ?, ?)',
                [collegeId, studentId, company, role, status, date],
                (err) => {
                  if (err) console.error('Error inserting application:', err.message);
                }
              );
            });
            
            // Insert Offers
            setTimeout(() => {
              const offers = [];
              const offerStatuses = ['pending', 'accepted', 'rejected', 'expired'];
              const salaries = [6, 8, 10, 12, 15, 18, 20, 25, 30, 35];
              
              // Generate offers for placed students
              const placedStudents = studentIds.filter(s => {
                // We don't have student status here, so we'll generate offers for a subset
                return Math.random() > 0.5;
              });
              
              placedStudents.forEach(({ id: studentId, collegeId }) => {
                const numOffers = Math.floor(Math.random() * 2) + 1;
                for (let i = 0; i < numOffers; i++) {
                  const company = companies[Math.floor(Math.random() * companies.length)];
                  const role = roles[Math.floor(Math.random() * roles.length)];
                  const salary = salaries[Math.floor(Math.random() * salaries.length)];
                  const status = offerStatuses[Math.floor(Math.random() * offerStatuses.length)];
                  const date = new Date();
                  date.setDate(date.getDate() - Math.floor(Math.random() * 60));
                  
                  offers.push([collegeId, studentId, company, role, salary, status, date.toISOString()]);
                }
              });
              
              offers.forEach(([collegeId, studentId, company, role, salary, status, date]) => {
                db.run(
                  'INSERT INTO offers (college_id, student_id, company_name, job_role, salary_lpa, offer_status, offered_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                  [collegeId, studentId, company, role, salary, status, date],
                  (err) => {
                    if (err) console.error('Error inserting offer:', err.message);
                  }
                );
              });
              
              // Insert Recruiter Activities
              setTimeout(() => {
                const activities = [];
                const activityTypes = ['job_posted', 'students_viewed', 'interview_scheduled', 'offer_created'];
                const recruiters = ['John Smith', 'Sarah Johnson', 'Mike Brown', 'Emily Davis', 'David Wilson'];
                const companiesList = ['Google', 'Microsoft', 'Amazon', 'TCS', 'Infosys', 'Accenture'];
                
                collegeIds.forEach(collegeId => {
                  for (let i = 0; i < 10; i++) {
                    const recruiter = recruiters[Math.floor(Math.random() * recruiters.length)];
                    const company = companiesList[Math.floor(Math.random() * companiesList.length)];
                    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
                    const reached = Math.floor(Math.random() * 30) + 5;
                    const date = new Date();
                    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
                    
                    activities.push([collegeId, recruiter, company, type, reached, date.toISOString()]);
                  }
                });
                
                activities.forEach(([collegeId, recruiter, company, type, reached, date]) => {
                  db.run(
                    'INSERT INTO recruiter_activities (college_id, recruiter_name, company_name, activity_type, students_reached, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                    [collegeId, recruiter, company, type, reached, date],
                    (err) => {
                      if (err) console.error('Error inserting recruiter activity:', err.message);
                    }
                  );
                });
                
                // Insert Portal Events
                setTimeout(() => {
                  const events = [];
                  const eventNames = [
                    'student_registered', 'profile_completed', 'application_submitted',
                    'student_shortlisted', 'interview_scheduled', 'offer_created',
                    'offer_accepted', 'dashboard_viewed', 'report_exported'
                  ];
                  const sources = ['web', 'mobile', 'api'];
                  
                  // Generate 200 events across all colleges
                  for (let i = 0; i < 200; i++) {
                    const collegeId = collegeIds[Math.floor(Math.random() * collegeIds.length)];
                    const userId = userIds[Math.floor(Math.random() * userIds.length)];
                    const eventName = eventNames[Math.floor(Math.random() * eventNames.length)];
                    const source = sources[Math.floor(Math.random() * sources.length)];
                    const date = new Date();
                    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
                    
                    events.push([collegeId, userId, eventName, source, date.toISOString(), null]);
                  }
                  
                  events.forEach(([collegeId, userId, eventName, source, date, metadata]) => {
                    db.run(
                      'INSERT INTO portal_events (college_id, user_id, event_name, event_source, event_timestamp, metadata) VALUES (?, ?, ?, ?, ?, ?)',
                      [collegeId, userId, eventName, source, date, metadata],
                      (err) => {
                        if (err) console.error('Error inserting portal event:', err.message);
                      }
                    );
                  });
                  
                  console.log('All seed data inserted successfully!');
                }, 100);
              }, 100);
            }, 100);
          }, 100);
        }, 100);
      }, 100);
    });
  });
};

// Initialize and seed
initDatabase();

// Give time for table creation before seeding
setTimeout(seedData, 500);

module.exports = { seedData };