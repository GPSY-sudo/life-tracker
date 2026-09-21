/**
 * Pomodoro state persistence using browser localStorage.
 * 
 * Stores only the ACTIVE logical Pomodoro session (running or paused).
 * Does NOT store completed FocusSession objects.
 * 
 * localStorage key: 'life-tracker:pomodoro-active'
 * 
 * Persisted during:
 * - Timer RUNNING
 * - Timer PAUSED (with session state intact)
 * 
 * Cleared when:
 * - Session ends (reset, skip, completion)
 * - No active logical session
 */

import type { PomodoroMode } from '@/types';

export const POMODORO_STORAGE_KEY = 'life-tracker:pomodoro-active';

export interface PersistedPomodoroState {
  mode: PomodoroMode;
  timeRemaining: number;
  isRunning: boolean;
  currentSession: number;
  completedThisCycle: number;
  sessionStartTime: number | null;
  focusActivityId?: string;
  focusTaskId?: string;
  // Timestamp when state was persisted (for calculating elapsed time on restore)
  persistedAt: number;
}

/**
 * Serialize Pomodoro state to JSON for localStorage.
 * Includes current timestamp for calculating elapsed time on restore.
 */
export function serializePomodoroState(state: {
  mode: PomodoroMode;
  timeRemaining: number;
  isRunning: boolean;
  currentSession: number;
  completedThisCycle: number;
  sessionStartTime: number | null;
  focusActivityId?: string;
  focusTaskId?: string;
}): PersistedPomodoroState {
  return {
    ...state,
    persistedAt: Date.now(),
  };
}

/**
 * Load Pomodoro state from localStorage.
 * Returns null if no state exists or if parse fails.
 */
export function loadPomodoroStateFromStorage(): PersistedPomodoroState | null {
  try {
    const stored = localStorage.getItem(POMODORO_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as PersistedPomodoroState;
    return parsed;
  } catch (error) {
    console.error('Failed to load Pomodoro state from storage:', error);
    return null;
  }
}

/**
 * Save Pomodoro state to localStorage.
 * For RUNNING sessions: includes sessionStartTime so elapsed time can be calculated on restore.
 * For PAUSED sessions: includes sessionStartTime and timeRemaining (which is NOT reduced on restore).
 */
export function savePomodoroStateToStorage(state: {
  mode: PomodoroMode;
  timeRemaining: number;
  isRunning: boolean;
  currentSession: number;
  completedThisCycle: number;
  sessionStartTime: number | null;
  focusActivityId?: string;
  focusTaskId?: string;
}): void {
  try {
    const serialized = serializePomodoroState(state);
    localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(serialized));
  } catch (error) {
    console.error('Failed to save Pomodoro state to storage:', error);
  }
}

/**
 * Clear persisted Pomodoro state from localStorage.
 * Called when session ends (reset, skip, completion).
 */
export function clearPomodoroStateFromStorage(): void {
  try {
    localStorage.removeItem(POMODORO_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear Pomodoro state from storage:', error);
  }
}
