const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const ctrl = require('../controllers/bureau.controller');

const router = express.Router();

router.get('/', authenticate, ctrl.listBureaus);
router.get('/cells', authenticate, ctrl.listCells);
router.post('/cells', authenticate, authorize('super_admin'), ctrl.createCell);
router.get('/:id', authenticate, ctrl.getBureau);
router.post('/', authenticate, authorize('super_admin'), ctrl.createBureau);
router.put('/:id', authenticate, authorize('super_admin'), ctrl.updateBureau);

module.exports = router;

