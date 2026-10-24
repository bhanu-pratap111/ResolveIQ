const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const ctrl = require('../controllers/auditLog.controller');

const router = express.Router();

router.use(authenticate, authorize('super_admin'));
router.get('/', ctrl.getAuditLogs);
router.get('/actions', ctrl.getAuditActions);

module.exports = router;

