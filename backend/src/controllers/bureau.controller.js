const { pool } = require('../config/database');
const { success, paginated, error } = require('../utils/response');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

async function listBureaus(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT b.*, (SELECT COUNT(*) FROM cells WHERE bureau_id = b.id AND is_active=1) AS cell_count FROM bureaus b ORDER BY b.name`
    );
    return success(res, rows);
  } catch (err) { next(err); }
}

async function getBureau(req, res, next) {
  try {
    const [rows] = await pool.execute(`SELECT * FROM bureaus WHERE id = ?`, [req.params.id]);
    if (!rows.length) return error(res, 'Bureau not found.', 404);
    const [cells] = await pool.execute(`SELECT * FROM cells WHERE bureau_id = ? AND is_active=1`, [req.params.id]);
    return success(res, { ...rows[0], cells });
  } catch (err) { next(err); }
}

async function createBureau(req, res, next) {
  try {
    const { name, description, email, phone } = req.body;
    if (!name) return error(res, 'Bureau name is required.', 400);
    const [result] = await pool.execute(
      `INSERT INTO bureaus (name, description, email, phone) VALUES (?, ?, ?, ?)`,
      [name, description || null, email || null, phone || null]
    );
    return success(res, { id: result.insertId }, 'Bureau created.', 201);
  } catch (err) { next(err); }
}

async function updateBureau(req, res, next) {
  try {
    const { name, description, email, phone, is_active } = req.body;
    await pool.execute(
      `UPDATE bureaus SET name=?, description=?, email=?, phone=?, is_active=? WHERE id=?`,
      [name, description || null, email || null, phone || null, is_active !== false, req.params.id]
    );
    return success(res, null, 'Bureau updated.');
  } catch (err) { next(err); }
}

async function listCells(req, res, next) {
  try {
    const bureauFilter = req.query.bureau_id ? 'WHERE c.bureau_id = ?' : '';
    const params = req.query.bureau_id ? [req.query.bureau_id] : [];
    const [rows] = await pool.execute(
      `SELECT c.*, b.name AS bureau_name FROM cells c JOIN bureaus b ON c.bureau_id = b.id ${bureauFilter} ORDER BY b.name, c.name`,
      params
    );
    return success(res, rows);
  } catch (err) { next(err); }
}

async function createCell(req, res, next) {
  try {
    const { bureau_id, name, description } = req.body;
    if (!bureau_id || !name) return error(res, 'Bureau ID and name are required.', 400);
    const [result] = await pool.execute(
      `INSERT INTO cells (bureau_id, name, description) VALUES (?, ?, ?)`,
      [bureau_id, name, description || null]
    );
    return success(res, { id: result.insertId }, 'Cell created.', 201);
  } catch (err) { next(err); }
}

module.exports = { listBureaus, getBureau, createBureau, updateBureau, listCells, createCell };

