import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Minus,
  CircleDashed,
} from 'lucide-react';
import { useActivities, useAllDailyRecords } from '@/hooks/useAppData';
import { useToast } from '@/hooks/useToast';
import { dailyService } from '@/services/dailyService';
import { activityService } from '@/services/activityService';
import { ActivityForm } from '@/components/ActivityForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  todayISO,
  formatMonthYear,
  getDaysInMonth,
  getDayName,
  toISODate,
  parseISODate,
} from '@/utils/date';
import type { ActivityStatus, Activity } from '@/types';

export function ActivityTrackerPage() {
  const toast = useToast();
  const activities = useActivities();
  const dailyRecords = useAllDailyRecords();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const [formOpen, setFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const todayStr = todayISO();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const isFutureMonth = new Date(year, month, 1) > now;

  const daysInMonth = getDaysInMonth(year, month);
  const monthDates = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => toISODate(new Date(year, month, i + 1))),
    [year, month, daysInMonth]
  );

  const getActivityStatus = (date: string, activity: Activity): ActivityStatus | undefined => {
    if (activity.startDate && date < activity.startDate) return undefined;
    if (activity.endDate && date > activity.endDate) return undefined;
    const record = dailyRecords[date];
    return record?.activities[activity.id];
  };

  const handleCellClick = async (date: string, activity: Activity) => {
    // Don't allow editing future dates
    if (date > todayStr) return;
    // Don't allow editing inactive dates
    if (activity.startDate && date < activity.startDate) return;
    if (activity.endDate && date > activity.endDate) return;

    const current = getActivityStatus(date, activity);
    const next: ActivityStatus | undefined =
      !current ? 'partial' : current === 'partial' ? 'completed' : current === 'completed' ? 'incomplete' : undefined;
    await dailyService.updateActivityStatus(date, activity.id, next);
  };

  // Calculate per-activity stats for the month
  const activityStats = useMemo(() => {
    if (isFutureMonth) return [];
    return activities.map((activity) => {
      let completed = 0;
      let partial = 0;
      let incomplete = 0;
      let active = 0;
      let score = 0;

      for (const date of monthDates) {
        if (isCurrentMonth && date > todayStr) continue;
        if (activity.startDate && date < activity.startDate) continue;
        if (activity.endDate && date > activity.endDate) continue;
        active++;
        const status = getActivityStatus(date, activity);
        if (status === 'completed') completed++;
        else if (status === 'partial') partial++;
        else if (status === 'incomplete') incomplete++;
        score += status === 'completed' ? 1 : status === 'partial' ? 0.5 : 0;
      }

      const pct = active > 0 ? Math.round((score / active) * 100) : 0;
      return { activity, completed, partial, incomplete, active, pct };
    });
  }, [activities, monthDates, isCurrentMonth, todayStr, isFutureMonth, dailyRecords]);

  const overallStats = useMemo(() => {
    if (isFutureMonth || activityStats.length === 0) return { pct: 0, completed: 0, active: 0 };
    const totalScore = activityStats.reduce((s, a) => s + a.completed + a.partial * 0.5, 0);
    const totalCompleted = activityStats.reduce((s, a) => s + a.completed, 0);
    const totalActive = activityStats.reduce((s, a) => s + a.active, 0);
    return {
      pct: totalActive > 0 ? Math.round((totalScore / totalActive) * 100) : 0,
      completed: totalCompleted,
      active: totalActive,
    };
  }, [activityStats, isFutureMonth]);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await activityService.deleteActivity(deleteId);
    toast('Activity deleted', 'success');
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Activity Tracker"
        subtitle="Track your daily habits and activities"
        actions={
          <button
            className="btn-primary px-4 py-2.5 text-sm"
            onClick={() => {
              setEditingActivity(null);
              setFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add Activity
          </button>
        }
      />

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="btn-ghost px-2" aria-label="Previous month">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-ink dark:text-slate-100 min-w-[180px] text-center">
            {formatMonthYear(year, month)}
          </h2>
          <button onClick={nextMonth} className="btn-ghost px-2" aria-label="Next month">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="input py-1.5 text-sm w-auto"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {new Date(2000, i, 1).toLocaleDateString('en-US', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            className="input py-1.5 text-sm w-auto"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {Array.from({ length: 10 }, (_, i) => now.getFullYear() - 3 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Overall Stats */}
      {!isFutureMonth && activities.length > 0 && (
        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink dark:text-slate-200">Monthly Completion</span>
            <span className="text-sm font-semibold text-primary dark:text-primary-300">
              {overallStats.pct}%
            </span>
          </div>
          <ProgressBar value={overallStats.pct} color={overallStats.pct >= 80 ? 'success' : 'primary'} />
          <p className="text-xs text-ink-muted dark:text-slate-400 mt-2">
            {overallStats.completed} completed out of {overallStats.active} active day-activities
          </p>
        </div>
      )}

      {isFutureMonth && (
        <div className="card p-8 mb-4">
          <EmptyState
            title="No activity data yet"
            description="This month is in the future. Activity statistics will appear once the month begins."
          />
        </div>
      )}

      {/* Activity Grid */}
      {!isFutureMonth && activities.length === 0 ? (
        <div className="card p-8">
          <EmptyState
            title="No activities yet"
            description="Add activities like DSA, Python, or Exercise to start tracking your daily progress."
            action={
              <button
                className="btn-primary px-4 py-2.5 text-sm"
                onClick={() => {
                  setEditingActivity(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="w-4 h-4" />
                Add Your First Activity
              </button>
            }
          />
        </div>
      ) : !isFutureMonth ? (
        <>
          {/* Desktop Grid */}
          <div className="card p-4 overflow-x-auto hidden md:block">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-ink-muted dark:text-slate-400 pb-3 pr-3 sticky left-0 bg-surface-card dark:bg-surface-dark-card">
                    Activity
                  </th>
                  {monthDates.map((date) => {
                    const dayNum = parseISODate(date).getDate();
                    const dayName = getDayName(date, true).charAt(0);
                    const isToday = date === todayStr;
                    const isFuture = date > todayStr;
                    return (
                      <th
                        key={date}
                        className={`text-center text-xs font-medium pb-3 px-1 ${isToday ? 'text-primary dark:text-primary-300' : isFuture ? 'text-ink-light dark:text-slate-600' : 'text-ink-muted dark:text-slate-400'}`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span>{dayName}</span>
                          <span className={`font-semibold ${isToday ? 'text-primary dark:text-primary-300' : ''}`}>
                            {dayNum}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="text-right text-xs font-medium text-ink-muted dark:text-slate-400 pb-3 pl-3">
                    Stats
                  </th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => {
                  const stats = activityStats.find((s) => s.activity.id === activity.id);
                  return (
                    <tr key={activity.id} className="border-t border-slate-100 dark:border-slate-700/50">
                      <td className="py-2 pr-3 sticky left-0 bg-surface-card dark:bg-surface-dark-card">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => {
                                setEditingActivity(activity);
                                setFormOpen(true);
                              }}
                              className="text-ink-light hover:text-primary dark:text-slate-500 dark:hover:text-primary-300"
                              aria-label={`Edit ${activity.name}`}
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setDeleteId(activity.id)}
                              className="text-ink-light hover:text-danger dark:text-slate-500 dark:hover:text-red-400"
                              aria-label={`Delete ${activity.name}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-sm font-medium text-ink dark:text-slate-200 whitespace-nowrap">
                            {activity.name}
                          </span>
                        </div>
                      </td>
                      {monthDates.map((date) => {
                        const status = getActivityStatus(date, activity);
                        const isInactive = !!(
                          (activity.startDate && date < activity.startDate) ||
                          (activity.endDate && date > activity.endDate)
                        );
                        const isFuture = date > todayStr;
                        return (
                          <td key={date} className="text-center p-1">
                            <button
                              onClick={() => handleCellClick(date, activity)}
                              disabled={isFuture || isInactive}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                isInactive || isFuture
                                  ? 'opacity-30 cursor-not-allowed'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer'
                              } ${
                                status === 'completed'
                                  ? 'bg-success-soft dark:bg-green-900/30'
                                  : status === 'partial'
                                    ? 'bg-warning-soft dark:bg-amber-900/30'
                                  : status === 'incomplete'
                                    ? 'bg-danger-soft dark:bg-red-900/30'
                                    : ''
                              }`}
                              aria-label={`${activity.name} on ${date}: ${status ?? 'not recorded'}`}
                            >
                              {status === 'completed' && <Check className="w-3.5 h-3.5 text-success-text dark:text-green-400" />}
                              {status === 'partial' && <CircleDashed className="w-3.5 h-3.5 text-warning-text dark:text-amber-400" />}
                              {status === 'incomplete' && <X className="w-3.5 h-3.5 text-danger-text dark:text-red-400" />}
                              {!status && !isInactive && !isFuture && (
                                <Minus className="w-3 h-3 text-ink-light dark:text-slate-600" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                      <td className="py-2 pl-3 text-right">
                        {stats && (
                          <span className={`text-sm font-semibold ${stats.pct >= 80 ? 'text-success-text dark:text-green-400' : stats.pct >= 50 ? 'text-primary dark:text-primary-300' : 'text-ink-muted dark:text-slate-400'}`}>
                            {stats.pct}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: Per-activity cards */}
          <div className="md:hidden space-y-4">
            {activities.map((activity) => {
              const stats = activityStats.find((s) => s.activity.id === activity.id);
              return (
                <div key={activity.id} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink dark:text-slate-200">
                        {activity.name}
                      </span>
                      <button
                        onClick={() => {
                          setEditingActivity(activity);
                          setFormOpen(true);
                        }}
                        className="text-ink-light hover:text-primary dark:text-slate-500 dark:hover:text-primary-300"
                        aria-label={`Edit ${activity.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(activity.id)}
                        className="text-ink-light hover:text-danger dark:text-slate-500 dark:hover:text-red-400"
                        aria-label={`Delete ${activity.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {stats && (
                      <span className={`text-sm font-semibold ${stats.pct >= 80 ? 'text-success-text dark:text-green-400' : 'text-primary dark:text-primary-300'}`}>
                        {stats.pct}%
                      </span>
                    )}
                  </div>
                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {monthDates.map((date) => {
                      const status = getActivityStatus(date, activity);
                      const isInactive = !!(
                        (activity.startDate && date < activity.startDate) ||
                        (activity.endDate && date > activity.endDate)
                      );
                      const isFuture = date > todayStr;
                      const dayNum = parseISODate(date).getDate();
                      return (
                        <button
                          key={date}
                          onClick={() => handleCellClick(date, activity)}
                          disabled={isFuture || isInactive}
                          className={`
                            aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-colors
                            ${isInactive || isFuture ? 'opacity-30' : 'active:scale-95'}
                            ${status === 'completed' ? 'bg-success-soft dark:bg-green-900/30 text-success-text dark:text-green-400' : ''}
                            ${status === 'partial' ? 'bg-warning-soft dark:bg-amber-900/30 text-warning-text dark:text-amber-400' : ''}
                            ${status === 'incomplete' ? 'bg-danger-soft dark:bg-red-900/30 text-danger-text dark:text-red-400' : ''}
                            ${!status && !isInactive && !isFuture ? 'bg-slate-50 dark:bg-slate-700/30 text-ink-light dark:text-slate-500' : ''}
                            ${date === todayStr ? 'ring-1 ring-primary' : ''}
                          `}
                          aria-label={`${activity.name} day ${dayNum}: ${status ?? 'not recorded'}`}
                        >
                          <span className="text-[10px]">{dayNum}</span>
                          {status === 'completed' && <Check className="w-3 h-3" />}
                          {status === 'partial' && <CircleDashed className="w-3 h-3" />}
                          {status === 'incomplete' && <X className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs text-ink-muted dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-warning-soft dark:bg-amber-900/30 flex items-center justify-center">
                <CircleDashed className="w-2.5 h-2.5 text-warning-text dark:text-amber-400" />
              </span>
              Partial
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-success-soft dark:bg-green-900/30 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-success-text dark:text-green-400" />
              </span>
              Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-danger-soft dark:bg-red-900/30 flex items-center justify-center">
                <X className="w-2.5 h-2.5 text-danger-text dark:text-red-400" />
              </span>
              Incomplete
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <Minus className="w-2.5 h-2.5 text-ink-light dark:text-slate-500" />
              </span>
              Not recorded
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded opacity-30 bg-slate-100 dark:bg-slate-700" />
              Inactive
            </span>
          </div>
        </>
      ) : null}

      <ActivityForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        activity={editingActivity}
        onSubmit={(data) => {
          if (editingActivity) {
            activityService.updateActivity(editingActivity.id, data);
            toast('Activity updated', 'success');
          } else {
            activityService.createActivity(data);
            toast('Activity added', 'success');
          }
        }}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Activity"
        message="Are you sure you want to delete this activity? All tracking data for this activity will also be removed."
      />
    </div>
  );
}
