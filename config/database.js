const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'college_value.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Initialize database with schema
const initDatabase = () => {
  const schema = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
  
  db.exec(schema, (err) => {
    if (err) {
      console.error('Error initializing database schema:', err.message);
    } else {
      console.log('Database schema initialized successfully');
    }
  });
};

// Get database instance
const getDb = () => db;

// Close database connection
const closeDb = () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
  });
};

module.exports = {
  getDb,
  closeDb,
  initDatabase,
  DB_PATH
};