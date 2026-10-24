const { body } = require('express-validator');

const updateUserValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Invalid phone number'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be boolean'),
];

const createOfficerValidator = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase, lowercase, and digit'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('bureau_id').optional().isInt({ min: 1 }).withMessage('Bureau ID must be a positive integer'),
  body('cell_id').optional().isInt({ min: 1 }).withMessage('Cell ID must be a positive integer'),
];

module.exports = { updateUserValidator, createOfficerValidator };
