import { Router } from 'express';

import {
  validateCreateChild,
  validateUpdateChild,
  validateMongoId,
  validateChildOwnership,
} from '../middleware/validationMiddleware.js';
import { createChild, deleteChild, getChild, getChildren, updateChild } from '../controllers/ChildController.js';

const router = Router();

router.route('/')
  .get(getChildren)
  .post(validateCreateChild, createChild);

router.route('/:id')
  .get(validateMongoId('id'), validateChildOwnership, getChild)
  .patch(validateUpdateChild, validateChildOwnership, updateChild)
  .delete(validateMongoId('id'), validateChildOwnership, deleteChild);

export default router;