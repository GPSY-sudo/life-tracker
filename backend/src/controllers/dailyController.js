import DailyRecord from '../models/DailyRecord.js';
import { toISODate } from '../utils/dateUtils.js';

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
        diaryNote: ''
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
    const { diaryNote } = req.body;

    let record = await DailyRecord.findOne({ userId: req.user._id, date });
    
    if (!record) {
      record = new DailyRecord({ userId: req.user._id, date, activities: {}, diaryNote: diaryNote || '' });
    } else {
      record.diaryNote = diaryNote || '';
    }

    const updatedRecord = await record.save();
    res.json(updatedRecord);
  } catch (error) {
    next(error);
  }
};
