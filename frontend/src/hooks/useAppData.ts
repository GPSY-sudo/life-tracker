import { useEffect, useSyncExternalStore, useState } from 'react';
import { store } from '@/services/store';
import { activityService } from '@/services/activityService';
import { taskService } from '@/services/taskService';
import { focusService } from '@/services/focusService';
import { soundService } from '@/services/soundService';
import { appPreferenceService } from '@/services/appPreferenceService';
import type { Activity, Task, FocusSession, SoundPreset, AppSettings, DailyRecord, ActivityStatus } from '@/types';

// ============================================================
// API-backed Activity state
// ============================================================

let apiActivities: Activity[] = [];
let apiActivitiesListeners: Set<() => void> = new Set();

function notifyActivitiesChange() {
  apiActivitiesListeners.forEach((listener) => listener());
}

function subscribeToActivitiesChange(listener: () => void): () => void {
  apiActivitiesListeners.add(listener);
  return () => apiActivitiesListeners.delete(listener);
}

export async function loadActivitiesFromAPI(): Promise<void> {
  try {
    const activities = await activityService.getActivities();
    apiActivities = activities;
    // Sync into store for analytics compatibility
    store.activities = activities.map((a) => ({ ...a }));
    notifyActivitiesChange();
  } catch (error) {
    console.error('Failed to load activities:', error);
    throw error;
  }
}

// ============================================================
// API-backed DailyRecord state (keyed by date)
// ============================================================

let apiDailyRecords: Record<string, DailyRecord> = {};
let apiDailyRecordsListeners: Set<() => void> = new Set();

function notifyDailyRecordsChange() {
  apiDailyRecordsListeners.forEach((listener) => listener());
}

function subscribeToDailyRecordsChange(listener: () => void): () => void {
  apiDailyRecordsListeners.add(listener);
  return () => apiDailyRecordsListeners.delete(listener);
}

/**
 * Load DailyRecords for a date range from the API.
 * Also generate synthetic stubs for dates without records.
 * Sync into store for analytics compatibility.
 */
export async function loadDailyRecordsForRange(
  startDate: string,
  endDate: string,
): Promise<void> {
  try {
    const records = await __dailyService.getDays(startDate, endDate);
    const result: Record<string, DailyRecord> = {};

    // Generate date range
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const found = records.find((r) => r.date === dateStr);
      if (found) {
        result[dateStr] = found;
      } else {
        // Synthetic stub for missing dates
        result[dateStr] = {
          id: `day-${dateStr}`,
          date: dateStr,
          activities: {},
          diaryNote: '',
        };
      }
    }

    // Merge with existing records to preserve previously loaded diary entries
    apiDailyRecords = { ...apiDailyRecords, ...result };
    // Sync into store for analytics compatibility
    store.dailyRecords = { ...apiDailyRecords };
    notifyDailyRecordsChange();
  } catch (error) {
    console.error('Failed to load daily records:', error);
    throw error;
  }
}

/**
 * Update a single day's activity status in the API.
 * Sync the result back into the local state and store.
 */
export async function updateActivityStatusAndSync(
  date: string,
  activityId: string,
  status: ActivityStatus | undefined,
): Promise<DailyRecord> {
  try {
    const updated = await __dailyService.updateActivityStatus(date, activityId, status);
    // Create a new reference to trigger useSyncExternalStore updates
    apiDailyRecords = { ...apiDailyRecords, [date]: updated };
    store.dailyRecords[date] = updated;
    notifyDailyRecordsChange();
    return updated;
  } catch (error) {
    console.error('Failed to update activity status:', error);
    throw error;
  }
}

/**
 * Update a diary note for a day in the API.
 * Sync the result back into the local state and store.
 * Preserves existing activity statuses.
 */
export async function updateDiaryNoteAndSync(date: string, note: string, mood?: string): Promise<DailyRecord> {
  try {
    const updated = await diaryService.saveDiary(date, note, mood);
    // Create a new reference to trigger useSyncExternalStore updates
    apiDailyRecords = { ...apiDailyRecords, [date]: updated };
    store.dailyRecords[date] = updated;
    notifyDailyRecordsChange();
    return updated;
  } catch (error) {
    console.error('Failed to update diary note:', error);
    throw error;
  }
}

