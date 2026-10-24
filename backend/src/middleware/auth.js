const { verifyAccessToken } = require('../config/jwt');
const { pool } = require('../config/database');
const { error } = require('../utils/response');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Authentication required.', 401);
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Fetch fresh user data from DB
    const [rows] = await pool.execute(
      `SELECT u.id, u.role_id, u.name, u.email, u.is_active, r.name AS role
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      [decoded.userId]
    );

    if (rows.length === 0 || !rows[0].is_active) {
      return error(res, 'User not found or deactivated.', 401);
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return error(res, 'Token expired.', 401);
    if (err.name === 'JsonWebTokenError') return error(res, 'Invalid token.', 401);
    next(err);
  }
}

module.exports = { authenticate };
