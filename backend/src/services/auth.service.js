const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../config/database');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { createAuditLog } = require('./audit.service');

const SALT_ROUNDS = 12;

/**
 * Authenticate user credentials. Returns tokens on success.
 */
async function login(email, password, ipAddress, userAgent) {
  const [rows] = await pool.execute(
    `SELECT u.id, u.role_id, u.name, u.email, u.password_hash, u.phone,
            u.is_active, u.email_verified, r.name AS role
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.email = ?`,
    [email]
  );

  if (rows.length === 0) {
    throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401, isOperational: true });
  }

  const user = rows[0];

  if (!user.is_active) {
    throw Object.assign(new Error('Account is deactivated. Please contact support.'), { statusCode: 403, isOperational: true });
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    await createAuditLog({
      actorEmail: email,
      action: 'LOGIN_FAILED',
      ipAddress,
      userAgent,
      notes: 'Invalid password attempt',
    });
    throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401, isOperational: true });
  }

  const tokenPayload = { userId: user.id, role: user.role, email: user.email };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  // Store hashed refresh token
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await pool.execute(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
    [user.id, tokenHash, expiresAt]
  );

  // Update last_login
  await pool.execute(`UPDATE users SET last_login = NOW() WHERE id = ?`, [user.id]);

  await createAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    action: 'LOGIN_SUCCESS',
    ipAddress,
    userAgent,
  });

  const { password_hash, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken };
}

/**
 * Register a new student account.
 */
async function register({ name, email, password, phone }) {
  const [existing] = await pool.execute(`SELECT id FROM users WHERE email = ?`, [email]);
  if (existing.length > 0) {
    throw Object.assign(new Error('An account with this email already exists.'), { statusCode: 409, isOperational: true });
  }

  const [roleRows] = await pool.execute(`SELECT id FROM roles WHERE name = 'student'`);
  if (roleRows.length === 0) {
    throw Object.assign(new Error('Student role not configured.'), { statusCode: 500, isOperational: true });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.execute(
      `INSERT INTO users (role_id, name, email, password_hash, phone) VALUES (?, ?, ?, ?, ?)`,
      [roleRows[0].id, name, email, passwordHash, phone || null]
    );
    const userId = result.insertId;

    // Create empty student profile
    await conn.execute(
      `INSERT INTO student_profiles (user_id) VALUES (?)`,
      [userId]
    );

    await conn.commit();

    const [userRows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.phone, u.is_active, u.created_at, r.name AS role
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      [userId]
    );

    return userRows[0];
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Refresh access token using a valid refresh token.
 */
async function refreshAccessToken(refreshToken) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token.'), { statusCode: 401, isOperational: true });
  }

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const [rows] = await pool.execute(
    `SELECT id FROM refresh_tokens
     WHERE token_hash = ? AND user_id = ? AND revoked_at IS NULL AND expires_at > NOW()`,
    [tokenHash, decoded.userId]
  );

  if (rows.length === 0) {
    throw Object.assign(new Error('Refresh token is invalid or has been revoked.'), { statusCode: 401, isOperational: true });
  }

  const [userRows] = await pool.execute(
    `SELECT u.id, u.email, r.name AS role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ? AND u.is_active = 1`,
    [decoded.userId]
  );
  if (userRows.length === 0) {
    throw Object.assign(new Error('User not found.'), { statusCode: 401, isOperational: true });
  }

  const user = userRows[0];
  const newAccessToken = signAccessToken({ userId: user.id, role: user.role, email: user.email });
  return { accessToken: newAccessToken };
}

/**
 * Logout — revoke the refresh token.
 */
async function logout(refreshToken, userId, ipAddress, userAgent) {
  if (refreshToken) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await pool.execute(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ? AND user_id = ?`,
      [tokenHash, userId]
    );
  }
  await createAuditLog({ actorId: userId, action: 'LOGOUT', ipAddress, userAgent });
}

/**
 * Change user password.
 */
async function changePassword(userId, currentPassword, newPassword) {
  const [rows] = await pool.execute(`SELECT password_hash FROM users WHERE id = ?`, [userId]);
  if (rows.length === 0) {
    throw Object.assign(new Error('User not found.'), { statusCode: 404, isOperational: true });
  }

  const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!match) {
    throw Object.assign(new Error('Current password is incorrect.'), { statusCode: 400, isOperational: true });
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.execute(`UPDATE users SET password_hash = ? WHERE id = ?`, [newHash, userId]);

  // Revoke all refresh tokens
  await pool.execute(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?`, [userId]);
}

/**
 * Forgot password — generate reset token (logged, no email for demo).
 */
async function forgotPassword(email) {
  const [rows] = await pool.execute(`SELECT id FROM users WHERE email = ?`, [email]);
  // Always return success to prevent email enumeration
  if (rows.length === 0) return { message: 'If that email is registered, you will receive reset instructions.' };

  const userId = rows[0].id;
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await pool.execute(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`,
    [userId, token, expiresAt]
  );

  // In production, send email. For demo, log the token.
  console.log(`[DEMO] Password reset token for ${email}: ${token}`);

  return { message: 'If that email is registered, you will receive reset instructions.', debug_token: token };
}

/**
 * Reset password with token.
 */
async function resetPassword(token, newPassword) {
  const [rows] = await pool.execute(
    `SELECT user_id FROM password_reset_tokens
     WHERE token = ? AND expires_at > NOW() AND used_at IS NULL`,
    [token]
  );

  if (rows.length === 0) {
    throw Object.assign(new Error('Reset token is invalid or has expired.'), { statusCode: 400, isOperational: true });
  }

  const userId = rows[0].user_id;
  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(`UPDATE users SET password_hash = ? WHERE id = ?`, [newHash, userId]);
    await conn.execute(`UPDATE password_reset_tokens SET used_at = NOW() WHERE token = ?`, [token]);
    await conn.execute(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?`, [userId]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { login, register, refreshAccessToken, logout, changePassword, forgotPassword, resetPassword };