/**
 * Syncs a single activity into local state and store.
 * Used after create/update/delete operations.
 * Always creates new array references for immutability.
 * When deleting, also removes from activity order.
 */
export function syncActivityToState(activity: Activity | null, deleteId?: string): void {
  if (deleteId) {
    apiActivities = apiActivities.filter((a) => a.id !== deleteId);
    // Also remove from activity order if present
    const newOrder = store.settings.activityOrder.filter((id) => id !== deleteId);
    if (newOrder.length !== store.settings.activityOrder.length) {
      store.setSettings({ ...store.settings, activityOrder: newOrder });
      // Persist updated order to backend
      appPreferenceService.updateAppPreferences({ activityOrder: newOrder }).catch((error) => {
        console.error('Failed to persist activity order after deletion:', error);
      });
    }
  } else if (activity) {
    const idx = apiActivities.findIndex((a) => a.id === activity.id);
    if (idx >= 0) {
      // Replace existing activity with new array reference
      apiActivities = [...apiActivities.slice(0, idx), activity, ...apiActivities.slice(idx + 1)];
    } else {
      // Add new activity with new array reference
      apiActivities = [...apiActivities, activity];
    }
  }
  // Sync into store for analytics compatibility
  store.activities = apiActivities.map((a) => ({ ...a }));
  notifyActivitiesChange();
}

// ============================================================
// Import services for internal use
// ============================================================

import { dailyService as __dailyService } from '@/services/dailyService';
import { diaryService } from '@/services/diaryService';

// ============================================================
// Hooks for consumers
// ============================================================

function useStoreData<T>(selector: () => T): T {
  return useSyncExternalStore((cb) => store.subscribe(cb), selector, selector);
}

/**
 * useActivities — returns API-backed activities
 */
export function useActivities(): Activity[] {
  return useSyncExternalStore(subscribeToActivitiesChange, () => apiActivities, () => apiActivities);
}

// ============================================================
// API-backed Task state
// ============================================================

let apiTasks: Task[] = [];
let apiTasksListeners: Set<() => void> = new Set();

function notifyTasksChange() {
  apiTasksListeners.forEach((listener) => listener());
}

function subscribeToTasksChange(listener: () => void): () => void {
  apiTasksListeners.add(listener);
  return () => apiTasksListeners.delete(listener);
}

export async function loadTasksFromAPI(): Promise<void> {
  try {
    const tasks = await taskService.getTasks();
    apiTasks = tasks;
    // Sync into store for analytics compatibility
    store.tasks = tasks.map((t) => ({ ...t }));
    notifyTasksChange();
  } catch (error) {
    console.error('Failed to load tasks:', error);
    throw error;
  }
}

/**
 * Syncs a single task into local state and store.
 * Used after create/update/delete operations.
 * Always creates new array references for immutability.
 */
export function syncTaskToState(task: Task | null, deleteId?: string): void {
  if (deleteId) {
    apiTasks = apiTasks.filter((t) => t.id !== deleteId);
  } else if (task) {
    const idx = apiTasks.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      // Replace existing task with new array reference
      apiTasks = [...apiTasks.slice(0, idx), task, ...apiTasks.slice(idx + 1)];
    } else {
      // Add new task with new array reference
      apiTasks = [...apiTasks, task];
    }
  }
  // Sync into store for analytics compatibility
  store.tasks = apiTasks.map((t) => ({ ...t }));
  notifyTasksChange();
}

/**
 * useTasks — returns API-backed tasks
 */
export function useTasks(): Task[] {
  return useSyncExternalStore(subscribeToTasksChange, () => apiTasks, () => apiTasks);
}

// ============================================================
// API-backed FocusSession state
// ============================================================

let apiFocusSessions: FocusSession[] = [];
let apiFocusSessionsListeners: Set<() => void> = new Set();

function notifyFocusSessionsChange() {
  apiFocusSessionsListeners.forEach((listener) => listener());
}

