import { Router } from 'express';
import {
  register,
  verifyEmail,
  resendVerificationCode,
  login,
  logout,
  getMe,
  changePassword,
} from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = Router();

// Registration flow
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-code', resendVerificationCode);

// Authentication
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

export default router;
