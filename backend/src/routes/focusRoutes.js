import express from 'express';
import { getSessions, createSession } from '../controllers/focusController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/sessions')
  .get(protect, getSessions)
  .post(protect, createSession);

export default router;
