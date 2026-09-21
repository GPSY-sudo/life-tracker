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
