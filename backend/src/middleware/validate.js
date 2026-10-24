const { validationResult } = require('express-validator');

/**
 * Middleware to run after express-validator chains.
 * Collects errors and returns 400 if any exist.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({
        field: e.path || e.param,
        message: e.msg,
        value: e.value,
      })),
    });
  }
  next();
}

module.exports = { validate };
