const { pool } = require('../config/database');
const { complaintService } = require('../services/complaint.service');

/**
 * Deadline monitoring job.
 * Marks complaints as overdue when past their deadline date.
 * Runs once on startup then every hour.
 */
async function runDeadlineCheck() {
  try {
    console.log('[DeadlineJob] Running overdue check...');

    // Mark overdue complaints
    const [result] = await pool.execute(
      `UPDATE complaints 
       SET is_overdue = 1
       WHERE deadline_date < CURDATE()
         AND is_overdue = 0
         AND status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')`
    );

    if (result.affectedRows > 0) {
      console.log(`[DeadlineJob] Marked ${result.affectedRows} complaint(s) as overdue.`);

      // Create notifications for newly overdue complaints
      const [overdueComplaints] = await pool.execute(
        `SELECT c.id, c.reference_number, c.student_id, c.current_officer_id
         FROM complaints c
         WHERE c.is_overdue = 1 AND c.status NOT IN ('RESOLVED','CLOSED','REJECTED')
         AND NOT EXISTS (
           SELECT 1 FROM notifications n 
           WHERE n.complaint_id = c.id AND n.type = 'OVERDUE' 
           AND n.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
         )
         LIMIT 100`
      );

      for (const c of overdueComplaints) {
        // Notify officer if assigned
        if (c.current_officer_id) {
          await pool.execute(
            `INSERT INTO notifications (user_id, complaint_id, title, message, type) VALUES (?, ?, ?, ?, 'OVERDUE')`,
            [c.current_officer_id, c.id, 'Complaint Overdue', `Complaint ${c.reference_number} is past its deadline.`]
          );
        }
        // Notify student
        await pool.execute(
          `INSERT IGNORE INTO notifications (user_id, complaint_id, title, message, type) VALUES (?, ?, ?, ?, 'OVERDUE')`,
          [c.student_id, c.id, 'Complaint Overdue', `Your complaint ${c.reference_number} has exceeded its expected resolution date.`]
        );
      }
    } else {
      console.log('[DeadlineJob] No new overdue complaints found.');
    }
  } catch (err) {
    console.error('[DeadlineJob Error]', err.message);
  }
}

function startDeadlineJob() {
  // Run immediately on startup
  setTimeout(runDeadlineCheck, 5000);

  // Then every hour
  const INTERVAL = 60 * 60 * 1000;
  setInterval(runDeadlineCheck, INTERVAL);
  console.log('[DeadlineJob] Scheduled to run every hour.');
}

module.exports = { startDeadlineJob, runDeadlineCheck };

