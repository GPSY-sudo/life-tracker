import SoundPreference from '../models/SoundPreference.js';

// @desc    Get sound preferences
// @route   GET /api/preferences/sounds
export const getSoundPreferences = async (req, res, next) => {
  try {
    let prefs = await SoundPreference.findOne({ userId: req.user._id });
    
    if (!prefs) {
      prefs = new SoundPreference({ userId: req.user._id });
      await prefs.save();
    }
    
    res.json(prefs);
  } catch (error) {
    next(error);
  }
};

// @desc    Update sound preferences
// @route   PUT /api/preferences/sounds
export const updateSoundPreferences = async (req, res, next) => {
  try {
    let prefs = await SoundPreference.findOne({ userId: req.user._id });
    
    if (!prefs) {
      prefs = new SoundPreference({ userId: req.user._id });
    }

    const { masterVolume, enabledSounds, soundVolumes, selectedPreset } = req.body;

    if (masterVolume !== undefined) prefs.masterVolume = masterVolume;
    if (enabledSounds !== undefined) prefs.enabledSounds = enabledSounds;
    if (selectedPreset !== undefined) prefs.selectedPreset = selectedPreset;
    
    if (soundVolumes !== undefined) {
      // It's a map, so we can clear and set or iterate
      prefs.soundVolumes.clear();
      for (const [key, value] of Object.entries(soundVolumes)) {
        prefs.soundVolumes.set(key, value);
      }
    }

    const updatedPrefs = await prefs.save();
    res.json(updatedPrefs);
  } catch (error) {
    next(error);
  }
};
