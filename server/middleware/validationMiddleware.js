import { body, param, query, validationResult } from 'express-validator';
import { BadRequestError } from '../errors/customErrors';
import User from '../models/userModel.js'

const handleValidationErrors = (validateValues) => {
  return [
    validateValues,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => error.msg);
        throw new BadRequestError(errorMessages)
      }
      next();
    }
  ]
}

export const validateRegisterUser = handleValidationErrors([
  body('name')
    .notEmpty()
    .withMessage('name is required'),

  body('lastName')
    .notEmpty()
    .withMessage('last name is required'),

  body('email')
    .notEmpty()
    .withMessage('email is required')
    .isEmail()
    .withMessage('invalid email')
    .custom(async (email) => {
      const user = await UserActivation.findOne({ email })

      if (user) {
        throw new BadRequestError('email already exist')
      }
    }),

  body('password')
    .notEmpty()
    .withMessage('password is required!')
    .isLength({ min: 8 })
    .withMessage('password must be at least 8 characters'),

  body('role')
    .optional()
    .isIn(['parent', 'admin', 'instructor'])
    .withMessage('invalid role'),

  body('phoneNumber')
    .notEmpty()
    .withMessage('password is required!')
    .isMobilePhone()
    .withMessage('invalid phone number')

])