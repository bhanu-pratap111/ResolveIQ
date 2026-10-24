const authService = require('../services/auth.service');
const { success, error } = require('../utils/response');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 'Email and password are required.', 400);
    const result = await authService.login(email, password, req.ip, req.headers['user-agent']);
    return success(res, result, 'Login successful.');
  } catch (err) { next(err); }
}

async function register(req, res, next) {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return error(res, 'Name, email and password are required.', 400);
    if (password.length < 8) return error(res, 'Password must be at least 8 characters.', 400);
    const user = await authService.register({ name, email, password, phone });
    return success(res, user, 'Registration successful. Please log in.', 201);
  } catch (err) { next(err); }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return error(res, 'Refresh token required.', 400);
    const result = await authService.refreshAccessToken(refreshToken);
    return success(res, result, 'Token refreshed.');
  } catch (err) { next(err); }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken, req.user.id, req.ip, req.headers['user-agent']);
    return success(res, null, 'Logged out successfully.');
  } catch (err) { next(err); }
}

async function getMe(req, res, next) {
  try {
    return success(res, req.user, 'Current user.');
  } catch (err) { next(err); }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return error(res, 'Both passwords required.', 400);
    if (newPassword.length < 8) return error(res, 'New password must be at least 8 characters.', 400);
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    return success(res, null, 'Password changed successfully.');
  } catch (err) { next(err); }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return error(res, 'Email is required.', 400);
    const result = await authService.forgotPassword(email);
    return success(res, result, result.message);
  } catch (err) { next(err); }
}

async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return error(res, 'Token and new password required.', 400);
    await authService.resetPassword(token, newPassword);
    return success(res, null, 'Password reset successfully.');
  } catch (err) { next(err); }
}

module.exports = { login, register, refresh, logout, getMe, changePassword, forgotPassword, resetPassword };
