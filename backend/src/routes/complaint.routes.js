const express = require('express');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/complaint.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/reference/:refNum', ctrl.getByReference);
router.get('/:id', ctrl.getOne);
router.post('/:id/status', ctrl.changeStatus);
router.get('/:id/timeline', ctrl.getTimeline);
router.get('/:id/messages', ctrl.getMessages);
router.post('/:id/messages', ctrl.sendMessage);
router.get('/:id/notes', ctrl.getNotes);
router.post('/:id/notes', ctrl.addNote);
router.post('/:id/evidence', ctrl.uploadEvidence);
router.get('/:id/evidence', ctrl.listEvidence);
router.get('/:id/evidence/:evidenceId/download', ctrl.downloadEvidence);
router.get('/:id/related', ctrl.getRelated);
router.post('/:id/resolve', ctrl.resolve);
router.get('/:id/resolution', ctrl.getResolution);
router.put('/:id/ai-suggestion', ctrl.updateAiSuggestion);

module.exports = router;

