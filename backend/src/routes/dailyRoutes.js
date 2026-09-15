import express from 'express';
import { getDay, updateActivityStatus, updateDiary } from '../controllers/dailyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:date', protect, getDay);
router.put('/:date/activity/:activityId', protect, updateActivityStatus);
router.put('/:date/diary', protect, updateDiary);

export default router;
