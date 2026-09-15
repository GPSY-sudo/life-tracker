import { useState, useMemo } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Clock, Target, ListChecks, Headphones } from 'lucide-react';
import { usePomodoro } from '@/hooks/usePomodoro';
import { useActivities, useTasks, useFocusSessions } from '@/hooks/useAppData';
import { SoundMixer } from '@/components/SoundMixer';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatTime, formatDuration, todayISO, formatTimeFromDate } from '@/utils/date';
import type { PomodoroMode } from '@/types';

export function FocusPage() {
  const activities = useActivities();
  const tasks = useTasks();
  const focusSessions = useFocusSessions();

  const [focusActivityId, setFocusActivityId] = useState<string>('');
  const [focusTaskId, setFocusTaskId] = useState<string>('');

  const focusTarget = {
    activityId: focusActivityId || undefined,
    taskId: focusTaskId || undefined,
  };

  const pomodoro = usePomodoro(focusTarget);

  const todayStr = todayISO();
  const todaySessions = useMemo(
    () => focusSessions.filter((s) => s.date === todayStr && s.type === 'focus'),
    [focusSessions, todayStr]
  );
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);

  const getActivityName = (id?: string) => activities.find((a) => a.id === id)?.name;
  const getTaskTitle = (id?: string) => tasks.find((t) => t.id === id)?.title;

  const modeLabel: Record<PomodoroMode, string> = {
    focus: 'Focus',
    shortBreak: 'Short Break',
    longBreak: 'Long Break',
  };

  const modeColors: Record<PomodoroMode, string> = {
    focus: 'text-primary dark:text-primary-300',
    shortBreak: 'text-success dark:text-green-400',
    longBreak: 'text-warning dark:text-amber-400',
  };

  const pendingTasks = tasks.filter((t) => t.status !== 'completed');

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <PageHeader title="Focus" subtitle="Stay focused with the Pomodoro technique" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Timer */}
        <div className="flex flex-col items-center justify-center card p-8 min-h-[400px]">
          {/* Mode tabs */}
          <div className="flex gap-1.5 mb-8 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
            {(['focus', 'shortBreak', 'longBreak'] as PomodoroMode[]).map((m) => (
              <button
                key={m}
                onClick={() => pomodoro.switchMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  pomodoro.mode === m
                    ? 'bg-surface-card dark:bg-surface-dark-card text-primary dark:text-primary-300 shadow-sm'
                    : 'text-ink-muted dark:text-slate-400'
                }`}
              >
                {modeLabel[m]}
              </button>
            ))}
          </div>

          {/* Timer display */}
          <div className="relative flex items-center justify-center mb-6">
            <svg className="absolute inset-0 -rotate-90" width="240" height="240" viewBox="0 0 240 240">
              <circle cx="120" cy="120" r="110" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-200 dark:text-slate-700" />
              <circle
                cx="120" cy="120" r="110"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                className={modeColors[pomodoro.mode]}
                strokeDasharray={2 * Math.PI * 110}
                strokeDashoffset={2 * Math.PI * 110 * (1 - pomodoro.timeRemaining / (pomodoro.mode === 'focus' ? 25 * 60 : pomodoro.mode === 'shortBreak' ? 5 * 60 : 15 * 60))}
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
              />
            </svg>
            <div className="flex flex-col items-center justify-center w-[240px] h-[240px]">
              <span className="text-xs font-medium text-ink-muted dark:text-slate-400 mb-1">
                {modeLabel[pomodoro.mode]}
              </span>
              <span
                className={`text-5xl md:text-6xl font-bold font-mono ${modeColors[pomodoro.mode]}`}
                aria-live="polite"
                aria-label={`${Math.floor(pomodoro.timeRemaining / 60)} minutes ${pomodoro.timeRemaining % 60} seconds remaining`}
              >
                {formatTime(pomodoro.timeRemaining)}
              </span>
              <span className="text-xs text-ink-muted dark:text-slate-400 mt-2">
                Session {pomodoro.currentSession} / {pomodoro.totalSessions}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {!pomodoro.isRunning ? (
              <button onClick={pomodoro.start} className="btn-primary px-8 py-3">
                <Play className="w-5 h-5" /> Start
              </button>
            ) : (
              <button onClick={pomodoro.pause} className="btn-primary px-8 py-3">
                <Pause className="w-5 h-5" /> Pause
              </button>
            )}
            <button onClick={pomodoro.reset} className="btn-ghost px-4 py-3" aria-label="Reset timer">
              <RotateCcw className="w-5 h-5" />
            </button>
            <button onClick={pomodoro.skip} className="btn-ghost px-4 py-3" aria-label="Skip to next">
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right: Target, Sounds, Stats */}
        <div className="space-y-4">
          {/* Focus Target */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary dark:text-primary-300" />
              <h3 className="text-base font-semibold text-ink dark:text-slate-200">Focus Target</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label" htmlFor="focus-activity">Activity (optional)</label>
                <select
                  id="focus-activity"
                  className="input"
                  value={focusActivityId}
                  onChange={(e) => setFocusActivityId(e.target.value)}
                >
                  <option value="">None</option>
                  {activities.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="focus-task">Task (optional)</label>
                <select
                  id="focus-task"
                  className="input"
                  value={focusTaskId}
                  onChange={(e) => setFocusTaskId(e.target.value)}
                >
                  <option value="">None</option>
                  {pendingTasks.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
            </div>
            {(focusActivityId || focusTaskId) && (
              <div className="mt-3 p-3 rounded-xl bg-primary-50 dark:bg-primary/10">
                <p className="text-xs text-ink-muted dark:text-slate-400">Currently focusing on:</p>
                <p className="text-sm font-medium text-primary dark:text-primary-300">
                  {getTaskTitle(focusTaskId) ?? getActivityName(focusActivityId) ?? 'Free focus'}
                </p>
              </div>
            )}
          </div>

          {/* Sound Mixer (compact) */}
          <SoundMixer compact />

          {/* Today's Stats */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary dark:text-primary-300" />
              <h3 className="text-base font-semibold text-ink dark:text-slate-200">Today's Focus</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-ink dark:text-slate-100">{todaySessions.length}</p>
                <p className="text-xs text-ink-muted dark:text-slate-400">Pomodoros</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-ink dark:text-slate-100">{formatDuration(todayMinutes)}</p>
                <p className="text-xs text-ink-muted dark:text-slate-400">Focused</p>
              </div>
            </div>

            {/* Session history */}
            {todaySessions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-ink-muted dark:text-slate-400 mb-2">Session History</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {todaySessions.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 text-xs">
                      <span className="text-ink-muted dark:text-slate-400 w-12">{formatTimeFromDate(s.startTime)}</span>
                      <span className="text-ink dark:text-slate-200 flex-1 truncate">
                        {getTaskTitle(s.taskId) ?? getActivityName(s.activityId) ?? 'Free focus'}
                      </span>
                      <span className="text-ink-muted dark:text-slate-400">{s.duration} min</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
