import DailyRecord from '../models/DailyRecord.js';
import { toISODate } from '../utils/dateUtils.js';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// @desc    Get daily records for a date range
// @route   GET /api/days?start=YYYY-MM-DD&end=YYYY-MM-DD
export const getDays = async (req, res, next) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      res.status(400);
      throw new Error('Both start and end query parameters are required');
    }

    if (!ISO_DATE_RE.test(start) || !ISO_DATE_RE.test(end)) {
      res.status(400);
      throw new Error('start and end must be valid dates in YYYY-MM-DD format');
    }

    if (start > end) {
      res.status(400);
      throw new Error('start must be on or before end');
    }

    const records = await DailyRecord.find({
      userId: req.user._id,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    res.json(records);
  } catch (error) {
    next(error);
  }
};

// @desc    Get daily record
// @route   GET /api/days/:date
export const getDay = async (req, res, next) => {
  try {
    const date = toISODate(req.params.date);
    const record = await DailyRecord.findOne({ userId: req.user._id, date });
    
    if (record) {
      res.json(record);
    } else {
      // Lazy creation: return default empty shape
      res.json({
        id: `day-${date}`,
        date,
        activities: {},
        diaryNote: '',
        mood: null
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update activity status for a day
// @route   PUT /api/days/:date/activity/:activityId
export const updateActivityStatus = async (req, res, next) => {
  try {
    const date = toISODate(req.params.date);
    const activityId = req.params.activityId;
    const { status } = req.body;

    // Validate status is one of the allowed enum values if provided
    const validStatuses = ['partial', 'completed', 'incomplete'];
    if (status !== undefined && status !== null && !validStatuses.includes(status)) {
      res.status(400);
      throw new Error('Invalid status. Must be one of: partial, completed, incomplete');
    }

    let record = await DailyRecord.findOne({ userId: req.user._id, date });
    
    if (!record) {
      record = new DailyRecord({ userId: req.user._id, date, activities: {}, diaryNote: '' });
    }

    if (!status) {
      record.activities.delete(activityId);
    } else {
      record.activities.set(activityId, status);
    }

    const updatedRecord = await record.save();
    res.json(updatedRecord);
  } catch (error) {
    next(error);
  }
};

// @desc    Update diary note for a day
// @route   PUT /api/days/:date/diary
export const updateDiary = async (req, res, next) => {
  try {
    const date = toISODate(req.params.date);
    const { diaryNote, mood } = req.body;

    let record = await DailyRecord.findOne({ userId: req.user._id, date });
    
    if (!record) {
      record = new DailyRecord({ 
        userId: req.user._id, 
        date, 
        activities: {}, 
        diaryNote: diaryNote || '',
        mood: mood || null
      });
    } else {
      record.diaryNote = diaryNote || '';
      record.mood = mood || null;
    }

    const updatedRecord = await record.save();
    res.json(updatedRecord);
  } catch (error) {
    next(error);
  }
};
