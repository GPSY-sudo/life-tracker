import express from 'express';
import { getActivities, createActivity, updateActivity, deleteActivity } from '../controllers/activityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getActivities)
  .post(protect, createActivity);

router.route('/:id')
  .put(protect, updateActivity)
  .delete(protect, deleteActivity);

export default router;
