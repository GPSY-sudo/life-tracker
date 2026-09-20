import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Target,
  ListChecks,
  BookOpen,
  Plus,
  Play,
  CalendarPlus,
  Clock,
  TrendingUp,
  CheckCircle2,
  Circle,
  AlertCircle,
} from 'lucide-react';
import { useActivities, useTasks, useFocusSessions, useDailyRecord, loadActivitiesFromAPI, loadTasksFromAPI, loadFocusSessionsFromAPI, updateActivityStatusAndSync, loadDailyRecordsForRange, syncTaskToState } from '@/hooks/useAppData';
import { useToast } from '@/hooks/useToast';
import { dailyService } from '@/services/dailyService';
import { taskService } from '@/services/taskService';
import { diaryService } from '@/services/diaryService';
import { ActivityStatusIcon } from '@/components/ActivityStatusIcon';
import { ActivityForm } from '@/components/ActivityForm';
import { TaskForm } from '@/components/TaskForm';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PriorityBadge } from '@/components/ui/Badge';
import { activityService } from '@/services/activityService';
import { todayISO, getGreeting, formatDate, formatDuration, isDateApplicable } from '@/utils/date';
import type { ActivityStatus } from '@/types';

export function DashboardPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const activities = useActivities();
  const tasks = useTasks();
  const focusSessions = useFocusSessions();
  const todayRecord = useDailyRecord(todayISO());

  const [activityFormOpen, setActivityFormOpen] = useState(false);
  const [taskFormOpen, setTaskOpen] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Coordinate loading of activities and today's DailyRecord on mount
  useEffect(() => {
    let active = true;
    setDashboardLoading(true);
    setDashboardError(null);

    Promise.all([
      loadActivitiesFromAPI(),
      loadTasksFromAPI(),
      loadFocusSessionsFromAPI(),
      loadDailyRecordsForRange(todayISO(), todayISO()),
    ])
      .then(() => {
        if (active) {
          setDashboardLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          console.error('Failed to load dashboard data:', err);
          setDashboardError('Failed to load dashboard. Please try again.');
          setDashboardLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const todayStr = todayISO();

  const todayFocusSessions = useMemo(
    () => focusSessions.filter((s) => s.date === todayStr && s.type === 'focus'),
    [focusSessions, todayStr]
  );

  const focusMinutes = todayFocusSessions.reduce((sum, s) => sum + s.duration, 0);

  const activitySummary = useMemo(() => {
    if (activities.length === 0) return { completed: 0, total: 0, pct: 0 };
    let completed = 0;
    let score = 0;
    let total = 0;
    for (const activity of activities) {
      // Check if activity is applicable today (date range + schedule + pause periods)
      if (!isDateApplicable(todayStr, activity)) continue;
      const status = todayRecord?.activities[activity.id];
      total++;
      if (status === 'completed') completed++;
      if (status === 'completed') score += 1;
      else if (status === 'partial') score += 0.5;
    }
    return {
      completed,
      total,
      pct: total > 0 ? Math.round((score / total) * 100) : 0,
    };
  }, [todayRecord, activities, todayStr]);

  const taskSummary = useMemo(() => {
    const todayTasks = tasks.filter((t) => t.dueDate === todayStr);
    const completed = todayTasks.filter((t) => t.status === 'completed').length;
    const pending = todayTasks.filter((t) => t.status !== 'completed').length;
    return { completed, pending, total: todayTasks.length };
  }, [tasks, todayStr]);

  const diaryWritten = !!(todayRecord && todayRecord.diaryNote.trim().length > 0);

  const importantTasks = useMemo(() => {
    const today = todayISO();
    
    // Helper to classify urgency (lower number = higher urgency)
    const getUrgency = (dueDate?: string): number => {
      if (!dueDate) return 3; // no-date: lowest urgency
      if (dueDate < today) return 0; // overdue: highest urgency
      if (dueDate === today) return 1; // today: high urgency
      return 2; // upcoming: medium urgency
    };

    const priorityOrder = { high: 0, medium: 1, low: 2 };

    return tasks
      .filter((t) => t.status !== 'completed')
      .sort((a, b) => {
        // Sort by urgency first
        const urgencyDiff = getUrgency(a.dueDate) - getUrgency(b.dueDate);
        if (urgencyDiff !== 0) return urgencyDiff;
        
        // Within same urgency, sort by priority
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 5);
  }, [tasks, todayStr]);

  const handleCycleActivity = async (activityId: string) => {
    const current = todayRecord?.activities[activityId];
    const next: ActivityStatus | undefined =
      !current ? 'partial' : 
      current === 'partial' ? 'completed' : 
      current === 'completed' ? 'incomplete' : 
      current === 'incomplete' ? 'partial' : 
      undefined;
    try {
      await updateActivityStatusAndSync(todayStr, activityId, next);
    } catch (err) {
      toast('Failed to update activity status', 'error');
      console.error(err);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    try {
      if (currentStatus === 'completed') {
        const updated = await taskService.reopenTask(taskId);
        syncTaskToState(updated);
        toast('Task reopened', 'info');
      } else {
        const updated = await taskService.completeTask(taskId);
        syncTaskToState(updated);
        toast('Task completed', 'success');
      }
    } catch (err) {
      toast('Failed to update task', 'error');
      console.error(err);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Greeting — always show */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-ink dark:text-slate-100">
          {getGreeting(user?.name)}
        </h1>
        <p className="text-sm text-ink-muted dark:text-slate-400 mt-1">
          {formatDate(new Date())}
        </p>
      </div>

      {/* Loading State */}
      {dashboardLoading ? (
        <div className="space-y-6">
          {/* Quick Actions Skeleton */}
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-24 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
            ))}
          </div>

          {/* Summary Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-5 space-y-3">
                <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-10 w-1/2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Activity & Task Cards Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="card p-5 space-y-3">
                <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : dashboardError ? (
        /* Error State */
        <div className="card p-8 text-center">
          <p className="text-lg font-semibold text-ink dark:text-slate-200 mb-4">
            {dashboardError}
          </p>
          <button
            onClick={() => {
              setDashboardError(null);
              setDashboardLoading(true);
              Promise.all([
                loadActivitiesFromAPI(),
                loadTasksFromAPI(),
                loadFocusSessionsFromAPI(),
                loadDailyRecordsForRange(todayISO(), todayISO()),
              ])
                .then(() => {
                  setDashboardLoading(false);
                })
                .catch((err) => {
                  console.error('Failed to load dashboard data:', err);
                  setDashboardError('Failed to load dashboard. Please try again.');
                  setDashboardLoading(false);
                });
            }}
            className="btn-primary px-4 py-2 text-sm"
          >
            Retry
          </button>
        </div>
      ) : (
        /* Main Dashboard Content */
        <>
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              className="btn-primary px-4 py-2.5 text-sm"
              onClick={() => navigate('/focus')}
            >
              <Play className="w-4 h-4" />
              Start Focus
            </button>
            <button
              className="btn-secondary px-4 py-2.5 text-sm"
              onClick={() => setTaskOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
            <button
              className="btn-secondary px-4 py-2.5 text-sm"
              onClick={() => setActivityFormOpen(true)}
            >
              <CalendarPlus className="w-4 h-4" />
              Add Activity
            </button>
            <button
              className="btn-secondary px-4 py-2.5 text-sm"
              onClick={() => navigate('/diary')}
            >
              <BookOpen className="w-4 h-4" />
              Write Diary
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Activity Summary */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary/15 flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary dark:text-primary-300" />
                </div>
                <h3 className="text-sm font-semibold text-ink dark:text-slate-200">Activities</h3>
              </div>
              <p className="text-2xl font-bold text-ink dark:text-slate-100 mb-1">
                {activitySummary.completed} / {activitySummary.total}
              </p>
              <p className="text-xs text-ink-muted dark:text-slate-400 mb-3">completed today</p>
              <ProgressBar value={activitySummary.pct} color={activitySummary.pct >= 80 ? 'success' : 'primary'} showLabel />
            </div>

            {/* Task Summary */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary/15 flex items-center justify-center">
                  <ListChecks className="w-4 h-4 text-primary dark:text-primary-300" />
                </div>
                <h3 className="text-sm font-semibold text-ink dark:text-slate-200">Tasks</h3>
              </div>
              <p className="text-2xl font-bold text-ink dark:text-slate-100 mb-1">
                {taskSummary.completed} completed
              </p>
              <p className="text-xs text-ink-muted dark:text-slate-400">
                {taskSummary.pending} pending
              </p>
              <div className="flex gap-3 mt-3 text-xs">
                <span className="flex items-center gap-1 text-success-text dark:text-green-400">
                  <CheckCircle2 className="w-3 h-3" /> {taskSummary.completed}
                </span>
                <span className="flex items-center gap-1 text-ink-muted dark:text-slate-400">
                  <Circle className="w-3 h-3" /> {taskSummary.pending}
                </span>
              </div>
            </div>

            {/* Focus Summary */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary/15 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-primary dark:text-primary-300" />
                </div>
                <h3 className="text-sm font-semibold text-ink dark:text-slate-200">Focus</h3>
              </div>
              <p className="text-2xl font-bold text-ink dark:text-slate-100 mb-1">
                {todayFocusSessions.length} Pomodoros
              </p>
              <p className="text-xs text-ink-muted dark:text-slate-400">
                {formatDuration(focusMinutes)} focused
              </p>
            </div>

            {/* Diary Summary */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary/15 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-primary dark:text-primary-300" />
                </div>
                <h3 className="text-sm font-semibold text-ink dark:text-slate-200">Diary</h3>
              </div>
              {diaryWritten ? (
                <>
                  <p className="text-2xl font-bold text-success-text dark:text-green-400 mb-1">Written</p>
                  <p className="text-xs text-ink-muted dark:text-slate-400">Today's entry saved</p>
                  <button
                    className="text-xs text-primary dark:text-primary-300 hover:underline mt-2"
                    onClick={() => navigate(`/diary?date=${todayStr}`)}
                  >
                    Edit entry
                  </button>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-ink-light dark:text-slate-500 mb-1">Not written</p>
                  <button
                    className="text-xs text-primary dark:text-primary-300 hover:underline mt-1"
                    onClick={() => navigate(`/diary?date=${todayStr}`)}
                  >
                    Write today's entry
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Activity Card + Task Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Activity Card */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-ink dark:text-slate-200">Today's Activities</h3>
                <button
                  className="text-xs text-primary dark:text-primary-300 hover:underline"
                  onClick={() => navigate('/today')}
                >
                  View Today
                </button>
              </div>
              <div className="space-y-2">
                {activities.length === 0 ? (
                  <p className="text-sm text-ink-muted dark:text-slate-400 py-4 text-center">
                    No activities yet. Add one to start tracking.
                  </p>
                ) : (
                  activities.slice(0, 6).map((activity) => {
                    const status = todayRecord?.activities[activity.id];
                    const isActive = isDateApplicable(todayStr, activity);
                    if (!isActive) return null;
                    return (
                      <button
                        key={activity.id}
                        onClick={() => handleCycleActivity(activity.id)}
                        className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                      >
                        <ActivityStatusIcon status={status} size="sm" />
                        <span className={`text-sm flex-1 ${status === 'completed' ? 'text-ink-muted dark:text-slate-500 line-through' : 'text-ink dark:text-slate-200'}`}>
                          {activity.name}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Task Card */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-ink dark:text-slate-200">Important Tasks</h3>
                <button
                  className="text-xs text-primary dark:text-primary-300 hover:underline"
                  onClick={() => navigate('/tasks')}
                >
                  View All Tasks
                </button>
              </div>
              <div className="space-y-2">
                {importantTasks.length === 0 ? (
                  <p className="text-sm text-ink-muted dark:text-slate-400 py-4 text-center">
                    No pending tasks. You're all caught up!
                  </p>
                ) : (
                  importantTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <button
                        onClick={() => handleToggleTask(task.id, task.status)}
                        className="shrink-0"
                        aria-label={task.status === 'completed' ? 'Reopen task' : 'Complete task'}
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-success dark:text-green-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-ink-light dark:text-slate-500 hover:text-primary dark:hover:text-primary-300" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${task.status === 'completed' ? 'text-ink-muted dark:text-slate-500 line-through' : 'text-ink dark:text-slate-200'}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <PriorityBadge priority={task.priority} />
                          {task.dueDate && (
                            <span className={`text-xs ${task.dueDate < todayStr ? 'text-danger-text dark:text-red-400' : 'text-ink-muted dark:text-slate-400'}`}>
                              {task.dueDate === todayStr ? 'Due today' : task.dueDate < todayStr ? 'Overdue' : `Due ${task.dueDate}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <ActivityForm
            open={activityFormOpen}
            onClose={() => setActivityFormOpen(false)}
            onSubmit={(data) => {
              activityService.createActivity(data);
              toast('Activity added', 'success');
            }}
          />
          <TaskForm
            open={taskFormOpen}
            onClose={() => setTaskOpen(false)}
            onSubmit={async (data) => {
              try {
                const created = await taskService.createTask(data);
                syncTaskToState(created);
                toast('Task added', 'success');
              } catch (err) {
                toast('Failed to add task', 'error');
                console.error(err);
              }
            }}
          />
        </>
      )}
    </div>
  );
}
