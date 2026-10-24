const { error } = require('../utils/response');

/**
 * Authorize middleware factory.
 * Usage: authorize('super_admin', 'officer')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return error(res, 'Authentication required.', 401);
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return error(res, 'You do not have permission to perform this action.', 403);
    }
    next();
  };
}

module.exports = { authorize };
