const { pool } = require('../config/database');
const { success, paginated, error } = require('../utils/response');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { createAuditLog } = require('../services/audit.service');

async function list(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const search = req.query.search || '';
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM institutions WHERE is_active = 1 AND name LIKE ?`,
      [`%${search}%`]
    );
    const [rows] = await pool.execute(
      `SELECT * FROM institutions WHERE is_active = 1 AND name LIKE ? ORDER BY name LIMIT ? OFFSET ?`,
      [`%${search}%`, limit, offset]
    );
    return paginated(res, rows, buildPaginationMeta(countRows[0].total, page, limit));
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const [rows] = await pool.execute(`SELECT * FROM institutions WHERE id = ?`, [req.params.id]);
    if (!rows.length) return error(res, 'Institution not found.', 404);
    return success(res, rows[0]);
  } catch (err) { next(err); }
}

async function get360(req, res, next) {
  try {
    const id = req.params.id;
    const [inst] = await pool.execute(`SELECT * FROM institutions WHERE id = ?`, [id]);
    if (!inst.length) return error(res, 'Institution not found.', 404);

    const [stats] = await pool.execute(
      `SELECT 
         COUNT(*) AS total,
         SUM(status='RESOLVED') AS resolved,
         SUM(status='CLOSED') AS closed,
         SUM(status='REJECTED') AS rejected,
         SUM(status='UNDER_REVIEW') AS under_review,
         SUM(status='UNDER_ACTION') AS under_action,
         SUM(status='AWAITING_RESPONSE') AS awaiting_response,
         SUM(status='REGISTERED') AS registered,
         SUM(is_overdue=1) AS overdue
       FROM complaints WHERE institution_id = ?`,
      [id]
    );

    const [trend] = await pool.execute(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
       FROM complaints WHERE institution_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY month ORDER BY month`,
      [id]
    );

    const [catBreakdown] = await pool.execute(
      `SELECT cat.name AS category, COUNT(*) AS count
       FROM complaints c LEFT JOIN complaint_categories cat ON c.category_id = cat.id
       WHERE c.institution_id = ? GROUP BY cat.id, cat.name ORDER BY count DESC`,
      [id]
    );

    const [complaints] = await pool.execute(
      `SELECT c.id, c.reference_number, c.title, c.status, c.priority, c.is_overdue,
              c.created_at, cat.name AS category_name, b.name AS bureau_name
       FROM complaints c
       LEFT JOIN complaint_categories cat ON c.category_id = cat.id
       LEFT JOIN bureaus b ON c.current_bureau_id = b.id
       WHERE c.institution_id = ? ORDER BY c.created_at DESC LIMIT 50`,
      [id]
    );

    return success(res, {
      institution: inst[0],
      stats: stats[0],
      trend,
      categoryBreakdown: catBreakdown,
      recentComplaints: complaints,
    });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { name, code, type, state, city, address, email, phone, website } = req.body;
    if (!name) return error(res, 'Institution name is required.', 400);
    const [result] = await pool.execute(
      `INSERT INTO institutions (name, code, type, state, city, address, email, phone, website, is_demo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [name, code || null, type || 'college', state || null, city || null, address || null, email || null, phone || null, website || null]
    );
    await createAuditLog({ actorId: req.user.id, action: 'INSTITUTION_CREATED', entityType: 'institution', entityId: result.insertId, newValue: { name } });
    return success(res, { id: result.insertId }, 'Institution created.', 201);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { name, code, type, state, city, address, email, phone, website, is_active } = req.body;
    await pool.execute(
      `UPDATE institutions SET name=?, code=?, type=?, state=?, city=?, address=?, email=?, phone=?, website=?, is_active=? WHERE id=?`,
      [name, code || null, type || 'college', state || null, city || null, address || null, email || null, phone || null, website || null, is_active !== false, req.params.id]
    );
    await createAuditLog({ actorId: req.user.id, action: 'INSTITUTION_UPDATED', entityType: 'institution', entityId: req.params.id });
    return success(res, null, 'Institution updated.');
  } catch (err) { next(err); }
}

module.exports = { list, getOne, get360, create, update };

