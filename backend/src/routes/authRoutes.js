import express from 'express';
import { registerUser, authUser, getUserProfile, changePassword, deleteAccount } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { registerLimiter, loginLimiter, passwordChangeLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.post('/register', registerLimiter, registerUser);
router.post('/login', loginLimiter, authUser);
router.get('/me', protect, getUserProfile);
router.put('/change-password', protect, passwordChangeLimiter, changePassword);
router.delete('/profile', protect, deleteAccount);

export default router;