function subscribeToFocusSessionsChange(listener: () => void): () => void {
  apiFocusSessionsListeners.add(listener);
  return () => apiFocusSessionsListeners.delete(listener);
}

export async function loadFocusSessionsFromAPI(): Promise<void> {
  try {
    const sessions = await focusService.getSessions();
    apiFocusSessions = sessions;
    // Sync into store for analytics compatibility
    store.focusSessions = sessions.map((s) => ({ ...s }));
    notifyFocusSessionsChange();
  } catch (error) {
    console.error('Failed to load focus sessions:', error);
    throw error;
  }
}

/**
 * Syncs a single focus session into local state.
 * Used after a session is created.
 */
export function syncFocusSessionToState(session: FocusSession): void {
  const idx = apiFocusSessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    apiFocusSessions = [...apiFocusSessions.slice(0, idx), session, ...apiFocusSessions.slice(idx + 1)];
  } else {
    apiFocusSessions = [...apiFocusSessions, session];
  }
  // Sync into store for analytics compatibility
  store.focusSessions = apiFocusSessions.map((s) => ({ ...s }));
  notifyFocusSessionsChange();
}

/**
 * useFocusSessions — returns API-backed focus sessions
 */
export function useFocusSessions(): FocusSession[] {
  return useSyncExternalStore(subscribeToFocusSessionsChange, () => apiFocusSessions, () => apiFocusSessions);
}

/**
 * Load sound preferences from the API and sync to store.
 * Fetches user-specific preferences saved on the backend.
 * Also loads custom presets from backend and merges with built-in presets.
 */
export async function loadSoundPreferencesFromAPI(): Promise<void> {
  try {
    const preferences = await soundService.getPreferences();
    // Sync into store
    store.setSettings({
      ...store.settings,
      sounds: preferences,
    });
    
    // Merge custom presets from backend with built-in presets
    if (preferences.customPresets && Array.isArray(preferences.customPresets)) {
      // Keep built-in presets, add custom presets
      const builtInPresets = store.soundPresets.filter((p) => p.isBuiltIn);
      const customPresets = preferences.customPresets.map((p) => ({
        ...p,
        isBuiltIn: false,
      }));
      store.soundPresets = [...builtInPresets, ...customPresets];
      store.notify();
    }
  } catch (error) {
    console.error('Failed to load sound preferences:', error);
    // Do not throw — allow app to continue with default preferences
    // The soundService already has fallback logic to return store settings
  }
}

/**
 * useSoundPresets — remains on the store (unchanged for Phase 2A)
 */
export function useSoundPresets(): SoundPreset[] {
  return useStoreData(() => store.soundPresets);
}

/**
 * Load app preferences (theme, Pomodoro settings, and activity order) from the API and sync to store.
 */
export async function loadAppPreferencesFromAPI(): Promise<void> {
  try {
    const preferences = await appPreferenceService.getAppPreferences();
    store.setSettings({
      ...store.settings,
      theme: preferences.theme,
      pomodoro: preferences.pomodoro,
      activityOrder: preferences.activityOrder || [],
    });
  } catch (error) {
    console.error('Failed to load app preferences:', error);
    // Do not throw — allow app to continue with default preferences
  }
}

/**
 * useDailyRecord — returns API-backed daily records for a specific date
 */
export function useDailyRecord(date: string): DailyRecord | undefined {
  return useSyncExternalStore(
    subscribeToDailyRecordsChange,
    () => apiDailyRecords[date],
    () => apiDailyRecords[date],
  );
}

/**
 * useAllDailyRecords — returns all currently loaded API-backed daily records
 */
export function useAllDailyRecords(): Record<string, DailyRecord> {
  return useSyncExternalStore(
    subscribeToDailyRecordsChange,
    () => apiDailyRecords,
    () => apiDailyRecords,
  );
}

/**
 * useSettings — remains on the store (unchanged for Phase 2A)
 */
export function useSettings(): AppSettings {
  return useStoreData(() => store.settings);
}

