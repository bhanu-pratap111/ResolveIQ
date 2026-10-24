const { pool } = require('../config/database');
const { success, paginated, error } = require('../utils/response');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { createAuditLog } = require('../services/audit.service');

async function confirmRelated(req, res, next) {
  try {
    const { complaint_id_1, complaint_id_2, relationship_type, confirmation_notes } = req.body;
    if (!complaint_id_1 || !complaint_id_2 || !relationship_type) {
      return error(res, 'complaint_id_1, complaint_id_2, and relationship_type are required.', 400);
    }
    const validTypes = ['POTENTIALLY_RELATED', 'CONFIRMED_RELATED', 'DUPLICATE', 'NOT_RELATED'];
    if (!validTypes.includes(relationship_type)) return error(res, 'Invalid relationship type.', 400);

    const [id1, id2] = [Math.min(complaint_id_1, complaint_id_2), Math.max(complaint_id_1, complaint_id_2)];

    await pool.execute(
      `INSERT INTO related_complaints 
       (complaint_id_1, complaint_id_2, relationship_type, confirmed_by, confirmed_at, confirmation_notes)
       VALUES (?, ?, ?, ?, NOW(), ?)
       ON DUPLICATE KEY UPDATE relationship_type=VALUES(relationship_type), 
       confirmed_by=VALUES(confirmed_by), confirmed_at=NOW(), confirmation_notes=VALUES(confirmation_notes)`,
      [id1, id2, relationship_type, req.user.id, confirmation_notes || null]
    );

    await createAuditLog({
      actorId: req.user.id,
      action: relationship_type === 'NOT_RELATED' ? 'RELATED_CASE_REJECTED' : 'RELATED_CASE_CONFIRMED',
      entityType: 'related_complaint',
      newValue: { complaint_id_1: id1, complaint_id_2: id2, relationship_type },
    });
    return success(res, null, 'Relationship updated.');
  } catch (err) { next(err); }
}

async function getRelated(req, res, next) {
  try {
    const complaintId = req.params.id;
    const [rows] = await pool.execute(
      `SELECT rc.*,
              c1.reference_number AS ref1, c1.title AS title1, c1.status AS status1,
              c2.reference_number AS ref2, c2.title AS title2, c2.status AS status2,
              u.name AS confirmed_by_name
       FROM related_complaints rc
       JOIN complaints c1 ON rc.complaint_id_1 = c1.id
       JOIN complaints c2 ON rc.complaint_id_2 = c2.id
       LEFT JOIN users u ON rc.confirmed_by = u.id
       WHERE (rc.complaint_id_1 = ? OR rc.complaint_id_2 = ?)
         AND rc.relationship_type != 'NOT_RELATED'
       ORDER BY rc.created_at DESC`,
      [complaintId, complaintId]
    );
    return success(res, rows);
  } catch (err) { next(err); }
}

module.exports = { confirmRelated, getRelated };

