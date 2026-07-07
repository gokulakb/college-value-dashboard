const { getDb } = require('../config/database');
const auditService = require('../services/auditService');

const login = (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
  }
  
  const db = getDb();
  
  db.get(
    `SELECT u.*, c.college_name 
     FROM users u
     LEFT JOIN colleges c ON u.college_id = c.id
     WHERE u.email = ?`,
    [email],
    (err, user) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }
      
      // In production, use bcrypt to compare passwords
      if (user.password !== password) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }
      
      // Store user in session
      req.session.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        college_id: user.college_id,
        college_name: user.college_name
      };
      
      // Log login action
      auditService.logAction(user.id, user.college_id, 'login', 'auth')
        .catch(err => console.error('Audit log error:', err));
      
      res.json({
        success: true,
        data: {
          user: req.session.user
        }
      });
    }
  );
};

const logout = (req, res) => {
  if (req.session && req.session.user) {
    // Log logout action
    auditService.logAction(req.session.user.id, req.session.user.college_id, 'logout', 'auth')
      .catch(err => console.error('Audit log error:', err));
  }
  
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        success: false,
        error: 'Could not log out'
      });
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
};

const getMe = (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }
  
  res.json({
    success: true,
    data: {
      user: req.session.user
    }
  });
};

module.exports = {
  login,
  logout,
  getMe
};