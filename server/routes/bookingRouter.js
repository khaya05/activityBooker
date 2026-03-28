import { Router } from 'express';
import {
  getBookings,
  getBooking,
  createBooking,
  cancelBooking,
  getClassAvailability,
} from '../controllers/bookingController.js';
import {
  validateCreateBooking,
  validateBookingId,
  validateAvailabilityQuery,
} from '../middleware/bookingValidation.js';
import { requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/availability', validateAvailabilityQuery, getClassAvailability);
router.route('/')
  .get(getBookings)
  .post(requireRole('parent'), validateCreateBooking, createBooking);
router.get('/:id', validateBookingId, getBooking);
router.patch('/:id/cancel', validateBookingId, cancelBooking);

export default router;