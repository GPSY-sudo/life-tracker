
import { useState, useMemo, useEffect } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Clock, Target, ListChecks, Volume2, VolumeX, Music } from 'lucide-react';
import { usePomodoro } from '@/hooks/usePomodoro';
import { useActivities, useTasks, useFocusSessions, useSettings, loadFocusSessionsFromAPI, loadActivitiesFromAPI, loadTasksFromAPI, useSoundPresets, updateSoundPreferences, syncFocusSessionToState } from '@/hooks/useAppData';
import { SoundMixer } from '@/components/SoundMixer';
import { audioService } from '@/services/audioService';
import { focusService } from '@/services/focusService';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatTime, formatDuration, formatSessionDuration, todayISO, formatTimeFromDate } from '@/utils/date';
import type { PomodoroMode, SoundId } from '@/types';

export function FocusPage() {
  const activities = useActivities();
  const tasks = useTasks();
  const focusSessions = useFocusSessions();
  const settings = useSettings();
  const presets = useSoundPresets();

  const [focusActivityId, setFocusActivityId] = useState<string>('');
  const [focusTaskId, setFocusTaskId] = useState<string>('');

  // Get tasks related to the selected activity
  const getTasksForActivity = (activityId: string) => {
    if (!activityId) return [];
    return tasks.filter((t) => t.activityId === activityId && t.status !== 'completed');
  };

  // Handle activity selection - Rule 1
  const handleActivityChange = (newActivityId: string) => {
    setFocusActivityId(newActivityId);
    // If a task is selected from a different activity, clear it
    if (newActivityId && focusTaskId) {
      const selectedTask = tasks.find((t) => t.id === focusTaskId);
      if (selectedTask && selectedTask.activityId !== newActivityId) {
        setFocusTaskId('');
      }
    }
  };

  // Handle task selection - Rule 2 & 3
  const handleTaskChange = (newTaskId: string) => {
    if (!newTaskId) {
      setFocusTaskId('');
      return;
    }
    
    const selectedTask = tasks.find((t) => t.id === newTaskId);
    if (selectedTask) {
      // Auto-set activity to task's activity (or clear if task has no activity)
      setFocusActivityId(selectedTask.activityId || '');
      setFocusTaskId(newTaskId);
    }
  };

  // Determine available tasks based on current activity or all pending tasks
  const availableTasks = focusActivityId 
    ? getTasksForActivity(focusActivityId)
    : tasks.filter((t) => t.status !== 'completed');
  
  // Subscribe to audioService state changes - forces re-render when audio state changes
  const [, setAudioStateVersion] = useState(0);

  // Load activities, tasks, and focus sessions from API on mount
  useEffect(() => {
    Promise.all([
      loadActivitiesFromAPI().catch(() => {}),
      loadTasksFromAPI().catch(() => {}),
      loadFocusSessionsFromAPI().catch((error) => {
        console.error('Failed to load focus sessions:', error);
      }),
    ]);
  }, []);

  // Subscribe to audioService notifications
  useEffect(() => {
    const unsubscribe = audioService.subscribe(() => {
      setAudioStateVersion((v) => v + 1);
    });
    return unsubscribe;
  }, []);

  // Sound control handlers - call audioService directly
  const handlePlayPause = () => {
    const hasPlaying = audioService.hasAnyPlaying();
    if (hasPlaying) {
      // Pause: preserve configuration
      audioService.pauseAll();
    } else if (settings.sounds.enabledSounds && settings.sounds.enabledSounds.length > 0) {
      // Play: resume saved sounds using their saved volumes
      const volumes = settings.sounds.soundVolumes || {};
      for (const soundId of settings.sounds.enabledSounds) {
        const vol = volumes[soundId] ?? 50;
        audioService.play(soundId, vol);
      }
    }
  };

  const handleMute = () => {
    const isMuted = audioService.isMuted();
    if (isMuted) {
      audioService.unmuteAll();
    } else {
      audioService.muteAll();
    }
  };

  const handleMasterVolumeChange = (value: number) => {
    audioService.setMasterVolume(value);
    updateSoundPreferences({ masterVolume: value });
  };

  // Display name based on selectedPreset or enabledSounds
  const getSoundDisplayName = (): string => {
    const selectedPreset = settings.sounds.selectedPreset;
    const enabledSounds = settings.sounds.enabledSounds || [];
    
    // If a preset is selected, show its name
    if (selectedPreset) {
      const preset = presets.find((p) => p.id === selectedPreset);
      if (preset) {
        return preset.name;
      }
    }

    // If sounds are enabled but no preset selected, show sound names
    if (enabledSounds.length > 0) {
      return enabledSounds.join(' + ');
    }

    // Default: no sound selected
    return 'No sound selected';
  };

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
  
  // Get the total duration in seconds for the current mode
  const getTotalDurationSeconds = (mode: PomodoroMode): number => {
    if (mode === 'focus') return settings.pomodoro.focusDuration * 60;
    if (mode === 'shortBreak') return settings.pomodoro.shortBreakDuration * 60;
    return settings.pomodoro.longBreakDuration * 60;
  };

  const focusTarget = {
    activityId: focusActivityId || undefined,
    taskId: focusTaskId || undefined,
  };

  const pomodoro = usePomodoro(focusTarget);

  // Navigation cleanup: preserve active timer state, do NOT save session
  useEffect(() => {
    return () => {
      // On unmount: do NOT save a FocusSession
      // The timer is persisted in global store and will be restored on return
      // No session should be created just because user navigated away
    };
  }, []);

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
                strokeDashoffset={2 * Math.PI * 110 * (1 - pomodoro.timeRemaining / getTotalDurationSeconds(pomodoro.mode))}
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
            {pomodoro.isRunning ? (
              <button onClick={pomodoro.pause} className="btn-primary px-8 py-3">
                <Pause className="w-5 h-5" /> Pause
              </button>
            ) : pomodoro.isPaused ? (
              <button onClick={pomodoro.start} className="btn-primary px-8 py-3">
                <Play className="w-5 h-5" /> Resume
              </button>
            ) : (
              <button onClick={pomodoro.start} className="btn-primary px-8 py-3">
                <Play className="w-5 h-5" /> Start
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

            {/* Guidance Box */}
            <div className="mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <p className="text-xs leading-relaxed text-ink-muted dark:text-slate-400">
                <span className="font-medium">💡 Focus linking rules:</span>
                <br />• Select an Activity to see its related Tasks<br />
                • Select a Task to auto-set its Activity<br />
                • Both can be selected when related<br />
                • Select neither for Free Focus
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label" htmlFor="focus-activity">Activity (optional)</label>
                <select
                  id="focus-activity"
                  className="input"
                  disabled={pomodoro.isRunning}
                  value={focusActivityId}
                  onChange={(e) => handleActivityChange(e.target.value)}
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
                  disabled={pomodoro.isRunning}
                  value={focusTaskId}
                  onChange={(e) => handleTaskChange(e.target.value)}
                >
                  <option value="">None</option>
                  {availableTasks.map((t) => (
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

          {/* Sound Controller Card - Hidden in V1, will be integrated with Moodist in V2 */}
          {false && (
          <div className="card p-5">
            {/* Row 1: Quick Controls */}
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-primary dark:text-primary-300" />
                <span className="text-sm font-medium text-ink dark:text-slate-200">
                  {getSoundDisplayName()}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handlePlayPause}
                  className="btn-secondary px-3 py-1.5 text-xs md:text-sm flex items-center gap-1"
                  aria-label={audioService.hasAnyPlaying() ? 'Pause sounds' : 'Play sounds'}
                >
                  {audioService.hasAnyPlaying() ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Play</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleMute}
                  className="btn-secondary px-3 py-1.5 text-xs md:text-sm flex items-center gap-1"
                  aria-label={audioService.isMuted() ? 'Unmute' : 'Mute'}
                >
                  {audioService.isMuted() ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Unmute</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Mute</span>
                    </>
                  )}
                </button>
                <SoundMixer compact />
              </div>
            </div>

            {/* Row 2: Master Volume */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-ink-muted dark:text-slate-400 min-w-max">Master Volume</span>
              <input
                type="range"
                min={0}
                max={100}
                value={audioService.getMasterVolume()}
                onChange={(e) => handleMasterVolumeChange(Number(e.target.value))}
                className="flex-1"
                aria-label="Master volume"
              />
              <span className="text-xs text-ink-muted dark:text-slate-400 min-w-max">{audioService.getMasterVolume()}%</span>
            </div>
          </div>
          )}

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
                <p className="text-2xl font-bold text-ink dark:text-slate-100">{formatSessionDuration(todayMinutes)}</p>
                <p className="text-xs text-ink-muted dark:text-slate-400">Focused</p>
              </div>
            </div>

            {/* Session history */}
            {todaySessions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-ink-muted dark:text-slate-400 mb-2">Recent Focus</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {[...todaySessions].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).map((s) => (
                    <div key={s.id} className="flex items-center gap-2 text-xs">
                      <span className="text-ink-muted dark:text-slate-400 w-12">{formatTimeFromDate(s.startTime)}</span>
                      <span className="text-ink dark:text-slate-200 flex-1 truncate">
                        {getTaskTitle(s.taskId) ?? getActivityName(s.activityId) ?? 'Free focus'}
                      </span>
                      <span className="text-ink-muted dark:text-slate-400">{formatSessionDuration(s.duration)}</span>
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
