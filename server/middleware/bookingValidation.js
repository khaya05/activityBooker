import { body, param, query, validationResult } from 'express-validator';
import { BadRequestError } from '../errors/customErrors.js';

const validate = (checks) => [
  ...checks,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors.array().map((e) => e.msg);
      throw new BadRequestError(messages);
    }
    next();
  },
];

export const validateCreateBooking = validate([
  body('childId')
    .notEmpty().withMessage('childId is required')
    .isMongoId().withMessage('Invalid childId'),

  body('classId')
    .notEmpty().withMessage('classId is required')
    .isMongoId().withMessage('Invalid classId'),

  body('classDate')
    .notEmpty().withMessage('classDate is required')
    .isISO8601().withMessage('classDate must be a valid date (YYYY-MM-DD)')
    .custom((value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) throw new Error('classDate is not a valid date');
      return true;
    }),
]);

export const validateBookingId = validate([
  param('id').isMongoId().withMessage('Invalid booking ID'),
]);

export const validateAvailabilityQuery = validate([
  query('classId')
    .notEmpty().withMessage('classId query param is required')
    .isMongoId().withMessage('Invalid classId'),

  query('weekStart')
    .optional()
    .isISO8601().withMessage('weekStart must be a valid date (YYYY-MM-DD)'),
]);