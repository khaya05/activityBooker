import { Router } from 'express';
import { getPacks, getPurchases, createPurchase } from '../controllers/purchaseController.js';
import { validateCreatePurchase } from '../middleware/purchaseValidation.js';
import { requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.route('/')
  .get(getPurchases)
  .post(requireRole('parent'), validateCreatePurchase, createPurchase);

export default router;