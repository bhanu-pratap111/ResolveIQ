const { pool } = require('../config/database');
const { success, paginated, error } = require('../utils/response');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

async function getDashboard(req, res, next) {
  try {
    const { start_date, end_date, bureau_id } = req.query;
    const dateFilter = start_date ? `AND c.created_at >= '${start_date}'` : '';
    const dateFilterEnd = end_date ? `AND c.created_at <= '${end_date} 23:59:59'` : '';
    const bureauFilter = bureau_id ? `AND c.current_bureau_id = ${parseInt(bureau_id)}` : '';

    const [stats] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(status='REGISTERED') AS registered,
         SUM(status='UNDER_REVIEW') AS under_review,
         SUM(status='UNDER_ACTION') AS under_action,
         SUM(status='AWAITING_RESPONSE') AS awaiting_response,
         SUM(status='RESOLVED') AS resolved,
         SUM(status='CLOSED') AS closed,
         SUM(status='REJECTED') AS rejected,
         SUM(current_bureau_id IS NULL AND status='REGISTERED') AS unassigned,
         SUM(is_overdue=1) AS overdue,
         ROUND(SUM(status IN ('RESOLVED','CLOSED')) / NULLIF(COUNT(*),0) * 100, 1) AS resolution_rate
       FROM complaints c WHERE 1=1 ${dateFilter} ${dateFilterEnd} ${bureauFilter}`
    );

    const [trend] = await pool.execute(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
       FROM complaints WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY month ORDER BY month`
    );

    const [statusDist] = await pool.execute(
      `SELECT status, COUNT(*) AS count FROM complaints GROUP BY status`
    );

    const [bureauStats] = await pool.execute(
      `SELECT b.name AS bureau, COUNT(c.id) AS count
       FROM bureaus b LEFT JOIN complaints c ON c.current_bureau_id = b.id
       GROUP BY b.id, b.name ORDER BY count DESC LIMIT 5`
    );

    const [recentActivity] = await pool.execute(
      `SELECT c.id, c.reference_number, c.title, c.status, c.updated_at, i.name AS institution_name
       FROM complaints c JOIN institutions i ON c.institution_id = i.id
       ORDER BY c.updated_at DESC LIMIT 10`
    );

    const [overdueAlerts] = await pool.execute(
      `SELECT c.id, c.reference_number, c.title, c.deadline_date, b.name AS bureau_name
       FROM complaints c LEFT JOIN bureaus b ON c.current_bureau_id = b.id
       WHERE c.is_overdue = 1 AND c.status NOT IN ('RESOLVED','CLOSED','REJECTED')
       ORDER BY c.deadline_date ASC LIMIT 5`
    );

    return success(res, {
      stats: stats[0],
      trend,
      statusDistribution: statusDist,
      bureauStats,
      recentActivity,
      overdueAlerts,
    });
  } catch (err) { next(err); }
}

async function getBureauStats(req, res, next) {
  try {
    const { start_date, end_date } = req.query;
    const dateFilter = start_date ? `AND c.created_at >= '${start_date}'` : '';
    const dateFilterEnd = end_date ? `AND c.created_at <= '${end_date} 23:59:59'` : '';

    const [rows] = await pool.execute(
      `SELECT
         b.id, b.name AS bureau_name,
         COUNT(c.id) AS total,
         SUM(c.status='REGISTERED') AS registered,
         SUM(c.status='UNDER_REVIEW') AS under_review,
         SUM(c.status='UNDER_ACTION') AS under_action,
         SUM(c.status='AWAITING_RESPONSE') AS awaiting_response,
         SUM(c.status='RESOLVED') AS resolved,
         SUM(c.status='CLOSED') AS closed,
         SUM(c.status='REJECTED') AS rejected,
         SUM(c.is_overdue=1) AS overdue,
         ROUND(SUM(c.status IN ('RESOLVED','CLOSED')) / NULLIF(COUNT(c.id),0) * 100, 1) AS resolution_rate,
         ROUND(AVG(DATEDIFF(COALESCE(rr.resolved_at, NOW()), c.created_at)), 1) AS avg_days
       FROM bureaus b
       LEFT JOIN complaints c ON c.current_bureau_id = b.id ${dateFilter} ${dateFilterEnd}
       LEFT JOIN resolution_records rr ON rr.complaint_id = c.id
       WHERE b.is_active = 1
       GROUP BY b.id, b.name ORDER BY b.name`
    );
    return success(res, rows);
  } catch (err) { next(err); }
}

