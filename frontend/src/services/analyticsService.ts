import { apiFetch } from './api';
import { store } from './store';
import type {
  ActivityAnalytics,
  TaskAnalytics,
  FocusAnalytics,
  DiaryAnalytics,
  MonthlyAnalytics,
  ActivityStatus,
} from '@/types';

const delay = (ms = 50) => new Promise((r) => setTimeout(r, ms));

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isDateInRange(date: string, startDate?: string, endDate?: string): boolean {
  if (startDate && date < startDate) return false;
  if (endDate && date > endDate) return false;
  return true;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthDates(year: number, month: number): string[] {
  const days = getDaysInMonth(year, month);
  const dates: string[] = [];
  for (let d = 1; d <= days; d++) {
    dates.push(toISODate(new Date(year, month, d)));
  }
  return dates;
}

function getActivityStatusForDate(date: string, activityId: string, activity: { startDate?: string; endDate?: string }): ActivityStatus | undefined {
  // Check if date is in activity range
  if (!isDateInRange(date, activity.startDate, activity.endDate)) {
    return undefined; // inactive
  }
  const day = store.dailyRecords[date];
  if (!day) return undefined;
  return day.activities[activityId];
}

function activityWeight(status: ActivityStatus | undefined): number {
  return status === 'completed' ? 1 : status === 'partial' ? 0.5 : 0;
}

function calculateActivityAnalytics(activityId: string, year: number, month: number): ActivityAnalytics {
  const activity = store.activities.find((a) => a.id === activityId);
  if (!activity) {
    return {
      activityId,
      activityName: 'Unknown',
      completionRate: 0,
      completedDays: 0,
      partialDays: 0,
      incompleteDays: 0,
      activeDays: 0,
      currentStreak: 0,
      bestStreak: 0,
      longestGap: 0,
    };
  }

  const dates = getMonthDates(year, month);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toISODate(today);
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const isFutureMonth = new Date(year, month, 1) > today;

  let completedDays = 0;
  let partialDays = 0;
  let incompleteDays = 0;
  let activeDays = 0;
  let totalScore = 0;
  let currentStreak = 0;
  let bestStreak = 0;
  let longestGap = 0;
  let tempStreak = 0;
  let tempGap = 0;

  for (const date of dates) {
    // Skip future dates for current month
    if (isCurrentMonth && date > todayStr) continue;
    if (isFutureMonth) continue;

    const status = getActivityStatusForDate(date, activityId, activity);
    if (!isDateInRange(date, activity.startDate, activity.endDate)) continue;
    activeDays++;
    totalScore += activityWeight(status);
    if (status === 'completed') {
      completedDays++;
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
      tempGap = 0;
    } else if (status === 'partial') {
      partialDays++;
      tempStreak = 0;
      tempGap = 0;
    } else if (status === 'incomplete') {
      incompleteDays++;
      tempStreak = 0;
      tempGap++;
      if (tempGap > longestGap) longestGap = tempGap;
    } else {
      // Only count as gap if the date is in the past and within activity range
      if (date <= todayStr && isDateInRange(date, activity.startDate, activity.endDate)) {
        tempStreak = 0;
        tempGap++;
        if (tempGap > longestGap) longestGap = tempGap;
      }
    }
  }

  // Current streak: count backwards from today
  if (isCurrentMonth) {
    currentStreak = 0;
    for (let i = dates.length - 1; i >= 0; i--) {
      const date = dates[i];
      if (date > todayStr) continue;
      const status = getActivityStatusForDate(date, activityId, activity);
      if (status === 'completed') currentStreak++;
      else break;
    }
  } else {
    currentStreak = tempStreak;
  }

  const completionRate = activeDays > 0 ? Math.round((totalScore / activeDays) * 100) : 0;

  return {
    activityId,
    activityName: activity.name,
    completionRate,
    completedDays,
    partialDays,
    incompleteDays,
    activeDays,
    currentStreak,
    bestStreak,
    longestGap,
    startDate: activity.startDate,
    endDate: activity.endDate,
  };
}

function calculateTaskAnalytics(year: number, month: number): TaskAnalytics {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toISODate(today);

  const tasks = store.tasks;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const blocked = tasks.filter((t) => t.status === 'blocked').length;
  const pending = tasks.filter((t) => t.status === 'todo').length;

  const overdue = tasks.filter(
    (t) => t.dueDate && t.dueDate < todayStr && t.status !== 'completed'
  ).length;

  const dueToday = tasks.filter(
    (t) => t.dueDate === todayStr && t.status !== 'completed'
  ).length;

  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = toISODate(weekEnd);
  const dueThisWeek = tasks.filter(
    (t) =>
      t.dueDate &&
      t.dueDate >= todayStr &&
      t.dueDate <= weekEndStr &&
      t.status !== 'completed'
  ).length;

  const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  return {
    total: tasks.length,
    completed,
    pending,
    inProgress,
    blocked,
    overdue,
    dueToday,
    dueThisWeek,
    completionRate,
  };
}

function calculateFocusAnalytics(year: number, month: number): FocusAnalytics {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toISODate(today);
  const monthStart = toISODate(new Date(year, month, 1));
  const monthEnd = toISODate(new Date(year, month + 1, 0));

  const allFocusSessions = store.focusSessions.filter((s) => s.type === 'focus');
  const monthSessions = allFocusSessions.filter((s) => s.date >= monthStart && s.date <= monthEnd);
  const totalPomodoros = monthSessions.length;
  const totalFocusTime = monthSessions.reduce((sum, s) => sum + s.duration, 0);
  const averageSession = totalPomodoros > 0 ? Math.round(totalFocusTime / totalPomodoros) : 0;

  const todaySessions = allFocusSessions.filter((s) => s.date === todayStr);
  const focusToday = todaySessions.reduce((sum, s) => sum + s.duration, 0);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = toISODate(weekAgo);
  const weekSessions = allFocusSessions.filter((s) => s.date >= weekAgoStr && s.date <= todayStr);
  const focusThisWeek = weekSessions.reduce((sum, s) => sum + s.duration, 0);

  const focusThisMonth = totalFocusTime;

  // Longest focus day in the selected month
  const dailyTotals: Record<string, number> = {};
  for (const s of monthSessions) {
    dailyTotals[s.date] = (dailyTotals[s.date] ?? 0) + s.duration;
  }
  let longestFocusDay: { date: string; minutes: number } | null = null;
  for (const [date, minutes] of Object.entries(dailyTotals)) {
    if (!longestFocusDay || minutes > longestFocusDay.minutes) {
      longestFocusDay = { date, minutes };
    }
  }

  // By activity
  const byActivity: Record<string, number> = {};
  for (const s of monthSessions) {
    if (s.activityId) {
      byActivity[s.activityId] = (byActivity[s.activityId] ?? 0) + s.duration;
    }
  }

  // By task
  const byTask: Record<string, number> = {};
  for (const s of monthSessions) {
    if (s.taskId) {
      byTask[s.taskId] = (byTask[s.taskId] ?? 0) + s.duration;
    }
  }

  // Daily focus for the month
  const dailyFocus: { date: string; minutes: number }[] = [];
  const dates = getMonthDates(year, month);
  for (const date of dates) {
    const minutes = monthSessions
      .filter((s) => s.date === date)
      .reduce((sum, s) => sum + s.duration, 0);
    dailyFocus.push({ date, minutes });
  }

  return {
    totalPomodoros,
    totalFocusTime,
    averageSession,
    focusToday,
    focusThisWeek,
    focusThisMonth,
    longestFocusDay,
    byActivity,
    byTask,
    dailyFocus,
  };
}

function calculateDiaryAnalytics(year: number, month: number): DiaryAnalytics {
  const dates = getMonthDates(year, month);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toISODate(today);
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  let daysWithEntries = 0;
  let diaryStreak = 0;
  let monthlyCount = 0;

  for (const date of dates) {
    if (isCurrentMonth && date > todayStr) continue;
    const day = store.dailyRecords[date];
    if (day && day.diaryNote.trim().length > 0) {
      daysWithEntries++;
      monthlyCount++;
    }
  }

  // Diary streak: count backwards from today
  if (isCurrentMonth) {
    for (let i = dates.length - 1; i >= 0; i--) {
      const date = dates[i];
      if (date > todayStr) continue;
      const day = store.dailyRecords[date];
      if (day && day.diaryNote.trim().length > 0) {
        diaryStreak++;
      } else {
        break;
      }
    }
  }

  return { daysWithEntries, diaryStreak, monthlyCount };
}

export const analyticsService = {
  async getMonthlyAnalytics(year: number, month: number): Promise<MonthlyAnalytics> {
    return apiFetch<MonthlyAnalytics>(`/analytics/month/${year}/${month}`);
  },

  async getYearlyAnalytics(year: number): Promise<{ month: number; completion: number; focusMinutes: number }[]> {
    return apiFetch<{ month: number; completion: number; focusMinutes: number }[]>(`/analytics/year/${year}`);
  },

  async getActivityAnalytics(year: number, month: number): Promise<ActivityAnalytics[]> {
    await delay();
    return store.activities.map((a) => calculateActivityAnalytics(a.id, year, month));
  },

  async getTaskAnalytics(): Promise<TaskAnalytics> {
    await delay();
    const today = new Date();
    return calculateTaskAnalytics(today.getFullYear(), today.getMonth());
  },

  async getFocusAnalytics(year: number, month: number): Promise<FocusAnalytics> {
    await delay();
    return calculateFocusAnalytics(year, month);
  },

  async getDiaryAnalytics(year: number, month: number): Promise<DiaryAnalytics> {
    await delay();
    return calculateDiaryAnalytics(year, month);
  },
};
