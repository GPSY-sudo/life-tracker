import express from 'express';
import { getDays, getDay, updateActivityStatus, updateDiary } from '../controllers/dailyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/days?start=YYYY-MM-DD&end=YYYY-MM-DD  — bulk read, registered before /:date
router.get('/', protect, getDays);

router.get('/:date', protect, getDay);
router.put('/:date/activity/:activityId', protect, updateActivityStatus);
router.put('/:date/diary', protect, updateDiary);

export default router;
