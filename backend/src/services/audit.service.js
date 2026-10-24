const { pool } = require('../config/database');

async function createAuditLog({
  actorId = null,
  actorEmail = null,
  action,
  entityType = null,
  entityId = null,
  previousValue = null,
  newValue = null,
  ipAddress = null,
  userAgent = null,
  notes = null,
}) {
  try {
    await pool.execute(
      `INSERT INTO audit_logs 
       (actor_id, actor_email, action, entity_type, entity_id, previous_value, new_value, ip_address, user_agent, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        actorId,
        actorEmail,
        action,
        entityType,
        entityId,
        previousValue ? JSON.stringify(previousValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        ipAddress,
        userAgent ? userAgent.substring(0, 500) : null,
        notes,
      ]
    );
  } catch (err) {
    // Audit log failures should NOT crash the app
    console.error('[AuditLog Error]', err.message);
  }
}

module.exports = { createAuditLog };
