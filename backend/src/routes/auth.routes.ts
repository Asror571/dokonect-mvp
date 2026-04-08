import express from 'express';
import { register, login, getMe, refreshToken, validateToken } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.get('/me', authenticate, getMe);
router.get('/validate', authenticate, validateToken);

export default router;
