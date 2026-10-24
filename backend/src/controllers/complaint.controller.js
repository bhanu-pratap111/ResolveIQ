const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { pool } = require('../config/database');
const complaintService = require('../services/complaint.service');
const { success, paginated, error } = require('../utils/response');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, JPG, and PNG files are allowed.'));
  },
});

async function list(req, res, next) {
  try {
    const pagination = getPagination(req.query);
    const filters = {
      status: req.query.status,
      category_id: req.query.category_id,
      institution_id: req.query.institution_id,
      bureau_id: req.query.bureau_id,
      priority: req.query.priority,
      is_overdue: req.query.is_overdue,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      search: req.query.search,
      sort: req.query.sort || 'created_at',
      order: req.query.order || 'desc',
    };
    const { rows, total } = await complaintService.listComplaints({ user: req.user, filters, pagination });
    return paginated(res, rows, buildPaginationMeta(total, pagination.page, pagination.limit));
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    if (req.user.role !== 'student') return error(res, 'Only students can submit complaints.', 403);
    const required = ['institution_id', 'title', 'description'];
    for (const field of required) {
      if (!req.body[field]) return error(res, `${field} is required.`, 400);
    }
    if (req.body.description.length < 20) return error(res, 'Description must be at least 20 characters.', 400);
    if (!req.body.privacy_acknowledged || !req.body.declaration_acknowledged) {
      return error(res, 'You must acknowledge the privacy notice and declaration.', 400);
    }
    const complaint = await complaintService.createComplaint({ studentId: req.user.id, data: req.body });
    return success(res, complaint, 'Complaint submitted successfully.', 201);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const adminAccess = ['super_admin', 'officer'].includes(req.user.role);
    const complaint = await complaintService.getComplaintById(parseInt(req.params.id), req.user, adminAccess);
    if (!complaint) return error(res, 'Complaint not found or access denied.', 404);
    return success(res, complaint);
  } catch (err) { next(err); }
}

async function getByReference(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT id FROM complaints WHERE reference_number = ?`,
      [req.params.refNum]
    );
    if (rows.length === 0) return error(res, 'Complaint not found.', 404);
    const adminAccess = ['super_admin', 'officer'].includes(req.user.role);
    const complaint = await complaintService.getComplaintById(rows[0].id, req.user, adminAccess);
    if (!complaint) return error(res, 'Access denied.', 403);
    return success(res, complaint);
  } catch (err) { next(err); }
}

async function changeStatus(req, res, next) {
  try {
    if (req.user.role === 'student') return error(res, 'Students cannot change complaint status.', 403);
    const { status, reason, notes } = req.body;
    if (!status) return error(res, 'New status is required.', 400);
    const result = await complaintService.changeComplaintStatus({
      complaintId: parseInt(req.params.id),
      newStatus: status,
      changedBy: req.user.id,
      reason,
      notes,
    });
    return success(res, result, 'Status updated.');
  } catch (err) { next(err); }
}

async function getTimeline(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT csh.*, u.name AS changed_by_name, u.email AS changed_by_email
       FROM complaint_status_history csh
       JOIN users u ON csh.changed_by = u.id
       WHERE csh.complaint_id = ?
       ORDER BY csh.created_at ASC`,
      [req.params.id]
    );
    return success(res, rows);
  } catch (err) { next(err); }
}

async function getMessages(req, res, next) {
  try {
    const complaintId = parseInt(req.params.id);
    const isStudent = req.user.role === 'student';

    // Verify access
    if (isStudent) {
      const [c] = await pool.execute(`SELECT student_id FROM complaints WHERE id = ?`, [complaintId]);
      if (!c.length || c[0].student_id !== req.user.id) return error(res, 'Access denied.', 403);
    }

    const visibilityFilter = isStudent ? 'AND cm.is_visible_to_student = 1' : '';
    const [rows] = await pool.execute(
      `SELECT cm.*, u.name AS sender_name, r.name AS sender_role
       FROM complaint_messages cm
       JOIN users u ON cm.sender_id = u.id
       JOIN roles r ON u.role_id = r.id
       WHERE cm.complaint_id = ? ${visibilityFilter}
       ORDER BY cm.created_at ASC`,
      [complaintId]
    );
    return success(res, rows);
  } catch (err) { next(err); }
}

async function sendMessage(req, res, next) {
  try {
    const complaintId = parseInt(req.params.id);
    const { message, message_type, is_visible_to_student } = req.body;
    if (!message?.trim()) return error(res, 'Message is required.', 400);

    // Verify access
    if (req.user.role === 'student') {
      const [c] = await pool.execute(`SELECT student_id, status FROM complaints WHERE id = ?`, [complaintId]);
      if (!c.length || c[0].student_id !== req.user.id) return error(res, 'Access denied.', 403);
    }

    const msgType = req.user.role === 'student' ? 'STUDENT_RESPONSE' : (message_type || 'OFFICIAL_COMMUNICATION');
    const visible = req.user.role === 'student' ? true : (is_visible_to_student !== false);

    const [result] = await pool.execute(
      `INSERT INTO complaint_messages (complaint_id, sender_id, message, message_type, is_visible_to_student)
       VALUES (?, ?, ?, ?, ?)`,
      [complaintId, req.user.id, message.trim(), msgType, visible ? 1 : 0]
    );
    return success(res, { id: result.insertId }, 'Message sent.', 201);
  } catch (err) { next(err); }
}

