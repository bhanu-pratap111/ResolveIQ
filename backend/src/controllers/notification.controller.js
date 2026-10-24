const { pool } = require('../config/database');
const { success, paginated, error } = require('../utils/response');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

async function getNotifications(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM notifications WHERE user_id = ?`, [req.user.id]
    );
    const [rows] = await pool.execute(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [req.user.id, limit, offset]
    );
    return paginated(res, rows, buildPaginationMeta(countRows[0].total, page, limit));
  } catch (err) { next(err); }
}

async function markRead(req, res, next) {
  try {
    await pool.execute(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );
    return success(res, null, 'Marked as read.');
  } catch (err) { next(err); }
}

async function markAllRead(req, res, next) {
  try {
    await pool.execute(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [req.user.id]);
    return success(res, null, 'All notifications marked as read.');
  } catch (err) { next(err); }
}

async function getUnreadCount(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [req.user.id]
    );
    return success(res, { count: rows[0].count });
  } catch (err) { next(err); }
}

module.exports = { getNotifications, markRead, markAllRead, getUnreadCount };

