import { Router } from 'express';
import { validateLoginUser, validateRegisterUser } from '../middleware/validationMiddleware';
import { login, logout, register } from '../controllers/authController';

const router = Router();

router.post('/login', validateLoginUser, login)
router.post('/register', validateRegisterUser, register)
router.get('/logout', logout)

export default router