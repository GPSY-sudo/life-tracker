import { getMonthlyAnalytics, getYearlyAnalytics, getFocusAnalyticsOnly } from '../services/analyticsService.js';

// @desc    Get monthly analytics
// @route   GET /api/analytics/month/:year/:month
export const getMonthData = async (req, res, next) => {
  try {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);
    const data = await getMonthlyAnalytics(req.user._id, year, month);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// @desc    Get yearly analytics
// @route   GET /api/analytics/year/:year
export const getYearData = async (req, res, next) => {
  try {
    const year = parseInt(req.params.year, 10);
    const data = await getYearlyAnalytics(req.user._id, year);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// @desc    Get focus analytics
// @route   GET /api/analytics/focus
export const getFocusData = async (req, res, next) => {
  try {
    const data = await getFocusAnalyticsOnly(req.user._id);
    res.json(data);
  } catch (error) {
    next(error);
  }
};
