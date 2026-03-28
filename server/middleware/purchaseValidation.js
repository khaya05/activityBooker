import { body, validationResult } from 'express-validator';
import { BadRequestError } from '../errors/customErrors.js';
import { PACKS } from '../models/purchaseModel.js';

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

export const validateCreatePurchase = validate([
  body('pack')
    .notEmpty().withMessage('pack is required')
    .isIn(Object.keys(PACKS))
    .withMessage(`pack must be one of: ${Object.keys(PACKS).join(', ')}`),
]);