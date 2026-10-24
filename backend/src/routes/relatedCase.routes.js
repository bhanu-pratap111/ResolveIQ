const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const ctrl = require('../controllers/relatedCase.controller');

const router = express.Router();

router.use(authenticate);
router.post('/', authorize('super_admin', 'officer'), ctrl.confirmRelated);
router.get('/:id', ctrl.getRelated);

module.exports = router;

