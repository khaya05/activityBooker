import { Router } from 'express';
import { validateLoginUser, validateRegisterUser } from '../middleware/validationMiddleware.js';
import { login, logout, register } from '../controllers/authController.js';

const router = Router();

router.post('/register', validateRegisterUser, register);
router.post('/login', validateLoginUser, login);
router.post('/logout', logout);             

export default router;