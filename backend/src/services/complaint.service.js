const { pool } = require('../config/database');
const { generateReferenceNumber } = require('../utils/referenceNumber');
const { classifyComplaint, findRelatedCases } = require('./ai.service');
const { createAuditLog } = require('./audit.service');
const {
  notifyComplaintSubmitted,
  notifyStatusChange,
  notifyAssignment,
  notifyInformationRequest,
  notifyResolution,
} = require('./notification.service');

// Valid status transitions
const STATUS_TRANSITIONS = {
  REGISTERED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['UNDER_ACTION', 'AWAITING_RESPONSE', 'REJECTED'],
  UNDER_ACTION: ['AWAITING_RESPONSE', 'RESOLVED', 'CLOSED', 'REJECTED'],
  AWAITING_RESPONSE: ['UNDER_ACTION', 'UNDER_REVIEW', 'CLOSED'],
  RESOLVED: ['CLOSED'],
  REJECTED: [],
  CLOSED: [],
};

function isValidTransition(from, to) {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

async function createComplaint({ studentId, data }) {
  const refNum = generateReferenceNumber();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Get category deadline
    let deadlineDays = 30;
    if (data.category_id) {
      const [catRows] = await conn.execute(
        `SELECT default_deadline_days FROM complaint_categories WHERE id = ?`,
        [data.category_id]
      );
      if (catRows.length > 0) deadlineDays = catRows[0].default_deadline_days || 30;
    }

    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + deadlineDays);

    const [result] = await conn.execute(
      `INSERT INTO complaints 
       (reference_number, student_id, institution_id, category_id, title, description, 
        incident_date, priority, deadline_date, privacy_acknowledged, declaration_acknowledged)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        refNum,
        studentId,
        data.institution_id,
        data.category_id || null,
        data.title,
        data.description,
        data.incident_date || null,
        data.priority || 'MEDIUM',
        deadlineDate.toISOString().split('T')[0],
        data.privacy_acknowledged ? 1 : 0,
        data.declaration_acknowledged ? 1 : 0,
      ]
    );

    const complaintId = result.insertId;

    // Record initial status
    await conn.execute(
      `INSERT INTO complaint_status_history (complaint_id, new_status, changed_by, reason)
       VALUES (?, 'REGISTERED', ?, 'Complaint submitted by student')`,
      [complaintId, studentId]
    );

    await conn.commit();

    // Fetch complete complaint
    const complaint = await getComplaintById(complaintId, null, true);

    // Async: AI classification + notifications (don't block response)
    setImmediate(async () => {
      try {
        const aiResult = await classifyComplaint(data.title, data.description);
        if (aiResult) {
          await pool.execute(
            `UPDATE complaints SET 
             ai_suggested_category_id = ?, ai_suggested_bureau_id = ?, ai_confidence = ?
             WHERE id = ?`,
            [
              aiResult.suggested_category_id || null,
              aiResult.suggested_bureau_id || null,
              aiResult.confidence || null,
              complaintId,
            ]
          );
        }
      } catch (e) {
        console.error('[AI classify error]', e.message);
      }

      await notifyComplaintSubmitted({ id: complaintId, title: data.title, reference_number: refNum }, studentId);
      await createAuditLog({
        actorId: studentId,
        action: 'COMPLAINT_CREATED',
        entityType: 'complaint',
        entityId: complaintId,
        newValue: { reference_number: refNum, title: data.title },
      });
    });

    return complaint;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function getComplaintById(id, requestingUser, adminAccess = false) {
  const [rows] = await pool.execute(
    `SELECT c.*,
            i.name AS institution_name, i.code AS institution_code,
            cat.name AS category_name,
            b.name AS bureau_name,
            cell.name AS cell_name,
            u.name AS student_name, u.email AS student_email,
            off.name AS officer_name,
            ai_cat.name AS ai_suggested_category_name,
            ai_bur.name AS ai_suggested_bureau_name
     FROM complaints c
     LEFT JOIN institutions i ON c.institution_id = i.id
     LEFT JOIN complaint_categories cat ON c.category_id = cat.id
     LEFT JOIN bureaus b ON c.current_bureau_id = b.id
     LEFT JOIN cells cell ON c.current_cell_id = cell.id
     LEFT JOIN users u ON c.student_id = u.id
     LEFT JOIN users off ON c.current_officer_id = off.id
     LEFT JOIN complaint_categories ai_cat ON c.ai_suggested_category_id = ai_cat.id
     LEFT JOIN bureaus ai_bur ON c.ai_suggested_bureau_id = ai_bur.id
     WHERE c.id = ?`,
    [id]
  );

  if (rows.length === 0) return null;
  const complaint = rows[0];

  if (!adminAccess && requestingUser) {
    if (requestingUser.role === 'student' && complaint.student_id !== requestingUser.id) {
      return null; // Return null for unauthorized access
    }
  }

  return complaint;
}

async function listComplaints({ user, filters, pagination }) {
  const { page, limit, offset } = pagination;
  const conditions = [];
  const params = [];

  // Role-based filtering
  if (user.role === 'student') {
    conditions.push('c.student_id = ?');
    params.push(user.id);
  } else if (user.role === 'officer') {
    // Officers see complaints in their bureau
    const [bureauRows] = await pool.execute(
      `SELECT bureau_id FROM officer_assignments WHERE user_id = ? AND is_active = 1`,
      [user.id]
    );
    if (bureauRows.length > 0) {
      conditions.push('c.current_bureau_id = ?');
      params.push(bureauRows[0].bureau_id);
    } else {
      // No bureau assigned — see nothing
      conditions.push('1 = 0');
    }
  }
  // super_admin sees all

  // Apply filters
  if (filters.status) { conditions.push('c.status = ?'); params.push(filters.status); }
  if (filters.category_id) { conditions.push('c.category_id = ?'); params.push(filters.category_id); }
  if (filters.institution_id) { conditions.push('c.institution_id = ?'); params.push(filters.institution_id); }
  if (filters.bureau_id) { conditions.push('c.current_bureau_id = ?'); params.push(filters.bureau_id); }
  if (filters.priority) { conditions.push('c.priority = ?'); params.push(filters.priority); }
  if (filters.is_overdue === 'true') { conditions.push('c.is_overdue = 1'); }
  if (filters.start_date) { conditions.push('c.created_at >= ?'); params.push(filters.start_date); }
  if (filters.end_date) { conditions.push('c.created_at <= ?'); params.push(filters.end_date + ' 23:59:59'); }
  if (filters.search) {
    conditions.push('(c.title LIKE ? OR c.reference_number LIKE ?)');
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sortMap = {
    created_at: 'c.created_at',
    updated_at: 'c.updated_at',
    status: 'c.status',
    priority: 'c.priority',
    title: 'c.title',
    deadline_date: 'c.deadline_date',
  };
  const sortCol = sortMap[filters.sort] || 'c.created_at';
  const sortDir = filters.order === 'asc' ? 'ASC' : 'DESC';

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM complaints c ${whereClause}`,
    params
  );
  const total = countRows[0].total;

  const [rows] = await pool.execute(
    `SELECT c.id, c.reference_number, c.title, c.status, c.priority, c.is_overdue,
            c.created_at, c.updated_at, c.deadline_date, c.current_bureau_id,
            i.name AS institution_name, cat.name AS category_name, b.name AS bureau_name,
            u.name AS student_name
     FROM complaints c
     LEFT JOIN institutions i ON c.institution_id = i.id
     LEFT JOIN complaint_categories cat ON c.category_id = cat.id
     LEFT JOIN bureaus b ON c.current_bureau_id = b.id
     LEFT JOIN users u ON c.student_id = u.id
     ${whereClause}
     ORDER BY ${sortCol} ${sortDir}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { rows, total };
}

async function changeComplaintStatus({ complaintId, newStatus, changedBy, reason, notes }) {
  const [rows] = await pool.execute(`SELECT status, student_id, reference_number, title FROM complaints WHERE id = ?`, [complaintId]);
  if (rows.length === 0) throw Object.assign(new Error('Complaint not found.'), { statusCode: 404, isOperational: true });

  const complaint = rows[0];
  if (!isValidTransition(complaint.status, newStatus)) {
    throw Object.assign(
      new Error(`Cannot transition from ${complaint.status} to ${newStatus}.`),
      { statusCode: 400, isOperational: true }
    );
  }

  if (newStatus === 'REJECTED' && !reason) {
    throw Object.assign(new Error('A reason is required when rejecting a complaint.'), { statusCode: 400, isOperational: true });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      `UPDATE complaints SET status = ?, updated_at = NOW() WHERE id = ?`,
      [newStatus, complaintId]
    );
    await conn.execute(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by, reason, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [complaintId, complaint.status, newStatus, changedBy, reason || null, notes || null]
    );
    await conn.commit();

    // Notify student
    setImmediate(async () => {
      await notifyStatusChange({ id: complaintId, reference_number: complaint.reference_number }, newStatus, complaint.student_id);
      if (newStatus === 'AWAITING_RESPONSE') {
        await notifyInformationRequest({ id: complaintId, reference_number: complaint.reference_number }, complaint.student_id);
      }
      if (newStatus === 'RESOLVED') {
        await notifyResolution({ id: complaintId, reference_number: complaint.reference_number }, complaint.student_id);
      }
      await createAuditLog({
        actorId: changedBy,
        action: 'STATUS_CHANGED',
        entityType: 'complaint',
        entityId: complaintId,
        previousValue: { status: complaint.status },
        newValue: { status: newStatus, reason },
      });
    });

    return { previousStatus: complaint.status, newStatus };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function assignComplaint({ complaintId, bureauId, cellId, officerId, assignedBy, transferReason }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Mark previous assignments as not current
    await conn.execute(
      `UPDATE complaint_assignments SET is_current = 0 WHERE complaint_id = ?`,
      [complaintId]
    );

    await conn.execute(
      `INSERT INTO complaint_assignments (complaint_id, bureau_id, cell_id, officer_id, assigned_by, transfer_reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [complaintId, bureauId || null, cellId || null, officerId || null, assignedBy, transferReason || null]
    );

    // Update complaint's current fields
    const [rows] = await conn.execute(`SELECT status FROM complaints WHERE id = ?`, [complaintId]);
    const newStatus = rows[0]?.status === 'REGISTERED' ? 'UNDER_REVIEW' : rows[0]?.status;

    await conn.execute(
      `UPDATE complaints SET 
       current_bureau_id = ?, current_cell_id = ?, current_officer_id = ?,
       status = ?, updated_at = NOW()
       WHERE id = ?`,
      [bureauId || null, cellId || null, officerId || null, newStatus, complaintId]
    );

    if (rows[0]?.status === 'REGISTERED') {
      await conn.execute(
        `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by, reason)
         VALUES (?, 'REGISTERED', 'UNDER_REVIEW', ?, 'Assigned to bureau')`,
        [complaintId, assignedBy]
      );
    }

    await conn.commit();

    if (officerId) {
      setImmediate(async () => {
        const [c] = await pool.execute(`SELECT reference_number FROM complaints WHERE id = ?`, [complaintId]);
        await notifyAssignment({ id: complaintId, reference_number: c[0]?.reference_number }, officerId);
        await createAuditLog({
          actorId: assignedBy,
          action: 'COMPLAINT_ASSIGNED',
          entityType: 'complaint',
          entityId: complaintId,
          newValue: { bureau_id: bureauId, cell_id: cellId, officer_id: officerId },
        });
      });
    }
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function resolveComplaint({ complaintId, resolvedBy, outcome, findings, decision, actionTaken }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await pool.execute(
      `SELECT status, student_id, reference_number FROM complaints WHERE id = ?`,
      [complaintId]
    );
    if (rows.length === 0) throw Object.assign(new Error('Complaint not found.'), { statusCode: 404, isOperational: true });

    const complaint = rows[0];
    if (!['UNDER_REVIEW', 'UNDER_ACTION'].includes(complaint.status)) {
      throw Object.assign(
        new Error('Complaint can only be resolved from UNDER_REVIEW or UNDER_ACTION status.'),
        { statusCode: 400, isOperational: true }
      );
    }

    await conn.execute(
      `INSERT INTO resolution_records (complaint_id, resolved_by, outcome, findings, decision, action_taken)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE outcome = VALUES(outcome), findings = VALUES(findings), 
       decision = VALUES(decision), action_taken = VALUES(action_taken), resolved_at = NOW()`,
      [complaintId, resolvedBy, outcome, findings || null, decision, actionTaken || null]
    );

    await conn.execute(`UPDATE complaints SET status = 'RESOLVED', updated_at = NOW() WHERE id = ?`, [complaintId]);
    await conn.execute(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by, reason)
       VALUES (?, ?, 'RESOLVED', ?, ?)`,
      [complaintId, complaint.status, resolvedBy, `Outcome: ${outcome}`]
    );

    await conn.commit();

    setImmediate(async () => {
      await notifyResolution({ id: complaintId, reference_number: complaint.reference_number }, complaint.student_id);
      await createAuditLog({
        actorId: resolvedBy,
        action: 'COMPLAINT_RESOLVED',
        entityType: 'complaint',
        entityId: complaintId,
        newValue: { outcome, decision },
      });
    });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function getRelatedCaseSuggestions(complaintId) {
  const [cRows] = await pool.execute(
    `SELECT c.id, c.title, c.description, c.institution_id, c.category_id 
     FROM complaints c WHERE c.id = ?`,
    [complaintId]
  );
  if (cRows.length === 0) return [];

  const query = cRows[0];

  // Get candidate complaints (all except this one, not CLOSED/REJECTED)
  const [candidates] = await pool.execute(
    `SELECT c.id AS complaint_id, c.reference_number, c.title, c.description,
            c.institution_id, c.category_id, c.status
     FROM complaints c
     WHERE c.id != ? AND c.status NOT IN ('REJECTED', 'CLOSED')
     ORDER BY c.created_at DESC
     LIMIT 200`,
    [complaintId]
  );

  if (candidates.length === 0) return [];

  const aiResult = await findRelatedCases(
    { complaint_id: query.id, title: query.title, description: query.description, institution_id: query.institution_id, category_id: query.category_id },
    candidates
  );

  // Store POTENTIALLY_RELATED results that don't already exist
  for (const match of (aiResult.related_cases || [])) {
    const [id1, id2] = [Math.min(complaintId, match.complaint_id), Math.max(complaintId, match.complaint_id)];
    try {
      await pool.execute(
        `INSERT IGNORE INTO related_complaints 
         (complaint_id_1, complaint_id_2, relationship_type, similarity_score, match_reasons, ai_model_version)
         VALUES (?, ?, 'POTENTIALLY_RELATED', ?, ?, ?)`,
        [id1, id2, match.similarity_score, JSON.stringify(match.match_reasons), aiResult.model_version]
      );
    } catch (_) {}
  }

  return aiResult.related_cases || [];
}

module.exports = {
  createComplaint,
  getComplaintById,
  listComplaints,
  changeComplaintStatus,
  assignComplaint,
  resolveComplaint,
  getRelatedCaseSuggestions,
  isValidTransition,
};
