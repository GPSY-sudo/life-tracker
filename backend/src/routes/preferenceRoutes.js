import express from 'express';
import { getSoundPreferences, updateSoundPreferences } from '../controllers/preferenceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/sounds')
  .get(protect, getSoundPreferences)
  .put(protect, updateSoundPreferences);

export default router;
