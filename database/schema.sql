-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Colleges table
CREATE TABLE IF NOT EXISTS colleges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  college_code TEXT UNIQUE NOT NULL,
  college_name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  total_students INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('college', 'admin')),
  college_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  college_id INTEGER NOT NULL,
  student_name TEXT NOT NULL,
  department TEXT NOT NULL,
  graduation_year INTEGER NOT NULL,
  profile_completed INTEGER DEFAULT 0,
  skill_ready INTEGER DEFAULT 0,
  placement_status TEXT NOT NULL CHECK (placement_status IN ('placed', 'active', 'inactive', 'not_eligible')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  college_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  company_name TEXT NOT NULL,
  job_role TEXT NOT NULL,
  application_status TEXT NOT NULL CHECK (application_status IN ('applied', 'shortlisted', 'interview', 'offered', 'hired', 'rejected')),
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Offers table
CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  college_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  company_name TEXT NOT NULL,
  job_role TEXT NOT NULL,
  salary_lpa DECIMAL(10,2),
  offer_status TEXT NOT NULL CHECK (offer_status IN ('pending', 'accepted', 'rejected', 'expired')),
  offered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Recruiter activities table
CREATE TABLE IF NOT EXISTS recruiter_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  college_id INTEGER NOT NULL,
  recruiter_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('job_posted', 'students_viewed', 'interview_scheduled', 'offer_created')),
  students_reached INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
);

-- Portal events table
CREATE TABLE IF NOT EXISTS portal_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  college_id INTEGER,
  user_id INTEGER,
  event_name TEXT NOT NULL,
  event_source TEXT NOT NULL,
  event_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  college_id INTEGER,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_college ON students(college_id);
CREATE INDEX IF NOT EXISTS idx_applications_college ON applications(college_id);
CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_offers_college ON offers(college_id);
CREATE INDEX IF NOT EXISTS idx_offers_student ON offers(student_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_college ON recruiter_activities(college_id);
CREATE INDEX IF NOT EXISTS idx_events_college ON portal_events(college_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_college ON audit_logs(college_id);