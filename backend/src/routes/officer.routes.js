const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const ctrl = require('../controllers/officer.controller');

const router = express.Router();

router.use(authenticate);
router.get('/', authorize('super_admin'), ctrl.getAllUsers);
router.post('/', authorize('super_admin'), ctrl.createOfficer);
router.put('/:id', authorize('super_admin'), ctrl.updateUser);
router.post('/:id/reset-password', authorize('super_admin'), ctrl.resetUserPassword);

module.exports = router;

