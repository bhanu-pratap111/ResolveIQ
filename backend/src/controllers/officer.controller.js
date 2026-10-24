const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const { success, paginated, error } = require('../utils/response');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { createAuditLog } = require('../services/audit.service');

async function listOfficers(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const bureau_id = req.query.bureau_id;
    const search = req.query.search || '';
    const role_filter = req.query.role || 'officer';

    let where = `u.is_active = 1 AND r.name = ?`;
    const params = [role_filter];
    if (search) { where += ` AND (u.name LIKE ? OR u.email LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
    if (bureau_id) { where += ` AND oa.bureau_id = ?`; params.push(bureau_id); }

    const [countRows] = await pool.execute(
      `SELECT COUNT(DISTINCT u.id) AS total FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN officer_assignments oa ON u.id = oa.user_id AND oa.is_active = 1
       WHERE ${where}`,
      params
    );
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.phone, u.is_active, u.created_at, u.last_login,
              r.name AS role, b.name AS bureau_name, b.id AS bureau_id, cell.name AS cell_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN officer_assignments oa ON u.id = oa.user_id AND oa.is_active = 1
       LEFT JOIN bureaus b ON oa.bureau_id = b.id
       LEFT JOIN cells cell ON oa.cell_id = cell.id
       WHERE ${where}
       GROUP BY u.id ORDER BY u.name LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return paginated(res, rows, buildPaginationMeta(countRows[0].total, page, limit));
  } catch (err) { next(err); }
}

async function getAllUsers(req, res, next) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const search = req.query.search || '';
    const role = req.query.role;
    const is_active = req.query.is_active;

    let where = '1=1';
    const params = [];
    if (search) { where += ` AND (u.name LIKE ? OR u.email LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
    if (role) { where += ` AND r.name = ?`; params.push(role); }
    if (is_active !== undefined) { where += ` AND u.is_active = ?`; params.push(is_active === 'true' ? 1 : 0); }

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM users u JOIN roles r ON u.role_id = r.id WHERE ${where}`, params
    );
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.phone, u.is_active, u.created_at, u.last_login, r.name AS role
       FROM users u JOIN roles r ON u.role_id = r.id WHERE ${where} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return paginated(res, rows, buildPaginationMeta(countRows[0].total, page, limit));
  } catch (err) { next(err); }
}

async function createOfficer(req, res, next) {
  try {
    const { name, email, password, phone, bureau_id, cell_id } = req.body;
    if (!name || !email || !password) return error(res, 'Name, email and password are required.', 400);

    const [existing] = await pool.execute(`SELECT id FROM users WHERE email = ?`, [email]);
    if (existing.length > 0) return error(res, 'An account with this email already exists.', 409);

    const [roleRows] = await pool.execute(`SELECT id FROM roles WHERE name = 'officer'`);
    if (!roleRows.length) return error(res, 'Officer role not found.', 500);

    const hash = await bcrypt.hash(password, 12);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.execute(
        `INSERT INTO users (role_id, name, email, password_hash, phone) VALUES (?, ?, ?, ?, ?)`,
        [roleRows[0].id, name, email, hash, phone || null]
      );
      const userId = result.insertId;
      if (bureau_id) {
        await conn.execute(
          `INSERT INTO officer_assignments (user_id, bureau_id, cell_id, assigned_by) VALUES (?, ?, ?, ?)`,
          [userId, bureau_id, cell_id || null, req.user.id]
        );
      }
      await conn.commit();
      await createAuditLog({ actorId: req.user.id, action: 'OFFICER_CREATED', entityType: 'user', entityId: userId, newValue: { email, bureau_id } });
      return success(res, { id: userId }, 'Officer account created.', 201);
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  } catch (err) { next(err); }
}

async function updateUser(req, res, next) {
  try {
    const { name, phone, is_active, bureau_id, cell_id } = req.body;
    const userId = req.params.id;

    await pool.execute(
      `UPDATE users SET name=?, phone=?, is_active=? WHERE id=?`,
      [name, phone || null, is_active !== false, userId]
    );

    if (bureau_id !== undefined) {
      await pool.execute(`UPDATE officer_assignments SET is_active=0 WHERE user_id=?`, [userId]);
      if (bureau_id) {
        await pool.execute(
          `INSERT INTO officer_assignments (user_id, bureau_id, cell_id, assigned_by) VALUES (?, ?, ?, ?)`,
          [userId, bureau_id, cell_id || null, req.user.id]
        );
      }
    }
    await createAuditLog({ actorId: req.user.id, action: 'USER_UPDATED', entityType: 'user', entityId: userId });
    return success(res, null, 'User updated.');
  } catch (err) { next(err); }
}

async function resetUserPassword(req, res, next) {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) return error(res, 'Password must be at least 8 characters.', 400);
    const hash = await bcrypt.hash(newPassword, 12);
    await pool.execute(`UPDATE users SET password_hash=? WHERE id=?`, [hash, req.params.id]);
    await createAuditLog({ actorId: req.user.id, action: 'PASSWORD_RESET_ADMIN', entityType: 'user', entityId: req.params.id });
    return success(res, null, 'Password reset successfully.');
  } catch (err) { next(err); }
}

module.exports = { listOfficers, getAllUsers, createOfficer, updateUser, resetUserPassword };

