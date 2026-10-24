const { pool } = require('../config/database');

async function createNotification({ userId, complaintId = null, title, message, type = 'GENERAL' }) {
  try {
    // Deduplicate: don't create duplicate notifications for same user+complaint+type in last 5 minutes
    if (complaintId) {
      const [existing] = await pool.execute(
        `SELECT id FROM notifications 
         WHERE user_id = ? AND complaint_id = ? AND type = ? 
         AND created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)`,
        [userId, complaintId, type]
      );
      if (existing.length > 0) return;
    }

    await pool.execute(
      `INSERT INTO notifications (user_id, complaint_id, title, message, type) VALUES (?, ?, ?, ?, ?)`,
      [userId, complaintId, title.substring(0, 255), message, type]
    );
  } catch (err) {
    console.error('[Notification Error]', err.message);
  }
}

async function notifyComplaintSubmitted(complaint, studentId) {
  await createNotification({
    userId: studentId,
    complaintId: complaint.id,
    title: 'Complaint Submitted',
    message: `Your complaint "${complaint.title}" has been registered with reference number ${complaint.reference_number}.`,
    type: 'COMPLAINT_SUBMITTED',
  });
}

async function notifyStatusChange(complaint, newStatus, userId) {
  await createNotification({
    userId,
    complaintId: complaint.id,
    title: `Complaint Status Updated`,
    message: `Your complaint ${complaint.reference_number} status has changed to ${newStatus.replace(/_/g, ' ')}.`,
    type: 'STATUS_CHANGE',
  });
}

async function notifyAssignment(complaint, officerId) {
  await createNotification({
    userId: officerId,
    complaintId: complaint.id,
    title: 'Complaint Assigned',
    message: `Complaint ${complaint.reference_number} has been assigned to you for review.`,
    type: 'COMPLAINT_ASSIGNED',
  });
}

async function notifyInformationRequest(complaint, studentId) {
  await createNotification({
    userId: studentId,
    complaintId: complaint.id,
    title: 'Additional Information Required',
    message: `The reviewing officer has requested additional information for complaint ${complaint.reference_number}.`,
    type: 'INFORMATION_REQUEST',
  });
}

async function notifyResolution(complaint, studentId) {
  await createNotification({
    userId: studentId,
    complaintId: complaint.id,
    title: 'Complaint Resolved',
    message: `Your complaint ${complaint.reference_number} has been resolved. Please log in to view the decision.`,
    type: 'RESOLUTION',
  });
}

module.exports = {
  createNotification,
  notifyComplaintSubmitted,
  notifyStatusChange,
  notifyAssignment,
  notifyInformationRequest,
  notifyResolution,
};
