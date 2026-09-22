import FocusSession from '../models/FocusSession.js';
import { toISODate } from '../utils/dateUtils.js';

// @desc    Get focus sessions
// @route   GET /api/focus/sessions
export const getSessions = async (req, res, next) => {
  try {
    const sessions = await FocusSession.find({ userId: req.user._id });
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

// @desc    Create focus session
// @route   POST /api/focus/sessions
export const createSession = async (req, res, next) => {
  try {
    const { startTime, endTime, duration, type, activityId, taskId, date } = req.body;

    // Validate type is valid enum value
    const validTypes = ['focus', 'shortBreak', 'longBreak'];
    if (!type || !validTypes.includes(type)) {
      res.status(400);
      throw new Error('Invalid type. Must be one of: focus, shortBreak, longBreak');
    }

    // Validate duration is required and a positive number within reasonable bounds
    if (duration === undefined || duration === null) {
      res.status(400);
      throw new Error('Duration is required');
    }
    if (typeof duration !== 'number' || duration <= 0 || !Number.isFinite(duration)) {
      res.status(400);
      throw new Error('Duration must be a positive number');
    }
    if (duration > 1440) { // Max 24 hours (1440 minutes)
      res.status(400);
      throw new Error('Duration cannot exceed 1440 minutes (24 hours)');
    }

    // Validate date format and actual date validity if provided
    if (date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        res.status(400);
        throw new Error('Date must be in YYYY-MM-DD format');
      }
      // Parse and validate the actual date
      const [yearStr, monthStr, dayStr] = date.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const day = parseInt(dayStr, 10);
      
      // Check valid ranges
      if (month < 1 || month > 12) {
        res.status(400);
        throw new Error('Month must be between 1 and 12');
      }
      
      // Create a date and verify it doesn't shift (catches invalid dates like Feb 30)
      const dateObj = new Date(year, month - 1, day);
      if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
        res.status(400);
        throw new Error('Invalid date');
      }
    }

    // Validate startTime and endTime if provided
    if (startTime) {
      try {
        const startDate = new Date(startTime);
        if (isNaN(startDate.getTime())) {
          res.status(400);
          throw new Error('Invalid startTime format');
        }
      } catch (err) {
        res.status(400);
        throw new Error('Invalid startTime format');
      }
    }

    if (endTime) {
      try {
        const endDate = new Date(endTime);
        if (isNaN(endDate.getTime())) {
          res.status(400);
          throw new Error('Invalid endTime format');
        }
      } catch (err) {
        res.status(400);
        throw new Error('Invalid endTime format');
      }
    }

    // Validate that startTime < endTime if both provided
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (start >= end) {
        res.status(400);
        throw new Error('startTime must be before endTime');
      }
    }
    
    // Determine date: use provided local date, or extract from endTime (now in local timezone)
    let sessionDate;
    if (date) {
      // Frontend provided the local date explicitly
      sessionDate = date;
    } else {
      // Fallback to computing from timestamps (will still be UTC — use provided date when possible)
      const refDate = endTime ? new Date(endTime) : (startTime ? new Date(startTime) : new Date());
      sessionDate = toISODate(refDate);
    }

    // Set wasLinked to false only if neither activityId nor taskId is provided
    const wasLinked = !!(activityId || taskId);

    const session = new FocusSession({
      userId: req.user._id,
      date: sessionDate,
      startTime: startTime || new Date(new Date(endTime || new Date()).getTime() - duration * 60 * 1000),
      endTime: endTime || new Date(),
      duration,
      type,
      activityId,
      taskId,
      wasLinked
    });

    const createdSession = await session.save();
    res.status(201).json(createdSession);
  } catch (error) {
    next(error);
  }
};
