import Activity from '../models/Activity.js';
import DailyRecord from '../models/DailyRecord.js';
import Task from '../models/Task.js';
import FocusSession from '../models/FocusSession.js';

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const toISODate = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getMonthDates = (year, month) => {
  const days = getDaysInMonth(year, month);
  return Array.from({ length: days }, (_, i) => toISODate(new Date(year, month, i + 1)));
};

const isDateInRange = (date, startDate, endDate) => {
  if (startDate && date < startDate) return false;
  if (endDate && date > endDate) return false;
  return true;
};

const isDatePaused = (date, activity) => {
  if (!activity.pausePeriods || activity.pausePeriods.length === 0) {
    return false;
  }
  for (const pause of activity.pausePeriods) {
    if (date >= pause.startDate && date <= pause.endDate) {
      return true;
    }
  }
  return false;
};

const isDateApplicable = (date, activity, todayStr) => {
  // Check date range (activity lifetime)
  if (!isDateInRange(date, activity.startDate, activity.endDate)) {
    return false;
  }

  // Check if date is paused
  if (isDatePaused(date, activity)) {
    return false;
  }

  // Check schedule (if schedule exists, verify the weekday)
  if (activity.scheduledDays && activity.scheduledDays.length > 0) {
    const d = new Date(date.split('-').map(Number));
    d.setHours(0, 0, 0, 0);
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayOfWeek = dayNames[d.getDay()];
    if (!activity.scheduledDays.includes(dayOfWeek)) {
      return false;
    }
  }

  // Check if date is in the future
  if (todayStr && date > todayStr) {
    return false;
  }

  return true;
};

const activityWeight = (status) => {
  return status === 'completed' ? 1 : status === 'partial' ? 0.5 : 0;
};