export function useTheme() {
  const settings = useSettings();
  useEffect(() => {
    const applyTheme = (mode: typeof settings.theme) => {
      const isDark =
        mode === 'dark' ||
        (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', isDark);
    };
    applyTheme(settings.theme);
    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [settings.theme]);
  return settings.theme;
}

export function setTheme(theme: AppSettings['theme']) {
  store.setSettings({ ...store.settings, theme });
  // Async save to backend without blocking UI
  appPreferenceService.updateAppPreferences({ theme }).catch((error) => {
    console.error('Failed to persist theme preference:', error);
  });
}

export function updatePomodoroSettings(data: Partial<AppSettings['pomodoro']>) {
  const updated = { ...store.settings.pomodoro, ...data };
  store.setSettings({ ...store.settings, pomodoro: updated });
  // Async save to backend without blocking UI
  appPreferenceService.updateAppPreferences({ pomodoro: updated }).catch((error) => {
    console.error('Failed to persist Pomodoro settings:', error);
  });
}

export function updateSoundPreferences(data: Partial<AppSettings['sounds']>) {
  const updated = { ...store.settings.sounds, ...data };
  store.setSettings({ ...store.settings, sounds: updated });
  // Async save to backend without blocking UI
  soundService.savePreferences(updated).catch((error) => {
    console.error('Failed to persist sound preferences:', error);
  });
}

/**
 * Reorder activities by moving one up or down.
 * Updates local state immediately, then persists to backend.
 * Handles edge cases: invalid indices, activities not in order, deleted activities.
 */
export function reorderActivity(activityId: string, direction: 'up' | 'down'): void {
  let newOrder = [...store.settings.activityOrder];
  
  // Get all activity IDs currently in the system
  const allActivityIds = new Set(apiActivities.map((a) => a.id));
  
  // Remove any stale IDs (activities that no longer exist)
  newOrder = newOrder.filter((id) => allActivityIds.has(id));
  
  // Add any new activities not in the order (append to end)
  for (const activity of apiActivities) {
    if (!newOrder.includes(activity.id)) {
      newOrder.push(activity.id);
    }
  }
  
  const currentIndex = newOrder.indexOf(activityId);
  if (currentIndex === -1) {
    console.warn(`Activity ${activityId} not found in order list`);
    return;
  }
  
  // Check bounds
  if (direction === 'up' && currentIndex === 0) {
    return; // Already at top
  }
  if (direction === 'down' && currentIndex === newOrder.length - 1) {
    return; // Already at bottom
  }
  
  // Perform swap
  const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  [newOrder[currentIndex], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[currentIndex]];
  
  // Update local state immediately (optimistic)
  store.setSettings({ ...store.settings, activityOrder: newOrder });
  
  // Persist to backend without blocking
  appPreferenceService.updateAppPreferences({ activityOrder: newOrder }).catch((error) => {
    console.error('Failed to persist activity order:', error);
    // Revert local state on error
    store.setSettings({ ...store.settings, activityOrder: store.settings.activityOrder });
  });
}

/**
 * Apply activity order to a list of activities.
 * If no custom order exists, returns activities in their current order.
 * Handles missing/stale activity IDs gracefully.
 */
export function applyActivityOrder(activities: Activity[]): Activity[] {
  const order = store.settings.activityOrder;
  
  // If no custom order, return as-is
  if (!order || order.length === 0) {
    return activities;
  }
  
  // Create a map for O(1) lookup
  const orderMap = new Map(order.map((id, idx) => [id, idx]));
  
  // Sort activities according to custom order, then by original order for unordered items
  const sorted = [...activities].sort((a, b) => {
    const indexA = orderMap.get(a.id) ?? Infinity;
    const indexB = orderMap.get(b.id) ?? Infinity;
    
    // Both in order
    if (indexA !== Infinity && indexB !== Infinity) {
      return indexA - indexB;
    }
    
    // One in order, one not
    if (indexA !== Infinity) return -1;
    if (indexB !== Infinity) return 1;
    
    // Neither in order - preserve original order
    return activities.indexOf(a) - activities.indexOf(b);
  });
  
  return sorted;
}
