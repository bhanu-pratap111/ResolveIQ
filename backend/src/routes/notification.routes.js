const express = require('express');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/notification.controller');

const router = express.Router();

router.use(authenticate);
router.get('/', ctrl.getNotifications);
router.get('/unread-count', ctrl.getUnreadCount);
router.put('/read-all', ctrl.markAllRead);
router.put('/:id/read', ctrl.markRead);

module.exports = router;

