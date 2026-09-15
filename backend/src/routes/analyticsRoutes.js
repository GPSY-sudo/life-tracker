import express from 'express';
import { getMonthData, getYearData, getFocusData } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/month/:year/:month', protect, getMonthData);
router.get('/year/:year', protect, getYearData);
router.get('/focus', protect, getFocusData);

export default router;
