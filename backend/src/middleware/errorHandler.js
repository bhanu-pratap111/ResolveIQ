const { error: errorResponse } = require('../utils/response');

function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV === 'development';

  // Operational / known errors
  if (err.isOperational) {
    return errorResponse(res, err.message, err.statusCode || 400);
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    const errors = err.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
    return res.status(400).json({ success: false, message: 'Validation failed.', errors });
  }

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    return errorResponse(res, 'A record with this value already exists.', 409);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Invalid or expired token.', 401);
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return errorResponse(res, 'File size exceeds the maximum allowed limit.', 400);
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return errorResponse(res, 'Unexpected file field.', 400);
  }

  // Generic server error
  console.error('[ERROR]', err);
  return res.status(500).json({
    success: false,
    message: 'An unexpected error occurred. Please try again later.',
    ...(isDev ? { stack: err.stack } : {}),
  });
}

module.exports = { errorHandler };