export const getMonthlyAnalytics = async (userId, year, month) => {
  // 1. Fetch data
  const activities = await Activity.find({ userId });
  const tasks = await Task.find({ userId });
  const allRecords = await DailyRecord.find({ userId }).lean();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toISODate(today);
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const isFutureMonth = new Date(year, month, 1) > today;

  const dates = getMonthDates(year, month);
  const recordsMap = new Map(allRecords.map(r => [r.date, r]));

  // --- ACTIVITY ANALYTICS ---
  const activityAnalytics = activities.map(activity => {
    let completedDays = 0, partialDays = 0, incompleteDays = 0, activeDays = 0, totalScore = 0;
    let currentStreak = 0, bestStreak = 0, longestGap = 0, tempStreak = 0, tempGap = 0;

    for (const date of dates) {
      // Use isDateApplicable to respect startDate, endDate, scheduledDays, pausePeriods, and future dates
      if (!isDateApplicable(date, activity, todayStr)) continue;

      const record = recordsMap.get(date);
      let status = record?.activities?.[activity._id.toString()];

      // Apply the new rule: past applicable unrecorded → incomplete (inferred at calculation time)
      if (!status && date < todayStr) {
        status = 'incomplete';
      }

      activeDays++;
      totalScore += activityWeight(status);

      if (status === 'completed') {
        completedDays++; tempStreak++; tempGap = 0;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else if (status === 'partial') {
        partialDays++; tempStreak = 0; tempGap = 0;
      } else if (status === 'incomplete') {
        incompleteDays++; tempStreak = 0; tempGap++;
        if (tempGap > longestGap) longestGap = tempGap;
      } else {
        // No status recorded on current/future applicable date = not yet done
        tempStreak = 0; tempGap++;
        if (tempGap > longestGap) longestGap = tempGap;
      }
    }

    // Compute current streak from all history (not just this month)
    const sortedDates = [...recordsMap.keys()].sort();
    let currentActiveStreak = 0;
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const d = sortedDates[i];
      if (!isDateApplicable(d, activity, todayStr)) continue;
      
      const st = recordsMap.get(d)?.activities?.[activity._id.toString()];
      if (st === 'completed') currentActiveStreak++;
      else break;
    }
    
    currentStreak = currentActiveStreak;

    return {
      activityId: activity._id,
      activityName: activity.name,
      completionRate: activeDays > 0 ? Math.round((totalScore / activeDays) * 100) : 0,
      completedDays, partialDays, incompleteDays, activeDays,
      currentStreak, bestStreak, longestGap,
      startDate: activity.startDate, endDate: activity.endDate
    };
  });

  // --- TASK ANALYTICS ---
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = toISODate(weekEnd);

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const taskAnalytics = {
    total: tasks.length,
    completed: completedTasks,
    pending: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    overdue: tasks.filter(t => t.dueDate && t.dueDate < todayStr && t.status !== 'completed').length,
    dueToday: tasks.filter(t => t.dueDate === todayStr && t.status !== 'completed').length,
    dueThisWeek: tasks.filter(t => t.dueDate && t.dueDate >= todayStr && t.dueDate <= weekEndStr && t.status !== 'completed').length,
    completionRate: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
  };

  // --- FOCUS ANALYTICS ---
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = toISODate(weekAgo);
  const monthStart = toISODate(new Date(year, month, 1));
  const monthEnd = toISODate(new Date(year, month + 1, 0));

  const allFocusSessions = await FocusSession.find({ userId, type: 'focus' }).lean();
  const monthSessions = allFocusSessions.filter(s => s.date >= monthStart && s.date <= monthEnd);
  
  const totalPomodoros = monthSessions.length;
  const totalFocusTime = monthSessions.reduce((sum, s) => sum + s.duration, 0);
  const averageSession = totalPomodoros > 0 ? Math.round(totalFocusTime / totalPomodoros) : 0;
  
  const focusToday = allFocusSessions.filter(s => s.date === todayStr).reduce((sum, s) => sum + s.duration, 0);
  const focusThisWeek = allFocusSessions.filter(s => s.date >= weekAgoStr && s.date <= todayStr).reduce((sum, s) => sum + s.duration, 0);
  const focusThisMonth = totalFocusTime;

  const dailyTotals = {};
  for (const s of monthSessions) {
    dailyTotals[s.date] = (dailyTotals[s.date] || 0) + s.duration;
  }
  let longestFocusDay = null;
  for (const [date, minutes] of Object.entries(dailyTotals)) {
    if (!longestFocusDay || minutes > longestFocusDay.minutes) {
      longestFocusDay = { date, minutes };
    }
  }

  const byActivity = {};
  const byTask = {};
  for (const s of monthSessions) {
    if (s.activityId) byActivity[s.activityId.toString()] = (byActivity[s.activityId.toString()] || 0) + s.duration;
    if (s.taskId) byTask[s.taskId.toString()] = (byTask[s.taskId.toString()] || 0) + s.duration;
  }

  const dailyFocus = dates.map(date => {
    const minutes = monthSessions.filter(s => s.date === date).reduce((sum, s) => sum + s.duration, 0);
    return { date, minutes };
  });

  const focusAnalytics = {
    totalPomodoros, totalFocusTime, averageSession,
    focusToday, focusThisWeek, focusThisMonth,
    longestFocusDay, byActivity, byTask, dailyFocus
  };

  // --- DIARY ANALYTICS ---
  let daysWithEntries = 0;
  let diaryStreak = 0;
  let monthlyCount = 0;

  for (const date of dates) {
    if (isCurrentMonth && date > todayStr) continue;
    const day = recordsMap.get(date);
    if (day && day.diaryNote && day.diaryNote.trim().length > 0) {
      daysWithEntries++;
      monthlyCount++;
    }
  }

  if (isCurrentMonth) {
    for (let i = dates.length - 1; i >= 0; i--) {
      const date = dates[i];
      if (date > todayStr) continue;
      const day = recordsMap.get(date);
      if (day && day.diaryNote && day.diaryNote.trim().length > 0) {
        diaryStreak++;
      } else {
        break;
      }
    }
  }

  const diaryAnalytics = { daysWithEntries, diaryStreak, monthlyCount };

  // --- OVERALL COMPLETION & DAILY COMPLETION ---
  let totalActive = 0, totalScore = 0, fullyCompletedDays = 0, activeDays = 0;
  const dailyCompletion = [];

  for (const date of dates) {
    if (isCurrentMonth && date > todayStr) {
       dailyCompletion.push({ date, rate: 0 });
       continue;
    }
    if (isFutureMonth) {
       dailyCompletion.push({ date, rate: 0 });
       continue;
    }

    let dayActive = 0, dayScore = 0, dayCompleted = 0;
    for (const activity of activities) {
      // Use isDateApplicable to count only applicable activities for this day
      if (!isDateApplicable(date, activity, todayStr)) continue;
      dayActive++;
      const status = recordsMap.get(date)?.activities?.[activity._id.toString()];
      dayScore += activityWeight(status);
      if (status === 'completed') dayCompleted++;
    }

    totalActive += dayActive;
    totalScore += dayScore;

    if (dayActive > 0) {
      activeDays++;
      const rate = Math.round((dayScore / dayActive) * 100);
      dailyCompletion.push({ date, rate });
      if (dayCompleted === dayActive) fullyCompletedDays++;
    } else {
      dailyCompletion.push({ date, rate: 0 });
    }
  }

  const overallCompletion = totalActive > 0 ? Math.round((totalScore / totalActive) * 100) : 0;
  const consistencyScore = activeDays > 0 ? Math.round((fullyCompletedDays / activeDays) * 100) : 0;

  // --- PREVIOUS MONTH COMPLETION ---
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevDates = getMonthDates(prevYear, prevMonth);
  let prevTotalActive = 0, prevTotalScore = 0;

  for (const date of prevDates) {
    for (const activity of activities) {
       // Use isDateApplicable for previous month too (but todayStr will prevent future dates anyway)
       if (!isDateApplicable(date, activity, todayStr)) continue;
       prevTotalActive++;
       const status = recordsMap.get(date)?.activities?.[activity._id.toString()];
       prevTotalScore += activityWeight(status);
    }
  }
  const previousMonthCompletion = prevTotalActive > 0 ? Math.round((prevTotalScore / prevTotalActive) * 100) : 0;
  const improvement = overallCompletion - previousMonthCompletion;

  return {
    month,
    year,
    overallCompletion,
    previousMonthCompletion,
    improvement,
    activeDays,
    fullyCompletedDays,
    consistencyScore,
    activityAnalytics,
    taskAnalytics,
    focusAnalytics,
    diaryAnalytics,
    dailyCompletion
  };
};