async function getComplaintTrends(req, res, next) {
  try {
    const months = parseInt(req.query.months) || 12;
    const [rows] = await pool.execute(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
              COUNT(*) AS total,
              SUM(status IN ('RESOLVED','CLOSED')) AS resolved
       FROM complaints WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
       GROUP BY month ORDER BY month`,
      [months]
    );
    return success(res, rows);
  } catch (err) { next(err); }
}

async function getCategoryDistribution(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT cat.name AS category, COUNT(c.id) AS count
       FROM complaint_categories cat
       LEFT JOIN complaints c ON c.category_id = cat.id
       GROUP BY cat.id, cat.name ORDER BY count DESC`
    );
    return success(res, rows);
  } catch (err) { next(err); }
}

async function getStatusDistribution(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT status, COUNT(*) AS count FROM complaints GROUP BY status ORDER BY count DESC`
    );
    return success(res, rows);
  } catch (err) { next(err); }
}

async function getResolutionTime(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT cat.name AS category,
              ROUND(AVG(DATEDIFF(rr.resolved_at, c.created_at)), 1) AS avg_days,
              COUNT(*) AS count
       FROM complaints c
       JOIN resolution_records rr ON rr.complaint_id = c.id
       LEFT JOIN complaint_categories cat ON c.category_id = cat.id
       GROUP BY cat.id, cat.name ORDER BY avg_days DESC`
    );
    return success(res, rows);
  } catch (err) { next(err); }
}

async function getOfficerDashboard(req, res, next) {
  try {
    const userId = req.user.id;
    const [bureauRows] = await pool.execute(
      `SELECT bureau_id FROM officer_assignments WHERE user_id = ? AND is_active = 1`,
      [userId]
    );
    const bureauId = bureauRows[0]?.bureau_id;

    const [stats] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(status='REGISTERED') AS new_assigned,
         SUM(status='UNDER_REVIEW') AS under_review,
         SUM(status='UNDER_ACTION') AS under_action,
         SUM(status='AWAITING_RESPONSE') AS awaiting_response,
         SUM(is_overdue=1) AS overdue
       FROM complaints WHERE current_bureau_id = ? AND status NOT IN ('RESOLVED','CLOSED','REJECTED')`,
      [bureauId || 0]
    );

    const [recent] = await pool.execute(
      `SELECT c.id, c.reference_number, c.title, c.status, c.priority, c.is_overdue,
              c.updated_at, i.name AS institution_name
       FROM complaints c JOIN institutions i ON c.institution_id = i.id
       WHERE c.current_bureau_id = ? AND c.status NOT IN ('CLOSED','REJECTED')
       ORDER BY c.updated_at DESC LIMIT 10`,
      [bureauId || 0]
    );

    return success(res, { stats: stats[0], recentComplaints: recent, bureau_id: bureauId });
  } catch (err) { next(err); }
}

async function getStudentDashboard(req, res, next) {
  try {
    const [stats] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(status='REGISTERED') AS registered,
         SUM(status='UNDER_REVIEW') AS under_review,
         SUM(status='UNDER_ACTION') AS under_action,
         SUM(status='AWAITING_RESPONSE') AS awaiting_response,
         SUM(status='RESOLVED') AS resolved,
         SUM(status='CLOSED') AS closed
       FROM complaints WHERE student_id = ?`,
      [req.user.id]
    );
    const [recent] = await pool.execute(
      `SELECT c.id, c.reference_number, c.title, c.status, c.updated_at, i.name AS institution_name
       FROM complaints c JOIN institutions i ON c.institution_id = i.id
       WHERE c.student_id = ? ORDER BY c.updated_at DESC LIMIT 5`,
      [req.user.id]
    );
    return success(res, { stats: stats[0], recentComplaints: recent });
  } catch (err) { next(err); }
}

module.exports = {
  getDashboard, getBureauStats, getComplaintTrends, getCategoryDistribution,
  getStatusDistribution, getResolutionTime, getOfficerDashboard, getStudentDashboard,
};

