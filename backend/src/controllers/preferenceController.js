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

// @desc    Add/create a custom preset
// @route   POST /api/preferences/sounds/presets
export const createCustomPreset = async (req, res, next) => {
  try {
    const { name, sounds } = req.body;
    
    if (!name || !sounds) {
      return res.status(400).json({ error: 'Name and sounds are required' });
    }

    let prefs = await SoundPreference.findOne({ userId: req.user._id });
    
    if (!prefs) {
      prefs = new SoundPreference({ userId: req.user._id });
    }

    // Generate a unique preset ID
    const presetId = `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    
    // Create the preset object with Map for sounds
    const soundsMap = new Map();
    for (const [key, value] of Object.entries(sounds)) {
      soundsMap.set(key, value);
    }

    prefs.customPresets.push({
      id: presetId,
      name,
      sounds: soundsMap
    });

    const updatedPrefs = await prefs.save();
    res.json(updatedPrefs);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a custom preset
// @route   DELETE /api/preferences/sounds/presets/:presetId
export const deleteCustomPreset = async (req, res, next) => {
  try {
    const { presetId } = req.params;

    let prefs = await SoundPreference.findOne({ userId: req.user._id });
    
    if (!prefs) {
      return res.status(404).json({ error: 'Sound preferences not found' });
    }

    // Find and remove the preset
    const originalLength = prefs.customPresets.length;
    prefs.customPresets = prefs.customPresets.filter((p) => p.id !== presetId);

    if (prefs.customPresets.length === originalLength) {
      return res.status(404).json({ error: 'Preset not found' });
    }

    // If the deleted preset was selected, reset to default
    if (prefs.selectedPreset === presetId) {
      prefs.selectedPreset = 'preset-rainy-focus';
    }

    const updatedPrefs = await prefs.save();
    res.json(updatedPrefs);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a custom preset
// @route   PUT /api/preferences/sounds/presets/:presetId
export const updateCustomPreset = async (req, res, next) => {
  try {
    const { presetId } = req.params;
    const { name, sounds } = req.body;

    let prefs = await SoundPreference.findOne({ userId: req.user._id });
    
    if (!prefs) {
      return res.status(404).json({ error: 'Sound preferences not found' });
    }

    // Find the preset
    const preset = prefs.customPresets.find((p) => p.id === presetId);
    if (!preset) {
      return res.status(404).json({ error: 'Preset not found' });
    }

    // Update preset
    if (name !== undefined) preset.name = name;
    if (sounds !== undefined) {
      preset.sounds.clear();
      for (const [key, value] of Object.entries(sounds)) {
        preset.sounds.set(key, value);
      }
    }

    const updatedPrefs = await prefs.save();
    res.json(updatedPrefs);
  } catch (error) {
    next(error);
  }
};