async function getNotes(req, res, next) {
  try {
    if (!['officer', 'super_admin'].includes(req.user.role)) return error(res, 'Access denied.', 403);
    const [rows] = await pool.execute(
      `SELECT cin.*, u.name AS author_name FROM complaint_internal_notes cin
       JOIN users u ON cin.author_id = u.id
       WHERE cin.complaint_id = ? ORDER BY cin.created_at ASC`,
      [req.params.id]
    );
    return success(res, rows);
  } catch (err) { next(err); }
}

async function addNote(req, res, next) {
  try {
    if (!['officer', 'super_admin'].includes(req.user.role)) return error(res, 'Access denied.', 403);
    const { note } = req.body;
    if (!note?.trim()) return error(res, 'Note is required.', 400);
    const [result] = await pool.execute(
      `INSERT INTO complaint_internal_notes (complaint_id, author_id, note) VALUES (?, ?, ?)`,
      [req.params.id, req.user.id, note.trim()]
    );
    return success(res, { id: result.insertId }, 'Note added.', 201);
  } catch (err) { next(err); }
}

async function uploadEvidence(req, res, next) {
  upload.single('evidence')(req, res, async (err) => {
    if (err) return error(res, err.message, 400);
    if (!req.file) return error(res, 'No file uploaded.', 400);
    try {
      const complaintId = parseInt(req.params.id);
      const [result] = await pool.execute(
        `INSERT INTO complaint_evidence (complaint_id, uploaded_by, original_filename, stored_filename, file_path, mime_type, file_size)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [complaintId, req.user.id, req.file.originalname, req.file.filename,
         req.file.path, req.file.mimetype, req.file.size]
      );
      return success(res, { id: result.insertId, filename: req.file.originalname }, 'File uploaded.', 201);
    } catch (e) { next(e); }
  });
}

async function listEvidence(req, res, next) {
  try {
    const complaintId = parseInt(req.params.id);
    const isStudent = req.user.role === 'student';
    const publicFilter = isStudent ? 'AND ce.is_public = 1' : '';
    const [rows] = await pool.execute(
      `SELECT ce.id, ce.original_filename, ce.mime_type, ce.file_size, ce.is_public, ce.created_at,
              u.name AS uploaded_by_name
       FROM complaint_evidence ce JOIN users u ON ce.uploaded_by = u.id
       WHERE ce.complaint_id = ? ${publicFilter}
       ORDER BY ce.created_at DESC`,
      [complaintId]
    );
    return success(res, rows);
  } catch (err) { next(err); }
}

async function downloadEvidence(req, res, next) {
  try {
    const { id: complaintId, evidenceId } = req.params;
    const [rows] = await pool.execute(
      `SELECT ce.*, c.student_id FROM complaint_evidence ce
       JOIN complaints c ON ce.complaint_id = c.id
       WHERE ce.id = ? AND ce.complaint_id = ?`,
      [evidenceId, complaintId]
    );
    if (rows.length === 0) return error(res, 'File not found.', 404);
    const ev = rows[0];

    // Access check
    if (req.user.role === 'student') {
      if (ev.student_id !== req.user.id || !ev.is_public) return error(res, 'Access denied.', 403);
    }

    const filePath = path.resolve(ev.file_path);
    if (!filePath.startsWith(path.resolve(UPLOAD_DIR))) return error(res, 'Invalid file path.', 400);
    if (!fs.existsSync(filePath)) return error(res, 'File not found on server.', 404);

    return res.download(filePath, ev.original_filename);
  } catch (err) { next(err); }
}

async function getRelated(req, res, next) {
  try {
    const complaintId = parseInt(req.params.id);
    const suggestions = await complaintService.getRelatedCaseSuggestions(complaintId);
    return success(res, suggestions);
  } catch (err) { next(err); }
}

async function resolve(req, res, next) {
  try {
    if (!['officer', 'super_admin'].includes(req.user.role)) return error(res, 'Access denied.', 403);
    const { outcome, findings, decision, action_taken } = req.body;
    if (!outcome || !decision) return error(res, 'Outcome and decision are required.', 400);
    await complaintService.resolveComplaint({
      complaintId: parseInt(req.params.id),
      resolvedBy: req.user.id,
      outcome, findings, decision, actionTaken: action_taken,
    });
    return success(res, null, 'Complaint resolved successfully.');
  } catch (err) { next(err); }
}

async function getResolution(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT rr.*, u.name AS resolved_by_name FROM resolution_records rr
       JOIN users u ON rr.resolved_by = u.id
       WHERE rr.complaint_id = ?`,
      [req.params.id]
    );
    return success(res, rows[0] || null);
  } catch (err) { next(err); }
}

async function updateAiSuggestion(req, res, next) {
  try {
    if (!['officer', 'super_admin'].includes(req.user.role)) return error(res, 'Access denied.', 403);
    const { accepted, category_id, bureau_id } = req.body;
    await pool.execute(
      `UPDATE complaints SET 
       ai_suggestion_accepted = ?, ai_suggestion_accepted_at = NOW(), ai_suggestion_accepted_by = ?,
       category_id = COALESCE(?, category_id), current_bureau_id = COALESCE(?, current_bureau_id)
       WHERE id = ?`,
      [accepted ? 1 : 0, req.user.id, category_id || null, bureau_id || null, req.params.id]
    );
    return success(res, null, 'AI suggestion updated.');
  } catch (err) { next(err); }
}

module.exports = {
  list, create, getOne, getByReference, changeStatus, getTimeline,
  getMessages, sendMessage, getNotes, addNote,
  uploadEvidence, listEvidence, downloadEvidence,
  getRelated, resolve, getResolution, updateAiSuggestion,
};

