const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  // Don't expose stack traces in production
  const response = {
    success: false,
    error: message
  };
  
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }
  
  res.status(statusCode).json(response);
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};