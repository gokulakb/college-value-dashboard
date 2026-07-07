const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in.'
    });
  }
  next();
};

const requireCollege = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in.'
    });
  }
  
  if (req.session.user.role !== 'college') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. College officer privileges required.'
    });
  }
  
  if (!req.session.user.college_id) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. No college associated with this account.'
    });
  }
  
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in.'
    });
  }
  
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Administrator privileges required.'
    });
  }
  
  next();
};

const getCollegeIdFromSession = (req) => {
  if (!req.session || !req.session.user) {
    return null;
  }
  return req.session.user.college_id;
};

module.exports = {
  requireAuth,
  requireCollege,
  requireAdmin,
  getCollegeIdFromSession
};