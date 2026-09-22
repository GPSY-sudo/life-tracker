// ============================================================
// AUTH
// ============================================================

/** Matches the backend User response shape (password is never returned). */
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Shape returned by POST /api/auth/register and POST /api/auth/login */
export interface AuthResponse {
  id: string;
  name: string;
  email: string;
  token: string;
}

// ============================================================
// CORE DATA MODELS
// ============================================================

/** A missing entry in a daily record represents a not-recorded activity. */
export type ActivityStatus = 'partial' | 'completed' | 'incomplete';

export interface PausePeriod {
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface Activity {
  id: string;
  /** Present in backend responses but not used by the frontend. */
  userId?: string;
  name: string;
  startDate?: string; // ISO date string (YYYY-MM-DD)
  endDate?: string | null; // null = no end date, undefined/absent = same as null
  scheduledDays?: string[]; // ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  pausePeriods?: PausePeriod[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyActivityStatus {
  activityId: string;
  status: ActivityStatus;
}

export interface DailyRecord {
  id: string;
  date: string; // YYYY-MM-DD
  activities: Record<string, ActivityStatus>; // activityId -> status
  diaryNote: string;
  mood?: 'great' | 'good' | 'okay' | 'not_great' | 'bad'; // optional daily mood
  // Optional: absent in the backend's lazy stub when no DB row exists yet
  createdAt?: string;
  updatedAt?: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  priority: TaskPriority;
  status: TaskStatus;
  reminder?: string;
  recurrence: TaskRecurrence;
  activityId?: string; // optional link to an activity
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type FocusSessionType = 'focus' | 'shortBreak' | 'longBreak';

export interface FocusSession {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // ISO timestamp
  endTime: string; // ISO timestamp
  duration: number; // minutes
  type: FocusSessionType;
  activityId?: string;
  taskId?: string;
  wasLinked?: boolean; // true if originally linked to Activity/Task, false if Free Focus
}

// ============================================================
// FOCUS / POMODORO
// ============================================================

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export interface PomodoroSettings {
  focusDuration: number; // minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  playAmbienceDuringBreaks: boolean;
}

export interface PomodoroState {
  mode: PomodoroMode;
  timeRemaining: number; // seconds
  isRunning: boolean;
  currentSession: number; // 1-indexed
  totalSessions: number;
}

// ============================================================
// SOUND / AUDIO
// ============================================================

export type SoundId =
  | 'lofi'
  | 'rain'
  | 'thunderstorm'
  | 'ocean'
  | 'fireplace'
  | 'forest'
  | 'birds'
  | 'cafe'
  | 'train'
  | 'wind'
  | 'stream'
  | 'night'
  | 'keyboard'
  | 'library'
  | 'whiteNoise'
  | 'brownNoise'
  | 'pinkNoise';

export interface SoundDefinition {
  id: SoundId;
  label: string;
  icon: string; // emoji or lucide icon name
  category: 'music' | 'nature' | 'noise' | 'ambient';
}

export interface SoundState {
  enabled: boolean;
  volume: number; // 0-100
}

export interface SoundPreset {
  id: string;
  name: string;
  sounds: Record<string, number>; // soundId -> volume 0-100
  isBuiltIn: boolean;
}

export interface SoundPreferences {
  masterVolume: number; // 0-100
  enabledSounds: SoundId[];
  soundVolumes?: Record<string, number>; // soundId -> 0-100 (optional, defaults to {})
  selectedPreset?: string; // optional, defaults to 'preset-rainy-focus'
  customPresets?: Array<{
    id: string;
    name: string;
    sounds: Record<string, number>;
  }>; // User-created presets from backend
}

// ============================================================
// ANALYTICS
// ============================================================

export interface ActivityAnalytics {
  activityId: string;
  activityName: string;
  completionRate: number; // 0-100
  completedDays: number;
  partialDays: number;
  incompleteDays: number;
  activeDays: number;
  currentStreak: number;
  bestStreak: number;
  longestGap: number;
  startDate?: string;
  endDate?: string;
}

export interface TaskAnalytics {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  blocked: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  completionRate: number;
}

export interface FocusAnalytics {
  totalPomodoros: number;
  totalFocusTime: number; // minutes
  averageSession: number; // minutes
  focusToday: number; // minutes
  focusThisWeek: number; // minutes
  focusThisMonth: number; // minutes
  longestFocusDay: { date: string; minutes: number } | null;
  byActivity: Record<string, number>;
  byTask: Record<string, number>;
  dailyFocus: { date: string; minutes: number }[];
}

export interface DiaryAnalytics {
  daysWithEntries: number;
  diaryStreak: number;
  monthlyCount: number;
  diaryConsistency: number;
}

export interface MonthlyAnalytics {
  month: number;
  year: number;
  overallCompletion: number;
  previousMonthCompletion: number;
  improvement: number;
  activeDays: number;
  fullyCompletedDays: number;
  consistencyScore: number;
  activityAnalytics: ActivityAnalytics[];
  taskAnalytics: TaskAnalytics;
  focusAnalytics: FocusAnalytics;
  diaryAnalytics: DiaryAnalytics;
  dailyCompletion: { date: string; rate: number }[];
}

// ============================================================
// THEME
// ============================================================

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: ThemeMode;
  pomodoro: PomodoroSettings;
  sounds: SoundPreferences;
}
