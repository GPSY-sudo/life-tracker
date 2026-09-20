import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Target,
  ListChecks,
  Clock,
  BookOpen,
  Play,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { useActivities, useTasks, useFocusSessions, useDailyRecord, loadActivitiesFromAPI, loadTasksFromAPI, loadFocusSessionsFromAPI, updateActivityStatusAndSync, syncTaskToState } from '@/hooks/useAppData';
import { useToast } from '@/hooks/useToast';
import { dailyService } from '@/services/dailyService';
import { taskService } from '@/services/taskService';
import { diaryService } from '@/services/diaryService';
import { ActivityStatusIcon } from '@/components/ActivityStatusIcon';
import { PriorityBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { todayISO, formatDate, addDays, getDayName, formatDuration, toISODate, isDateApplicable } from '@/utils/date';
import type { ActivityStatus } from '@/types';

export function TodayPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const activities = useActivities();
  const tasks = useTasks();
  const focusSessions = useFocusSessions();

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [diaryText, setDiaryText] = useState('');
  const [diaryLoaded, setDiaryLoaded] = useState(false);

  const dayRecord = useDailyRecord(selectedDate);

  // Load activities, tasks, and focus sessions on mount if not already loaded
  useEffect(() => {
    Promise.all([
      loadActivitiesFromAPI().catch(() => {
        // Silently fail — activities may already be loaded
      }),
      loadTasksFromAPI().catch(() => {
        // Silently fail — tasks may already be loaded
      }),
      loadFocusSessionsFromAPI().catch(() => {
        // Silently fail — focus sessions may already be loaded
      }),
    ]);
  }, []);

  // Load diary text when date changes
  useEffect(() => {
    let active = true;
    const load = async () => {
      const text = await diaryService.getDiary(selectedDate);
      if (active) {
        setDiaryText(text);
        setDiaryLoaded(true);
      }
    };
    load();
    return () => { active = false; };
  }, [selectedDate]);

  const isToday = selectedDate === todayISO();
  const isFuture = selectedDate > todayISO();
  const isPast = selectedDate < todayISO();

  const dayFocusSessions = useMemo(
    () => focusSessions.filter((s) => s.date === selectedDate && s.type === 'focus'),
    [focusSessions, selectedDate]
  );

  const focusMinutes = dayFocusSessions.reduce((sum, s) => sum + s.duration, 0);

  const activitySummary = useMemo(() => {
    if (activities.length === 0) return { completed: 0, total: 0, pct: 0 };
    let completed = 0;
    let score = 0;
    let total = 0;
    for (const activity of activities) {
      if (!isDateApplicable(selectedDate, activity)) continue;
      let status = dayRecord?.activities[activity.id];
      
      // Apply the new rule: past applicable unrecorded → incomplete
      if (!status && selectedDate < todayISO()) {
        status = 'incomplete';
      }
      
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
  }, [dayRecord, activities, selectedDate]);

  const dayTasks = useMemo(
    () => tasks.filter((t) => t.dueDate === selectedDate),
    [tasks, selectedDate]
  );

  const completedTasks = dayTasks.filter((t) => t.status === 'completed').length;
  const pendingTasks = dayTasks.filter((t) => t.status !== 'completed').length;

  const handleCycleActivity = async (activityId: string) => {
    // Get the stored status (ignore inferred state for cycling)
    const current = dayRecord?.activities[activityId];
    
    const next: ActivityStatus | undefined =
      !current ? 'partial' : 
      current === 'partial' ? 'completed' : 
      current === 'completed' ? 'incomplete' : 
      current === 'incomplete' ? 'partial' : 
      undefined;
    try {
      await updateActivityStatusAndSync(selectedDate, activityId, next);
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

  const handleSaveDiary = async () => {
    await diaryService.saveDiary(selectedDate, diaryText);
    toast('Diary saved', 'success');
  };

  const goPrevDay = () => setSelectedDate((d) => addDays(d, -1));
  const goNextDay = () => setSelectedDate((d) => addDays(d, 1));
  const goToday = () => setSelectedDate(todayISO());

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goPrevDay}
          className="btn-ghost px-3"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-bold text-ink dark:text-slate-100">
            {formatDate(selectedDate)}
          </h1>
          <p className="text-sm text-ink-muted dark:text-slate-400">{getDayName(selectedDate)}</p>
        </div>
        <button
          onClick={goNextDay}
          className="btn-ghost px-3"
          aria-label="Next day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {!isToday && (
        <div className="flex justify-center mb-4">
          <button onClick={goToday} className="btn-secondary px-4 py-2 text-sm">
            <CalendarDays className="w-4 h-4" />
            Jump to Today
          </button>
        </div>
      )}

      {/* Activities Section */}
      <section className="card p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary dark:text-primary-300" />
            <h2 className="text-base font-semibold text-ink dark:text-slate-200">Activities</h2>
          </div>
          <span className="text-sm text-ink-muted dark:text-slate-400">
            {activitySummary.completed} / {activitySummary.total} completed
          </span>
        </div>
        {isFuture ? (
          <p className="text-sm text-ink-muted dark:text-slate-400 py-4 text-center">
            No activity data for future dates.
          </p>
        ) : activities.length === 0 ? (
          <p className="text-sm text-ink-muted dark:text-slate-400 py-4 text-center">
            No activities yet.
          </p>
        ) : (
          <>
            <div className="space-y-1 mb-4">
              {activities.map((activity) => {
                const status = dayRecord?.activities[activity.id];
                const isActive = isDateApplicable(selectedDate, activity);
                if (!isActive) return null;
                return (
                  <button
                    key={activity.id}
                    onClick={() => handleCycleActivity(activity.id)}
                    className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                  >
                    <ActivityStatusIcon status={status} size="md" />
                    <span className={`text-sm flex-1 ${status === 'completed' ? 'text-ink-muted dark:text-slate-500 line-through' : 'text-ink dark:text-slate-200'}`}>
                      {activity.name}
                    </span>
                  </button>
                );
              })}
            </div>
            <ProgressBar value={activitySummary.pct} showLabel color={activitySummary.pct >= 80 ? 'success' : 'primary'} />
          </>
        )}
      </section>

      {/* Tasks Section */}
      <section className="card p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary dark:text-primary-300" />
            <h2 className="text-base font-semibold text-ink dark:text-slate-200">Tasks</h2>
          </div>
          <span className="text-sm text-ink-muted dark:text-slate-400">
            {completedTasks} done, {pendingTasks} pending
          </span>
        </div>
        {dayTasks.length === 0 ? (
          <p className="text-sm text-ink-muted dark:text-slate-400 py-4 text-center">
            No tasks due on this day.
          </p>
        ) : (
          <div className="space-y-2">
            {dayTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
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
                  <p className={`text-sm ${task.status === 'completed' ? 'text-ink-muted dark:text-slate-500 line-through' : 'text-ink dark:text-slate-200'}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <PriorityBadge priority={task.priority} />
                    {task.dueTime && (
                      <span className="text-xs text-ink-muted dark:text-slate-400">
                        at {task.dueTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Focus Section */}
      <section className="card p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary dark:text-primary-300" />
            <h2 className="text-base font-semibold text-ink dark:text-slate-200">Focus</h2>
          </div>
          {isToday && (
            <button
              onClick={() => navigate('/focus')}
              className="btn-secondary px-3 py-2 text-xs"
            >
              <Play className="w-3 h-3" />
              Start Focus
            </button>
          )}
        </div>
        {dayFocusSessions.length === 0 ? (
          <p className="text-sm text-ink-muted dark:text-slate-400 py-4 text-center">
            No focus sessions on this day.
          </p>
        ) : (
          <div className="flex items-center gap-6">
            <div>
              <p className="text-2xl font-bold text-ink dark:text-slate-100">
                {dayFocusSessions.length} Pomodoros
              </p>
              <p className="text-sm text-ink-muted dark:text-slate-400">
                {formatDuration(focusMinutes)} focused
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Diary Section */}
      <section className="card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-primary dark:text-primary-300" />
          <h2 className="text-base font-semibold text-ink dark:text-slate-200">Diary</h2>
        </div>
        <textarea
          className="input min-h-[120px] resize-y"
          value={diaryText}
          onChange={(e) => setDiaryText(e.target.value)}
          placeholder="Write about your day..."
        />
        <div className="flex justify-end mt-3">
          <button onClick={handleSaveDiary} className="btn-primary px-4 py-2 text-sm">
            Save Diary
          </button>
        </div>
      </section>
    </div>
  );
}
