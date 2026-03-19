import { body, param, query, validationResult } from 'express-validator';
import { BadRequestError } from '../errors/customErrors.js';
import User from '../models/userModel.js';
import Child from '../models/childModel.js';

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

export const validateRegisterUser = validate([
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email address')
    .custom(async (email) => {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) throw new Error('An account with this email already exists');
    }),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone()
    .withMessage('Invalid phone number'),

  body('role')
    .optional()
    .isIn(['parent', 'admin', 'instructor'])
    .withMessage('Role must be parent, admin, or instructor'),
]);

export const validateLoginUser = validate([
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email address'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
]);

export const validateCreateChild = validate([
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Child\'s first name is required'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Child\'s last name is required'),

  body('dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Date of birth must be a valid date')
    .custom((dob) => {
      const birth = new Date(dob);
      const now = new Date();
      const ageMs = now - birth;
      const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
      if (ageYears < 0) throw new Error('Date of birth cannot be in the future');
      if (ageYears > 15) throw new Error('Child must be 15 years old or younger');
      return true;
    }),

  body('gender')
    .optional()
    .isIn(['girl', 'boy', 'other'])
    .withMessage('Gender must be girl, boy, or other'),

  body('swimmingExperience')
    .notEmpty()
    .withMessage('Swimming experience is required')
    .isIn(['none', 'some', 'intermediate'])
    .withMessage('Swimming experience must be none, some, or intermediate'),

  body('napTimes')
    .optional()
    .isArray({ max: 3 })
    .withMessage('You can add at most 3 nap times'),

  body('napTimes.*.start')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Nap start time must be in HH:MM format'),

  body('napTimes.*.end')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Nap end time must be in HH:MM format')
    .custom((end, { req, path }) => {
      const match = path.match(/\[(\d+)\]/);
      if (match) {
        const start = req.body.napTimes[match[1]]?.start;
        if (start && end <= start) {
          throw new Error('Nap end time must be after start time');
        }
      }
      return true;
    }),

  body('allergies').optional().trim(),
  body('medicalConditions').optional().trim(),
  body('fears').optional().trim(),
  body('additionalInfo').optional().trim(),
]);

export const validateUpdateChild = validate([
  param('id')
    .isMongoId()
    .withMessage('Invalid child ID'),

  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('dateOfBirth').optional().isISO8601().withMessage('Invalid date of birth'),
  body('gender').optional().isIn(['girl', 'boy', 'other']).withMessage('Invalid gender'),
  body('swimmingExperience')
    .optional()
    .isIn(['none', 'some', 'intermediate'])
    .withMessage('Invalid swimming experience'),
  body('napTimes').optional().isArray({ max: 3 }).withMessage('At most 3 nap times'),
  body('napTimes.*.start').optional().matches(/^\d{2}:\d{2}$/).withMessage('Invalid nap start time'),
  body('napTimes.*.end').optional().matches(/^\d{2}:\d{2}$/).withMessage('Invalid nap end time'),
  body('allergies').optional().trim(),
  body('medicalConditions').optional().trim(),
  body('fears').optional().trim(),
  body('additionalInfo').optional().trim(),
]);

// ─── Route params ─────────────────────────────────────────
export const validateMongoId = (paramName = 'id') =>
  validate([
    param(paramName)
      .isMongoId()
      .withMessage(`Invalid ${paramName}`),
  ]);