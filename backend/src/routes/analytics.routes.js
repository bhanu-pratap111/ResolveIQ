const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const ctrl = require('../controllers/analytics.controller');

const router = express.Router();

router.use(authenticate);
router.get('/dashboard', authorize('super_admin'), ctrl.getDashboard);
router.get('/bureau-stats', authorize('super_admin', 'officer'), ctrl.getBureauStats);
router.get('/complaint-trends', authorize('super_admin'), ctrl.getComplaintTrends);
router.get('/category-distribution', authorize('super_admin'), ctrl.getCategoryDistribution);
router.get('/status-distribution', authorize('super_admin'), ctrl.getStatusDistribution);
router.get('/resolution-time', authorize('super_admin'), ctrl.getResolutionTime);
router.get('/officer-dashboard', authorize('super_admin', 'officer'), ctrl.getOfficerDashboard);
router.get('/student-dashboard', authorize('student'), ctrl.getStudentDashboard);

module.exports = router;

