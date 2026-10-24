const { body, query } = require('express-validator');

const createComplaintValidator = [
  body('title')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Title must be between 10 and 500 characters'),
  body('description')
    .trim()
    .isLength({ min: 30 })
    .withMessage('Description must be at least 30 characters'),
  body('institution_id')
    .isInt({ min: 1 })
    .withMessage('Valid institution ID is required'),
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  body('incident_date')
    .optional()
    .isISO8601()
    .withMessage('Incident date must be a valid ISO 8601 date'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Priority must be LOW, MEDIUM, HIGH, or URGENT'),
  body('privacy_acknowledged')
    .equals('true')
    .withMessage('Privacy policy must be acknowledged'),
  body('declaration_acknowledged')
    .equals('true')
    .withMessage('Declaration must be acknowledged'),
];

const statusChangeValidator = [
  body('new_status')
    .isIn(['REGISTERED', 'UNDER_REVIEW', 'UNDER_ACTION', 'AWAITING_RESPONSE', 'RESOLVED', 'CLOSED', 'REJECTED'])
    .withMessage('Invalid status value'),
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 5 })
    .withMessage('Reason must be at least 5 characters if provided'),
];

const sendMessageValidator = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters'),
  body('message_type')
    .optional()
    .isIn(['INFORMATION_REQUEST', 'STUDENT_RESPONSE', 'OFFICIAL_COMMUNICATION', 'GENERAL'])
    .withMessage('Invalid message type'),
  body('is_visible_to_student')
    .optional()
    .isBoolean()
    .withMessage('is_visible_to_student must be boolean'),
];

const addNoteValidator = [
  body('note')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Note must be between 1 and 5000 characters'),
];

const resolveComplaintValidator = [
  body('outcome')
    .isIn([
      'RESOLVED_IN_FAVOR',
      'RESOLVED_PARTIALLY',
      'RESOLVED_NOT_IN_FAVOR',
      'COMPLAINT_WITHDRAWN',
      'NO_FURTHER_ACTION',
    ])
    .withMessage('Invalid outcome value'),
  body('decision')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Decision must be at least 10 characters'),
  body('findings').optional().trim(),
  body('action_taken').optional().trim(),
];

module.exports = {
  createComplaintValidator,
  statusChangeValidator,
  sendMessageValidator,
  addNoteValidator,
  resolveComplaintValidator,
};
