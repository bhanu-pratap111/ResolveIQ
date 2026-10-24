const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const ctrl = require('../controllers/setting.controller');

const router = express.Router();

router.get('/categories', authenticate, ctrl.getCategories);
router.get('/', authenticate, authorize('super_admin'), ctrl.getSettings);
router.put('/:key', authenticate, authorize('super_admin'), ctrl.updateSetting);

module.exports = router;

