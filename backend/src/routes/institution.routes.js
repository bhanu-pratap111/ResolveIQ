const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const ctrl = require('../controllers/institution.controller');

const router = express.Router();

router.get('/', authenticate, ctrl.list);
router.get('/:id', authenticate, ctrl.getOne);
router.get('/:id/360', authenticate, authorize('super_admin', 'officer'), ctrl.get360);
router.post('/', authenticate, authorize('super_admin'), ctrl.create);
router.put('/:id', authenticate, authorize('super_admin'), ctrl.update);

module.exports = router;

