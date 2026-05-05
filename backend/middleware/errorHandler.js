const AppError = require('../utils/AppError');

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  if (res.headersSent) {
    return next(error);
  }

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error',
    details: error.details || null,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
  });
};

module.exports = { notFoundHandler, errorHandler };
