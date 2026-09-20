import { useState, useMemo, useEffect } from 'react';
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
import { useActivities, useAllDailyRecords, loadActivitiesFromAPI, loadDailyRecordsForRange, syncActivityToState, updateActivityStatusAndSync } from '@/hooks/useAppData';
import { useToast } from '@/hooks/useToast';
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
  isDateApplicable,
} from '@/utils/date';
import type { ActivityStatus, Activity, PausePeriod } from '@/types';

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

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayStr = todayISO();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const isFutureMonth = new Date(year, month, 1) > now;

  const daysInMonth = getDaysInMonth(year, month);
  const monthDates = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => toISODate(new Date(year, month, i + 1))),
    [year, month, daysInMonth]
  );

  // Load activities on mount
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    loadActivitiesFromAPI().catch((err) => {
      if (active) {
        setError('Failed to load activities');
        console.error(err);
      }
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => { active = false; };
  }, []);

  // Load daily records for the selected month
  useEffect(() => {
    let active = true;
    if (isLoading) return; // Don't load daily records until activities are loaded
    
    const startDate = toISODate(new Date(year, month, 1));
    const endDate = toISODate(new Date(year, month, daysInMonth));

    loadDailyRecordsForRange(startDate, endDate).catch((err) => {
      if (active) {
        console.error('Failed to load daily records:', err);
        // Don't set a blocking error — activity grid can still work with empty records
      }
    });
    return () => { active = false; };
  }, [year, month, daysInMonth, isLoading]);

  const getActivityStatus = (date: string, activity: Activity): ActivityStatus | undefined => {
    // Check if date is applicable for this activity
    if (!isDateApplicable(date, activity)) return undefined;
    
    const record = dailyRecords[date];
    const storedStatus = record?.activities[activity.id];
    
    // If there's a stored status, return it
    if (storedStatus) return storedStatus;
    
    // If no stored status, apply the rule:
    // - Past date: return 'incomplete' (inferred)
    // - Today or future: return undefined (not recorded)
    if (date < todayStr) {
      return 'incomplete';
    }
    
    return undefined;
  };

  const handleCellClick = async (date: string, activity: Activity) => {
    // Don't allow editing future dates
    if (date > todayStr) return;
    // Don't allow editing non-applicable dates
    if (!isDateApplicable(date, activity)) return;

    // For cycling, use only the stored status (ignore inferred Incomplete)
    const record = dailyRecords[date];
    const storedStatus = record?.activities[activity.id];
    
    const next: ActivityStatus | undefined =
      !storedStatus ? 'partial' : 
      storedStatus === 'partial' ? 'completed' : 
      storedStatus === 'completed' ? 'incomplete' : 
      storedStatus === 'incomplete' ? 'partial' : 
      undefined;

    try {
      await updateActivityStatusAndSync(date, activity.id, next);
    } catch (err) {
      toast('Failed to update activity status', 'error');
      console.error(err);
    }
  };

  // Filter activities to show only those visible in the selected month
  const visibleActivities = useMemo(() => {
    const monthStart = toISODate(new Date(year, month, 1));
    const monthEnd = toISODate(new Date(year, month, daysInMonth));

    return activities.filter((activity) => {
      // Activity is visible if:
      // activity.startDate <= monthEnd AND (activity.endDate is empty OR activity.endDate >= monthStart)
      const startsOnOrBefore = !activity.startDate || activity.startDate <= monthEnd;
      const endsOnOrAfter = !activity.endDate || activity.endDate >= monthStart;
      return startsOnOrBefore && endsOnOrAfter;
    });
  }, [activities, year, month, daysInMonth]);

  // Dynamically sort visible activities based on today's date
  const sortedActivities = useMemo(() => {
    const today = todayISO();

    const sorted = [...visibleActivities].sort((a, b) => {
      // Determine lifecycle status for each activity
      const getStatus = (act: Activity) => {
        const isCurrentlyActive =
          (!act.startDate || act.startDate <= today) &&
          (!act.endDate || act.endDate >= today);
        const isUpcoming = act.startDate && act.startDate > today;
        const isExpired = act.endDate && act.endDate < today;

        if (isCurrentlyActive) return 0; // CURRENTLY ACTIVE
        if (isUpcoming) return 1; // UPCOMING
        if (isExpired) return 2; // EXPIRED
        return 3; // Fallback (shouldn't happen)
      };

      const statusA = getStatus(a);
      const statusB = getStatus(b);

      if (statusA !== statusB) {
        return statusA - statusB;
      }

      // Within the same lifecycle group, preserve original order
      return visibleActivities.indexOf(a) - visibleActivities.indexOf(b);
    });

    return sorted;
  }, [visibleActivities]);

  // Calculate per-activity stats for the month
  const activityStats = useMemo(() => {
    if (isFutureMonth) return [];
    return sortedActivities.map((activity) => {
      let completed = 0;
      let partial = 0;
      let incomplete = 0;
      let active = 0;
      let score = 0;

      for (const date of monthDates) {
        // Check if date is applicable and not in the future
        const applicable = isDateApplicable(date, activity) && date <= todayStr;

        if (!applicable) continue;
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
  }, [sortedActivities, monthDates, isCurrentMonth, todayStr, isFutureMonth, dailyRecords]);

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

  const handleCreateActivity = async (data: { name: string; startDate?: string; endDate?: string | null; scheduledDays?: string[]; pausePeriods?: PausePeriod[] }) => {
    try {
      const newActivity = await activityService.createActivity(data);
      syncActivityToState(newActivity);
      toast('Activity added', 'success');
    } catch (err) {
      toast('Failed to create activity', 'error');
      console.error(err);
    }
  };

  const handleUpdateActivity = async (data: { name: string; startDate?: string; endDate?: string | null; scheduledDays?: string[]; pausePeriods?: PausePeriod[] }) => {
    if (!editingActivity) return;
    try {
      const updated = await activityService.updateActivity(editingActivity.id, data);
      syncActivityToState(updated);
      toast('Activity updated', 'success');
    } catch (err) {
      toast('Failed to update activity', 'error');
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await activityService.deleteActivity(deleteId);
      syncActivityToState(null, deleteId);
      toast('Activity deleted', 'success');
    } catch (err) {
      toast('Failed to delete activity', 'error');
      console.error(err);
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <PageHeader
          title="Activity Tracker"
          subtitle="Track your daily habits and activities"
        />
        <div className="flex items-center justify-center py-20">
          <span className="text-sm text-ink-muted dark:text-slate-400">Loading activities...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <PageHeader
          title="Activity Tracker"
          subtitle="Track your daily habits and activities"
        />
        <div className="card p-8 text-center">
          <p className="text-sm text-danger-text dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

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
      ) : !isFutureMonth && sortedActivities.length === 0 ? (
        <div className="card p-8">
          <EmptyState
            title="No activities in this month"
            description="Select a different month or add a new activity with a start date in this period."
            action={
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
                {sortedActivities.map((activity) => {
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
                        const isInactive = !isDateApplicable(date, activity);
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
            {sortedActivities.map((activity) => {
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
                      const isInactive = !isDateApplicable(date, activity);
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
        year={year}
        month={month}
        onSubmit={async (data) => {
          if (editingActivity) {
            await handleUpdateActivity(data);
          } else {
            await handleCreateActivity(data);
          }
          setFormOpen(false);
          setEditingActivity(null);
        }}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Activity"
        message="Are you sure you want to delete this activity? Historical tracking data will remain."
      />
    </div>
  );
}
