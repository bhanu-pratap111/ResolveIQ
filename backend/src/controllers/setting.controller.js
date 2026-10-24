const { pool } = require('../config/database');
const { success, error } = require('../utils/response');
const { createAuditLog } = require('../services/audit.service');

async function getSettings(req, res, next) {
  try {
    const [rows] = await pool.execute(`SELECT setting_key, setting_value, description FROM system_settings ORDER BY setting_key`);
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = { value: r.setting_value, description: r.description }; });
    return success(res, settings);
  } catch (err) { next(err); }
}

async function updateSetting(req, res, next) {
  try {
    const { key } = req.params;
    const { value } = req.body;
    if (!value) return error(res, 'Value is required.', 400);
    await pool.execute(
      `UPDATE system_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?`,
      [value, req.user.id, key]
    );
    await createAuditLog({
      actorId: req.user.id, action: 'SETTING_UPDATED',
      entityType: 'system_setting', notes: `Updated ${key} to ${value}`,
    });
    return success(res, null, 'Setting updated.');
  } catch (err) { next(err); }
}

async function getCategories(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT cc.*, cbr.bureau_id, b.name AS bureau_name
       FROM complaint_categories cc
       LEFT JOIN category_bureau_rules cbr ON cbr.category_id = cc.id AND cbr.is_active = 1
       LEFT JOIN bureaus b ON cbr.bureau_id = b.id
       WHERE cc.is_active = 1 ORDER BY cc.name`
    );
    return success(res, rows);
  } catch (err) { next(err); }
}

module.exports = { getSettings, updateSetting, getCategories };

