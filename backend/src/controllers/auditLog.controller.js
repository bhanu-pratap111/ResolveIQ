const { pool } = require('../config/database');
const { success, paginated, error } = require('../utils/response');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

async function getAuditLogs(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { action, entity_type, actor_id, start_date, end_date } = req.query;

    let where = '1=1';
    const params = [];
    if (action) { where += ' AND action = ?'; params.push(action); }
    if (entity_type) { where += ' AND entity_type = ?'; params.push(entity_type); }
    if (actor_id) { where += ' AND actor_id = ?'; params.push(actor_id); }
    if (start_date) { where += ' AND created_at >= ?'; params.push(start_date); }
    if (end_date) { where += ' AND created_at <= ?'; params.push(end_date + ' 23:59:59'); }

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM audit_logs WHERE ${where}`, params
    );
    const [rows] = await pool.execute(
      `SELECT al.*, u.name AS actor_name FROM audit_logs al
       LEFT JOIN users u ON al.actor_id = u.id
       WHERE ${where} ORDER BY al.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return paginated(res, rows, buildPaginationMeta(countRows[0].total, page, limit));
  } catch (err) { next(err); }
}

async function getAuditActions(req, res, next) {
  try {
    const [rows] = await pool.execute(`SELECT DISTINCT action FROM audit_logs ORDER BY action`);
    return success(res, rows.map(r => r.action));
  } catch (err) { next(err); }
}

module.exports = { getAuditLogs, getAuditActions };

