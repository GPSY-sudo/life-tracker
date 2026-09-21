import express from 'express';
import { 
  getSoundPreferences, 
  updateSoundPreferences,
  createCustomPreset,
  deleteCustomPreset,
  updateCustomPreset
} from '../controllers/preferenceController.js';
import {
  getAppPreferences,
  updateAppPreferences
} from '../controllers/appPreferenceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Sound preferences
router.route('/sounds')
  .get(protect, getSoundPreferences)
  .put(protect, updateSoundPreferences);

router.route('/sounds/presets')
  .post(protect, createCustomPreset);

router.route('/sounds/presets/:presetId')
  .delete(protect, deleteCustomPreset)
  .put(protect, updateCustomPreset);

// App preferences (theme and Pomodoro settings)
router.route('/app')
  .get(protect, getAppPreferences)
  .put(protect, updateAppPreferences);

export default router;
