import { useState, useEffect, useRef, useCallback } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSettings } from './useAppData';
import { syncFocusSessionToState, loadFocusSessionsFromAPI } from './useAppData';
import { focusService } from '@/services/focusService';
import { store } from '@/services/store';
import { loadPomodoroStateFromStorage, clearPomodoroStateFromStorage } from '@/utils/pomodoroStorage';
import { showNotification } from '@/utils/notifications';
import type { PomodoroMode, FocusSession } from '@/types';

export function usePomodoro(focusTarget?: { activityId?: string; taskId?: string }) {
  const { pomodoro } = useSettings();
  
  // Restore from localStorage first (browser refresh case), then in-memory store (navigation case)
  const storedStateFromStorage = loadPomodoroStateFromStorage();
  const storedStateFromStore = store.getActivePomodoroState();
  // localStorage takes precedence over in-memory store (browser refresh scenario)
  const storedState = storedStateFromStorage ?? storedStateFromStore;
  const isRestoringState = storedState?.isRunning === true;

  const [mode, setMode] = useState<PomodoroMode>(storedState?.mode ?? 'focus');
  const [timeRemaining, setTimeRemaining] = useState(storedState?.timeRemaining ?? pomodoro.focusDuration * 60);
  // Always initialize as false; restoration effect will set to true for running sessions
  const [isRunning, setIsRunning] = useState(false);
  // isPaused = true when isRunning is false AND sessionStartRef exists (was running but paused)
  const [isPaused, setIsPaused] = useState(storedState && storedState.sessionStartTime && !storedState.isRunning);
  const [currentSession, setCurrentSession] = useState(storedState?.currentSession ?? 1);
  const [completedThisCycle, setCompletedThisCycle] = useState(storedState?.completedThisCycle ?? 0);

  const intervalRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const modeRef = useRef(mode);
  const remainingRef = useRef(timeRemaining);
  const cycleRef = useRef(completedThisCycle);
  const sessionStartRef = useRef<number | null>(storedState?.sessionStartTime ?? null);
  const activeSecondsRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const runningRef = useRef(isRunning);
  const focusTargetRef = useRef(focusTarget);
  const hasInitializedRef = useRef(false); // Track if we've initialized from stored state

  // Track if a session save is in progress to prevent duplicates
  const isSavingSessionRef = useRef(false);
  
  // Guard to prevent duplicate completion notifications
  const lastCompletionTimestampRef = useRef<number | null>(null);

  modeRef.current = mode;
  remainingRef.current = timeRemaining;
  cycleRef.current = completedThisCycle;
  focusTargetRef.current = focusTarget;
  runningRef.current = isRunning;

  // Centralized function to save a focus session with actual elapsed time
  const saveFocusSessionIfElapsed = useCallback((): Promise<FocusSession | void> => {
    // Prevent duplicate saves
    if (isSavingSessionRef.current) {
      return Promise.resolve();
    }

    // Only save focus sessions with elapsed time
    if (modeRef.current !== 'focus' || !sessionStartRef.current || activeSecondsRef.current <= 0) {
      return Promise.resolve();
    }

    const now = Date.now();
    // Use actual elapsed time as decimal minutes (0.07 = ~4 seconds)
    const activeMinutes = activeSecondsRef.current / 60;
    
    isSavingSessionRef.current = true;

    return focusService.completeSession({
      type: 'focus',
      duration: activeMinutes,
      activityId: focusTargetRef.current?.activityId,
      taskId: focusTargetRef.current?.taskId,
      startTime: new Date(sessionStartRef.current).toISOString(),
      endTime: new Date(now).toISOString(),
    }).then((session) => {
      // Clear session state after saving
      activeSecondsRef.current = 0;
      sessionStartRef.current = null;
      
      // Clear persisted Pomodoro state from localStorage after successful save
      clearPomodoroStateFromStorage();
      
      // Sync to local state
      syncFocusSessionToState(session);
      void loadFocusSessionsFromAPI();
      
      return session;
    }).catch((error) => {
      console.error('Failed to save focus session:', error);
      throw error;
    }).finally(() => {
      isSavingSessionRef.current = false;
    });
  }, []);

  // On first mount, if we're restoring from stored state, restore all refs and state
  useEffect(() => {
    if (!storedState?.sessionStartTime || hasInitializedRef.current) {
      return;
    }
    
    hasInitializedRef.current = true;
    const now = Date.now();
    
    // Restore refs regardless of running/paused state
    sessionStartRef.current = storedState.sessionStartTime;
    remainingRef.current = storedState.timeRemaining ?? pomodoro.focusDuration * 60;
    
    // For RUNNING sessions: calculate elapsed time and new remaining
    if (storedState.isRunning === true) {
      const getTotalDurationSeconds = (m: PomodoroMode): number => {
        if (m === 'focus') return pomodoro.focusDuration * 60;
        if (m === 'shortBreak') return pomodoro.shortBreakDuration * 60;
        return pomodoro.longBreakDuration * 60;
      };
      const totalSeconds = getTotalDurationSeconds(storedState.mode);
      
      // Calculate elapsed time since session started
      // This handles wall-clock time correctly across browser refresh
      const elapsedMs = now - storedState.sessionStartTime;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const newTimeRemaining = Math.max(0, totalSeconds - elapsedSeconds);
      
      setTimeRemaining(newTimeRemaining);
      remainingRef.current = newTimeRemaining;
      
      // Restore accumulated active seconds: difference between total duration and remaining time
      // This represents how much time has actually been spent running the focus timer
      activeSecondsRef.current = totalSeconds - newTimeRemaining;
      
      // Set up timer refs for interval to use on first tick
      lastTickRef.current = now;
      endTimeRef.current = now + newTimeRemaining * 1000;
      
      // Restore focus target
      if (storedState.focusActivityId || storedState.focusTaskId) {
        focusTargetRef.current = {
          activityId: storedState.focusActivityId,
          taskId: storedState.focusTaskId,
        };
      }
      
      // CRITICAL: Trigger state transition false → true to restart timer interval effect
      setIsRunning(true);
    } else {
      // For PAUSED sessions: restore state but keep isRunning false
      // IMPORTANT: Do NOT reduce timeRemaining on restore for paused sessions
      // timeRemaining was already reduced to the paused value, restore it exactly
      const getTotalDurationSeconds = (m: PomodoroMode): number => {
        if (m === 'focus') return pomodoro.focusDuration * 60;
        if (m === 'shortBreak') return pomodoro.shortBreakDuration * 60;
        return pomodoro.longBreakDuration * 60;
      };
      const totalSeconds = getTotalDurationSeconds(storedState.mode);
      setTimeRemaining(storedState.timeRemaining ?? pomodoro.focusDuration * 60);
      setIsPaused(true);
      
      // Restore accumulated active seconds for paused sessions
      // This represents time already spent running before the pause
      activeSecondsRef.current = totalSeconds - (storedState.timeRemaining ?? pomodoro.focusDuration * 60);
      
      // Restore focus target
      if (storedState.focusActivityId || storedState.focusTaskId) {
        focusTargetRef.current = {
          activityId: storedState.focusActivityId,
          taskId: storedState.focusTaskId,
        };
      }
    }
  }, [storedState, pomodoro.focusDuration, pomodoro.shortBreakDuration, pomodoro.longBreakDuration]);

  const getDuration = useCallback((m: PomodoroMode) => {
    if (m === 'focus') return pomodoro.focusDuration;
    if (m === 'shortBreak') return pomodoro.shortBreakDuration;
    return pomodoro.longBreakDuration;
  }, [pomodoro.focusDuration, pomodoro.shortBreakDuration, pomodoro.longBreakDuration]);

  // Persist active Pomodoro state to store whenever a logical focus session exists
  // A logical session exists when sessionStartRef is set (running or paused)
  useEffect(() => {
    const hasActiveFocusSession = modeRef.current === 'focus' && sessionStartRef.current !== null;
    
    if (isRunning || hasActiveFocusSession) {
      // Persist state for running timer OR active logical focus session (including paused)
      store.setActivePomodoroState({
        mode,
        timeRemaining,
        isRunning,
        currentSession,
        completedThisCycle,
        sessionStartTime: sessionStartRef.current,
        focusActivityId: focusTargetRef.current?.activityId,
        focusTaskId: focusTargetRef.current?.taskId,
      });
    } else {
      // Clear stored state only when no logical session exists
      store.clearActivePomodoroState();
    }
  }, [isRunning, mode, timeRemaining, currentSession, completedThisCycle]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    endTimeRef.current = null;
    lastTickRef.current = null;
  }, []);

  const transition = useCallback((completedFocus: boolean) => {
    const previousMode = modeRef.current;
    clearTimer();

    if (previousMode === 'focus') {
      if (completedFocus) {
        // Save the completed session with actual elapsed time
        void saveFocusSessionIfElapsed().then(() => {
          // Clear persisted state after session completes
          clearPomodoroStateFromStorage();
        });
      }

      const nextCompleted = completedFocus ? cycleRef.current + 1 : cycleRef.current;
      if (completedFocus && nextCompleted >= pomodoro.sessionsBeforeLongBreak) {
        setCompletedThisCycle(0);
        setCurrentSession(1);
        setMode('longBreak');
        setTimeRemaining(pomodoro.longBreakDuration * 60);
      } else {
        if (completedFocus) {
          setCompletedThisCycle(nextCompleted);
          setCurrentSession(Math.min(nextCompleted + 1, pomodoro.sessionsBeforeLongBreak));
        }
        setMode('shortBreak');
        setTimeRemaining(pomodoro.shortBreakDuration * 60);
      }
      activeSecondsRef.current = 0;
      sessionStartRef.current = null;
      setIsPaused(false); // Moving to break, new state
      return 'focus' as PomodoroMode;
    }

    if (previousMode === 'longBreak') {
      setCompletedThisCycle(0);
      setCurrentSession(1);
    }
    setMode('focus');
    setTimeRemaining(pomodoro.focusDuration * 60);
    activeSecondsRef.current = 0;
    sessionStartRef.current = null;
    setIsPaused(false); // New focus session, not paused
    return 'break' as PomodoroMode;
  }, [clearTimer, pomodoro, saveFocusSessionIfElapsed]);

  const startTimer = useCallback(() => {
    if (runningRef.current || remainingRef.current <= 0) return;
    
    // Clear paused state when resuming
    setIsPaused(false);
    
    // Update Activity/Task status when focus session starts
    if (modeRef.current === 'focus' && sessionStartRef.current === null) {
      // Update Task to 'in_progress' if linked
      if (focusTarget?.taskId) {
        focusService.updateTaskStatus(focusTarget.taskId, 'in_progress').catch((error) => {
          console.error('Failed to update task status:', error);
        });
      }
      // Update Activity status to 'partial' for today if linked
      if (focusTarget?.activityId) {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        focusService.updateActivityStatus(focusTarget.activityId, todayStr, 'partial').catch((error) => {
          console.error('Failed to update activity status:', error);
        });
      }
    }

    const now = Date.now();
    if (modeRef.current === 'focus' && sessionStartRef.current === null) sessionStartRef.current = now;
    lastTickRef.current = now;
    endTimeRef.current = now + remainingRef.current * 1000;
    runningRef.current = true;
    setIsRunning(true);
  }, [focusTarget?.taskId, focusTarget?.activityId]);

  const startWithSeconds = useCallback((seconds: number) => {
    if (runningRef.current || seconds <= 0) return;
    
    // Update Activity/Task status when focus session starts
    if (modeRef.current === 'focus' && sessionStartRef.current === null) {
      // Update Task to 'in_progress' if linked
      if (focusTarget?.taskId) {
        focusService.updateTaskStatus(focusTarget.taskId, 'in_progress').catch((error) => {
          console.error('Failed to update task status:', error);
        });
      }
      // Update Activity status to 'partial' for today if linked
      if (focusTarget?.activityId) {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        focusService.updateActivityStatus(focusTarget.activityId, todayStr, 'partial').catch((error) => {
          console.error('Failed to update activity status:', error);
        });
      }
    }

    const now = Date.now();
    if (modeRef.current === 'focus' && sessionStartRef.current === null) sessionStartRef.current = now;
    setTimeRemaining(seconds);
    lastTickRef.current = now;
    endTimeRef.current = now + seconds * 1000;
    runningRef.current = true;
    setIsRunning(true);
  }, [focusTarget?.taskId, focusTarget?.activityId]);

  useEffect(() => {
    if (!isRunning) return;
    
    // Restore interval refs if they were cleared by previous cleanup
    // This ensures restored RUNNING timers have proper timer state
    if (lastTickRef.current === null || endTimeRef.current === null) {
      const now = Date.now();
      lastTickRef.current = now;
      endTimeRef.current = now + remainingRef.current * 1000;
    }
    
    intervalRef.current = window.setInterval(() => {
      const now = Date.now();
      const previousTick = lastTickRef.current ?? now;
      const elapsed = Math.max(0, (now - previousTick) / 1000);
      lastTickRef.current = now;
      if (modeRef.current === 'focus') activeSecondsRef.current += elapsed;

      const end = endTimeRef.current;
      const remaining = end === null ? remainingRef.current : Math.max(0, Math.ceil((end - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        runningRef.current = false;
        setIsRunning(false);
        const wasFocus = modeRef.current === 'focus';
        
        // Trigger completion notification (prevent duplicates with timestamp guard)
        const now = Date.now();
        
        if (!lastCompletionTimestampRef.current || (now - lastCompletionTimestampRef.current) > 1000) {
          lastCompletionTimestampRef.current = now;
          const notificationMessage = wasFocus
            ? 'Focus session ended. Take a break!'
            : 'Break ended. Ready to restart your focus session?';
          showNotification('MiraiThread', { body: notificationMessage });
        }
        
        transition(true);
        const shouldAutoStart = (wasFocus && pomodoro.autoStartBreaks) || (!wasFocus && pomodoro.autoStartFocus);
        if (shouldAutoStart) {
          const nextMode = wasFocus
            ? (cycleRef.current + 1 >= pomodoro.sessionsBeforeLongBreak ? 'longBreak' : 'shortBreak')
            : 'focus';
          const seconds = getDuration(nextMode as PomodoroMode) * 60;
          window.setTimeout(() => startWithSeconds(seconds), 0);
        }
      }
    }, 250);

    return clearTimer;
  }, [isRunning, clearTimer, pomodoro.autoStartBreaks, pomodoro.autoStartFocus]);

  const pause = useCallback(() => {
    if (!isRunning) return;
    const now = Date.now();
    const previousTick = lastTickRef.current ?? now;
    if (modeRef.current === 'focus') activeSecondsRef.current += Math.max(0, (now - previousTick) / 1000);
    const remaining = endTimeRef.current === null ? timeRemaining : Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
    setTimeRemaining(remaining);
    clearTimer();
    runningRef.current = false;
    setIsRunning(false);
    setIsPaused(true); // Mark session as paused (not new, not running)
    // PAUSE: Do NOT save session, just stop timer
    // Session state (sessionStartRef, activeSecondsRef) is preserved for resume
  }, [clearTimer, isRunning, timeRemaining]);

  const reset = useCallback(() => {
    clearTimer();
    runningRef.current = false;
    setIsRunning(false);
    setIsPaused(false); // New timer, not paused anymore
    
    // RESET: Save session with actual elapsed time, then reset timer
    void saveFocusSessionIfElapsed().finally(() => {
      // Clear persisted state since session ended
      clearPomodoroStateFromStorage();
      lastCompletionTimestampRef.current = null; // Clear completion guard
      
      // Always reset timer state regardless of save success/failure
      // saveFocusSessionIfElapsed() already clears sessionStartRef and activeSecondsRef
      setTimeRemaining(getDuration(modeRef.current) * 60);
    });
  }, [clearTimer, getDuration, saveFocusSessionIfElapsed]);

  const skip = useCallback(() => {
    const wasRunning = isRunning;
    if (wasRunning) pause(); else clearTimer();
    
    // SKIP: Save session with actual elapsed time if in focus mode
    void saveFocusSessionIfElapsed().finally(() => {
      // Clear persisted state since session ended
      clearPomodoroStateFromStorage();
      lastCompletionTimestampRef.current = null; // Clear completion guard
      
      // Transition to next mode regardless of save success/failure
      const previous = modeRef.current;
      transition(false);
      if ((previous === 'focus' && pomodoro.autoStartBreaks) || (previous !== 'focus' && pomodoro.autoStartFocus)) {
        const seconds = previous === 'focus'
          ? getDuration(cycleRef.current + 1 >= pomodoro.sessionsBeforeLongBreak ? 'longBreak' : 'shortBreak') * 60
          : getDuration('focus') * 60;
        window.setTimeout(() => startWithSeconds(seconds), 0);
      }
    });
  }, [clearTimer, getDuration, isRunning, pause, pomodoro.autoStartBreaks, pomodoro.autoStartFocus, transition, startWithSeconds, saveFocusSessionIfElapsed]);

  const switchMode = useCallback((newMode: PomodoroMode) => {
    clearTimer();
    runningRef.current = false;
    setIsRunning(false);
    setIsPaused(false); // New mode is fresh, not paused
    setMode(newMode);
    setTimeRemaining(getDuration(newMode) * 60);
    activeSecondsRef.current = 0;
    sessionStartRef.current = null;
    lastCompletionTimestampRef.current = null; // Clear completion guard for fresh timer
    clearPomodoroStateFromStorage(); // Clear storage when switching to fresh timer
  }, [clearTimer, getDuration]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return {
    mode,
    timeRemaining,
    isRunning,
    isPaused,
    currentSession,
    completedThisCycle,
    totalSessions: pomodoro.sessionsBeforeLongBreak,
    start: startTimer,
    pause,
    reset,
    skip,
    switchMode,
  };
}
