import { useState, useEffect, useRef, useCallback } from 'react';
import { useSettings } from './useAppData';
import { focusService } from '@/services/focusService';
import type { PomodoroMode } from '@/types';

export function usePomodoro(focusTarget?: { activityId?: string; taskId?: string }) {
  const { pomodoro } = useSettings();
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [timeRemaining, setTimeRemaining] = useState(pomodoro.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [currentSession, setCurrentSession] = useState(1);
  const [completedThisCycle, setCompletedThisCycle] = useState(0);

  const intervalRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const modeRef = useRef(mode);
  const remainingRef = useRef(timeRemaining);
  const cycleRef = useRef(completedThisCycle);
  const sessionStartRef = useRef<number | null>(null);
  const activeSecondsRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  modeRef.current = mode;
  remainingRef.current = timeRemaining;
  cycleRef.current = completedThisCycle;

  const getDuration = useCallback((m: PomodoroMode) => {
    if (m === 'focus') return pomodoro.focusDuration;
    if (m === 'shortBreak') return pomodoro.shortBreakDuration;
    return pomodoro.longBreakDuration;
  }, [pomodoro.focusDuration, pomodoro.shortBreakDuration, pomodoro.longBreakDuration]);

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
        const duration = pomodoro.focusDuration;
        const now = Date.now();
        const activeMinutes = Math.max(1, Math.round((activeSecondsRef.current || duration * 60) / 60));
        void focusService.completeSession({
          type: 'focus',
          duration: Math.min(duration, activeMinutes),
          activityId: focusTarget?.activityId,
          taskId: focusTarget?.taskId,
          startTime: sessionStartRef.current ? new Date(sessionStartRef.current).toISOString() : undefined,
          endTime: new Date(now).toISOString(),
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
    return 'break' as PomodoroMode;
  }, [clearTimer, focusTarget?.activityId, focusTarget?.taskId, pomodoro]);

  const startTimer = useCallback(() => {
    if (runningRef.current || remainingRef.current <= 0) return;
    const now = Date.now();
    if (modeRef.current === 'focus' && sessionStartRef.current === null) sessionStartRef.current = now;
    lastTickRef.current = now;
    endTimeRef.current = now + remainingRef.current * 1000;
    runningRef.current = true;
    setIsRunning(true);
  }, []);

  const startWithSeconds = useCallback((seconds: number) => {
    if (runningRef.current || seconds <= 0) return;
    const now = Date.now();
    if (modeRef.current === 'focus' && sessionStartRef.current === null) sessionStartRef.current = now;
    setTimeRemaining(seconds);
    lastTickRef.current = now;
    endTimeRef.current = now + seconds * 1000;
    runningRef.current = true;
    setIsRunning(true);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
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
  }, [isRunning, transition, clearTimer, pomodoro.autoStartBreaks, pomodoro.autoStartFocus, getDuration, startWithSeconds]);

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
  }, [clearTimer, isRunning, timeRemaining]);

  const reset = useCallback(() => {
    clearTimer();
    runningRef.current = false;
    setIsRunning(false);
    setTimeRemaining(getDuration(modeRef.current) * 60);
    activeSecondsRef.current = 0;
    sessionStartRef.current = null;
  }, [clearTimer, getDuration]);

  const skip = useCallback(() => {
    const wasRunning = isRunning;
    if (wasRunning) pause(); else clearTimer();
    // Skipping never creates a completed focus session.
    const previous = modeRef.current;
    transition(false);
    if ((previous === 'focus' && pomodoro.autoStartBreaks) || (previous !== 'focus' && pomodoro.autoStartFocus)) {
      const seconds = previous === 'focus'
        ? getDuration(cycleRef.current + 1 >= pomodoro.sessionsBeforeLongBreak ? 'longBreak' : 'shortBreak') * 60
        : getDuration('focus') * 60;
      window.setTimeout(() => startWithSeconds(seconds), 0);
    }
  }, [clearTimer, getDuration, isRunning, pause, pomodoro.autoStartBreaks, pomodoro.autoStartFocus, transition]);

  const switchMode = useCallback((newMode: PomodoroMode) => {
    clearTimer();
    runningRef.current = false;
    setIsRunning(false);
    setMode(newMode);
    setTimeRemaining(getDuration(newMode) * 60);
    activeSecondsRef.current = 0;
    sessionStartRef.current = null;
  }, [clearTimer, getDuration]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return {
    mode,
    timeRemaining,
    isRunning,
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