export const getYearlyAnalytics = async (userId, year) => {
  const result = [];
  const todayStr = toISODate(new Date());
  
  const activities = await Activity.find({ userId });
  const allRecords = await DailyRecord.find({ userId }).lean();
  const recordsMap = new Map(allRecords.map(r => [r.date, r]));
  const focusSessions = await FocusSession.find({ userId, type: 'focus', date: { $regex: `^${year}-` } });

  for (let m = 0; m < 12; m++) {
    const dates = getMonthDates(year, m);
    let totalActive = 0, totalScore = 0;

    for (const date of dates) {
      for (const activity of activities) {
        // Use isDateApplicable to respect all applicability rules
        if (!isDateApplicable(date, activity, todayStr)) continue;
        totalActive++;
        const status = recordsMap.get(date)?.activities?.[activity._id.toString()];
        totalScore += activityWeight(status);
      }
    }
    
    const completion = totalActive > 0 ? Math.round((totalScore / totalActive) * 100) : 0;
    const focusMinutes = focusSessions
      .filter(s => s.date.startsWith(`${year}-${String(m + 1).padStart(2, '0')}`))
      .reduce((sum, s) => sum + s.duration, 0);
      
    result.push({ month: m, completion, focusMinutes });
  }

  return result;
};

export const getFocusAnalyticsOnly = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toISODate(today);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = toISODate(weekAgo);

  const sessions = await FocusSession.find({ 
    userId, 
    type: 'focus',
    date: { $gte: weekAgoStr, $lte: todayStr }
  }).lean();

  const todaySessions = sessions.filter(s => s.date === todayStr);
  
  return {
    todayPomodoros: todaySessions.length,
    todayFocusMinutes: todaySessions.reduce((sum, s) => sum + s.duration, 0),
    weekPomodoros: sessions.length,
    weekFocusMinutes: sessions.reduce((sum, s) => sum + s.duration, 0)
  };
};
