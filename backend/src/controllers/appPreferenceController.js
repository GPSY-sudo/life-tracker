import AppPreference from '../models/AppPreference.js';

// @desc    Get app preferences (theme and Pomodoro settings)
// @route   GET /api/preferences/app
export const getAppPreferences = async (req, res, next) => {
  try {
    let prefs = await AppPreference.findOne({ userId: req.user._id });

    if (!prefs) {
      prefs = new AppPreference({ userId: req.user._id });
      await prefs.save();
    }

    res.json(prefs);
  } catch (error) {
    next(error);
  }
};

// @desc    Update app preferences (theme and Pomodoro settings)
// @route   PUT /api/preferences/app
export const updateAppPreferences = async (req, res, next) => {
  try {
    const { theme, pomodoro } = req.body;

    let prefs = await AppPreference.findOne({ userId: req.user._id });

    if (!prefs) {
      prefs = new AppPreference({ userId: req.user._id });
    }

    if (theme !== undefined) {
      if (!['light', 'dark', 'system'].includes(theme)) {
        return res.status(400).json({ error: 'Invalid theme value' });
      }
      prefs.theme = theme;
    }

    if (pomodoro !== undefined) {
      const { focusDuration, shortBreakDuration, longBreakDuration, sessionsBeforeLongBreak } = pomodoro;

      if (focusDuration !== undefined) {
        if (focusDuration < 1 || focusDuration > 90) {
          return res.status(400).json({ error: 'Focus duration must be between 1 and 90 minutes' });
        }
        prefs.pomodoro.focusDuration = focusDuration;
      }

      if (shortBreakDuration !== undefined) {
        if (shortBreakDuration < 1 || shortBreakDuration > 30) {
          return res.status(400).json({ error: 'Short break duration must be between 1 and 30 minutes' });
        }
        prefs.pomodoro.shortBreakDuration = shortBreakDuration;
      }

      if (longBreakDuration !== undefined) {
        if (longBreakDuration < 1 || longBreakDuration > 60) {
          return res.status(400).json({ error: 'Long break duration must be between 1 and 60 minutes' });
        }
        prefs.pomodoro.longBreakDuration = longBreakDuration;
      }

      if (sessionsBeforeLongBreak !== undefined) {
        if (sessionsBeforeLongBreak < 1 || sessionsBeforeLongBreak > 10) {
          return res.status(400).json({ error: 'Sessions before long break must be between 1 and 10' });
        }
        prefs.pomodoro.sessionsBeforeLongBreak = sessionsBeforeLongBreak;
      }
    }

    const updatedPrefs = await prefs.save();
    res.json(updatedPrefs);
  } catch (error) {
    next(error);
  }
};
