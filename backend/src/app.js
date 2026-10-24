const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const { requestLogger } = require('./middleware/requestLogger');
const { errorHandler } = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth.routes');
const complaintRoutes = require('./routes/complaint.routes');
const bureauRoutes = require('./routes/bureau.routes');
const officerRoutes = require('./routes/officer.routes');
const institutionRoutes = require('./routes/institution.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const notificationRoutes = require('./routes/notification.routes');
const auditLogRoutes = require('./routes/auditLog.routes');
const settingRoutes = require('./routes/setting.routes');
const relatedCaseRoutes = require('./routes/relatedCase.routes');

const app = express();

// Security & CORS
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-origin' } }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Request parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(requestLogger);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ResolveIQ API is running.', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/bureaus', bureauRoutes);
app.use('/api/officers', officerRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/related-cases', relatedCaseRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found.` });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;

