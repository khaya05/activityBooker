import { body, param, validationResult } from 'express-validator';
import { BadRequestError, NotFoundError, Unauthorized } from '../errors/customErrors.js';
import User from '../models/userModel.js';
import Child from '../models/childModel.js';
import Class from '../models/classModel.js';

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
  body('name').trim().notEmpty().withMessage('Name is required'),

  body('lastName').trim().notEmpty().withMessage('Last name is required'),

  body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .custom(async (email) => {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) throw new Error('An account with this email already exists');
    }),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),

  body('phoneNumber')
    .trim().notEmpty().withMessage('Phone number is required')
    .isMobilePhone().withMessage('Invalid phone number'),

  body('role')
    .optional()
    .isIn(['parent', 'admin', 'instructor'])
    .withMessage('Role must be parent, admin, or instructor'),
]);

export const validateLoginUser = validate([
  body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address'),

  body('password').notEmpty().withMessage('Password is required'),
]);

export const validateCreateChild = validate([
  body('name').trim().notEmpty().withMessage("Child's first name is required"),

  body('lastName').trim().notEmpty().withMessage("Child's last name is required"),

  body('dateOfBirth')
    .notEmpty().withMessage('Date of birth is required')
    .isISO8601().withMessage('Date of birth must be a valid date')
    .custom((dob) => {
      const ageYears = (Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25);
      if (ageYears < 0) throw new Error('Date of birth cannot be in the future');
      if (ageYears > 15) throw new Error('Child must be 15 years old or younger');
      return true;
    }),

  body('gender')
    .optional()
    .isIn(['girl', 'boy', 'other'])
    .withMessage('Gender must be girl, boy, or other'),

  body('swimmingExperience')
    .notEmpty().withMessage('Swimming experience is required')
    .isIn(['none', 'some', 'intermediate'])
    .withMessage('Swimming experience must be none, some, or intermediate'),

  body('napTimes')
    .optional()
    .isArray({ max: 3 }).withMessage('You can add at most 3 nap times'),

  body('napTimes.*.start')
    .matches(/^\d{2}:\d{2}$/).withMessage('Nap start time must be in HH:MM format'),

  body('napTimes.*.end')
    .matches(/^\d{2}:\d{2}$/).withMessage('Nap end time must be in HH:MM format')
    .custom((end, { req, path }) => {
      const match = path.match(/\[(\d+)\]/);
      if (match) {
        const start = req.body.napTimes[match[1]]?.start;
        if (start && end <= start) throw new Error('Nap end time must be after start time');
      }
      return true;
    }),

  body('allergies').optional().trim(),
  body('medicalConditions').optional().trim(),
  body('fears').optional().trim(),
  body('additionalInfo').optional().trim(),
]);

export const validateUpdateChild = validate([
  param('id').isMongoId().withMessage('Invalid child ID'),

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

export const validateMongoId = (paramName = 'id') =>
  validate([
    param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
  ]);

export const validateChildOwnership = async (req, res, next) => {
  try {
    const child = await Child.findById(req.params.id);
    if (!child) return next(new NotFoundError('Child not found'));
    if (!child.parent.equals(req.user.userId)) {
      return next(new Unauthorized('You do not have permission to access this child'));
    }
    req.child = child;
    next();
  } catch {
    next(new NotFoundError('Child not found'));
  }
};

export const validateClass = validate([
  body('name').trim().notEmpty().withMessage('Class name is required'),

  body('ageGroup').trim().notEmpty().withMessage('Age group is required'),

  body('dayOfWeek')
    .notEmpty().withMessage('Day of week is required')
    .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Invalid day of week'),

  body('startTime')
    .notEmpty().withMessage('Start time is required')
    .matches(/^\d{2}:\d{2}$/).withMessage('Start time must be in HH:MM format'),

  body('duration')
    .optional()
    .isInt({ min: 1 }).withMessage('Duration must be a positive number'),

  body('instructor')
    .notEmpty().withMessage('Instructor is required')
    .isMongoId().withMessage('Invalid instructor ID'),

  body('capacity')
    .optional()
    .isInt({ min: 1, max: 20 }).withMessage('Capacity must be between 1 and 20'),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

  body('icon').optional().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
]);

export const validateUpdateClass = validate([
  param('id').isMongoId().withMessage('Invalid class ID'),

  body('name').optional().trim().notEmpty().withMessage('Class name cannot be empty'),
  body('ageGroup').optional().trim().notEmpty().withMessage('Age group cannot be empty'),
  body('dayOfWeek')
    .optional()
    .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Invalid day of week'),
  body('startTime')
    .optional()
    .matches(/^\d{2}:\d{2}$/).withMessage('Start time must be in HH:MM format'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive number'),
  body('instructor').optional().isMongoId().withMessage('Invalid instructor ID'),
  body('capacity').optional().isInt({ min: 1, max: 20 }).withMessage('Capacity must be between 1 and 20'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('icon').optional().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
]);

export const validateClassExists = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return next(new NotFoundError('Class not found'));
    req.cls = cls;
    next();
  } catch {
    next(new NotFoundError('Class not found'));
  }
};