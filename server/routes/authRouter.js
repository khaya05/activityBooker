import { Router } from 'express';
import {
  register,
  verifyEmail,
  resendVerificationCode,
  login,
  googleAuth,
  logout,
} from '../controllers/authController.js';
import { validateLoginUser, validateRegisterUser } from '../middleware/validationMiddleware.js';

const router = Router();

router.post('/register', validateRegisterUser, register);
router.post('/login', validateLoginUser, login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationCode);
router.post('/google', googleAuth);
router.get('/logout', logout);

export default router;