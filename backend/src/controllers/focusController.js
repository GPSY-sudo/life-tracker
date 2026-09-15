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
    const { startTime, endTime, duration, type, activityId, taskId } = req.body;
    
    // Determine date from endTime (or startTime if not provided)
    const refDate = endTime ? new Date(endTime) : (startTime ? new Date(startTime) : new Date());
    const date = toISODate(refDate);

    const session = new FocusSession({
      userId: req.user._id,
      date,
      startTime: startTime || new Date(refDate.getTime() - duration * 60 * 1000),
      endTime: endTime || refDate,
      duration,
      type,
      activityId,
      taskId
    });

    const createdSession = await session.save();
    res.status(201).json(createdSession);
  } catch (error) {
    next(error);
  }
};
