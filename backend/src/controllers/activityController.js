import Activity from '../models/Activity.js';
import { toISODate } from '../utils/dateUtils.js';

// @desc    Get all activities
// @route   GET /api/activities
export const getActivities = async (req, res, next) => {
  try {
    const activities = await Activity.find({ userId: req.user._id });
    res.json(activities);
  } catch (error) {
    next(error);
  }
};

// @desc    Create an activity
// @route   POST /api/activities
export const createActivity = async (req, res, next) => {
  try {
    const { name, startDate, endDate, scheduledDays, pausePeriods } = req.body;
    
    const activity = new Activity({
      userId: req.user._id,
      name,
      startDate: startDate ? toISODate(startDate) : null,
      endDate: endDate ? toISODate(endDate) : null,
      scheduledDays: scheduledDays && scheduledDays.length > 0 ? scheduledDays : undefined,
      pausePeriods: pausePeriods && pausePeriods.length > 0 ? pausePeriods : undefined
    });

    const createdActivity = await activity.save();
    res.status(201).json(createdActivity);
  } catch (error) {
    next(error);
  }
};

// @desc    Update an activity
// @route   PUT /api/activities/:id
export const updateActivity = async (req, res, next) => {
  try {
    const { name, startDate, endDate, scheduledDays, pausePeriods } = req.body;
    const activity = await Activity.findOne({ _id: req.params.id, userId: req.user._id });

    if (!activity) {
      res.status(404);
      throw new Error('Activity not found');
    }

    if (name !== undefined) activity.name = name;
    if (startDate !== undefined) activity.startDate = startDate ? toISODate(startDate) : null;
    if (endDate !== undefined) activity.endDate = endDate ? toISODate(endDate) : null;
    if (scheduledDays !== undefined) activity.scheduledDays = scheduledDays.length > 0 ? scheduledDays : undefined;
    if (pausePeriods !== undefined) activity.pausePeriods = pausePeriods && pausePeriods.length > 0 ? pausePeriods : undefined;

    const updatedActivity = await activity.save();
    res.json(updatedActivity);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an activity
// @route   DELETE /api/activities/:id
export const deleteActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findOne({ _id: req.params.id, userId: req.user._id });

    if (!activity) {
      res.status(404);
      throw new Error('Activity not found');
    }

    await activity.deleteOne();
    res.json({ message: 'Activity removed' });
  } catch (error) {
    next(error);
  }
};
