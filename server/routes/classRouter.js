import { Router } from 'express';
import {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
} from '../controllers/classController.js';
import {
  validateClass,
  validateUpdateClass,
  validateMongoId,
  validateClassExists,
} from '../middleware/validationMiddleware.js';
import { authenticateUser, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', getClasses);
router.get('/:id', validateMongoId('id'), validateClassExists, getClass);

router.post('/', authenticateUser, requireRole('admin'), validateClass, createClass);
router.patch('/:id', authenticateUser, requireRole('admin'), validateUpdateClass, validateClassExists, updateClass);
router.delete('/:id', authenticateUser, requireRole('admin'), validateMongoId('id'), validateClassExists, deleteClass);

export default router;