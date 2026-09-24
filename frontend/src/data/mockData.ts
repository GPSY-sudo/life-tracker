import type {
  Activity,
  DailyRecord,
  Task,
  FocusSession,
  SoundPreset,
  AppSettings,
  ActivityStatus,
} from '@/types';

// ============================================================
// DATE HELPERS
// ============================================================

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISODate(d);
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

// ============================================================
// ACTIVITIES
// ============================================================

const activityDefs = [
  { name: 'DSA', startOffset: -30 },
  { name: 'Python', startOffset: -25 },
  { name: 'SQL', startOffset: -20 },
  { name: 'Exercise', startOffset: null },
  { name: 'Reading', startOffset: null },
  { name: 'College', startOffset: -15, endOffset: 10 },
  { name: 'Project', startOffset: -10 },
];

export const mockActivities: Activity[] = activityDefs.map((def, i) => {
  const now = new Date().toISOString();
  return {
    id: `act-${i + 1}`,
    name: def.name,
    startDate: def.startOffset !== null ? daysAgo(def.startOffset) : undefined,
    endDate: def.endOffset !== undefined ? daysFromNow(def.endOffset) : undefined,
    createdAt: now,
    updatedAt: now,
  };
});

// ============================================================
// DAILY RECORDS (activity statuses + diary)
// ============================================================

// Deterministic pseudo-random based on date+activity for stable mock data
function seededRandom(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h % 100) / 100;
}

function generateStatus(date: string, activity: Activity): ActivityStatus | undefined {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = date.split('-').map(Number);
  const dObj = new Date(year, month - 1, day);
  dObj.setHours(0, 0, 0, 0);

  // Check if date is within activity range
  if (activity.startDate && date < activity.startDate) {
    return undefined; // inactive - will be excluded in analytics
  }
  if (activity.endDate && date > activity.endDate) {
    return undefined;
  }

  // Future dates: empty
  if (dObj > today) {
    return undefined;
  }

  const seed = `${date}-${activity.id}`;
  const r = seededRandom(seed);

  // Different completion rates per activity
  const rates: Record<string, number> = {
    'act-1': 0.85, // DSA
    'act-2': 0.7, // Python
    'act-3': 0.6, // SQL
    'act-4': 0.75, // Exercise
    'act-5': 0.5, // Reading
    'act-6': 0.8, // College
    'act-7': 0.65, // Project
  };

  const rate = rates[activity.id] ?? 0.7;
  if (r < rate) return 'completed';
  if (r < rate + 0.1) return 'partial';
  if (r < rate + 0.25) return 'incomplete';
  return undefined;
}

function generateDailyRecords(): Record<string, DailyRecord> {
  const records: Record<string, DailyRecord> = {};
  const today = new Date();

  // Generate data for the last 75 days (covers current + previous month + some extra)
  for (let i = 75; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = toISODate(d);
    const activities: Record<string, ActivityStatus> = {};

    for (const activity of mockActivities) {
      const status = generateStatus(dateStr, activity);
      if (status) {
        activities[activity.id] = status;
      }
    }

    // Add diary entries on some days
    let diaryNote = '';
    const diaryChance = seededRandom(`diary-${dateStr}`);
    if (diaryChance < 0.4) {
      const diaryTemplates = [
        'Today I completed my DSA practice and worked on Python. Felt productive.',
        'Good focus session today. SQL queries are getting easier.',
        'Studied for college and worked on the project. Need to exercise more.',
        'Completed ML assignment. Reading session was short but helpful.',
        'Felt a bit unfocused today but managed to get some exercise in.',
        'Great day! Finished all activities except SQL. Will catch up tomorrow.',
        'Worked on the project all afternoon. DSA problems were challenging today.',
        'Quiet study day. Python practice went well.',
        'Completed most tasks. Took a long walk for exercise.',
        'Focused on DSA and Python today. Had a rest day.',
      ];
      const idx = Math.floor(seededRandom(`diary-text-${dateStr}`) * diaryTemplates.length);
      diaryNote = diaryTemplates[idx];
    }

    const now = new Date().toISOString();
    records[dateStr] = {
      id: `day-${dateStr}`,
      date: dateStr,
      activities,
      diaryNote,
      createdAt: now,
      updatedAt: now,
    };
  }

  // Ensure today has some specific data
  const todayStr = todayISO();
  if (records[todayStr]) {
    records[todayStr].activities = {
      'act-1': 'completed', // DSA
      'act-2': 'completed', // Python
      'act-3': 'incomplete', // SQL
      'act-4': 'completed', // Exercise
      // Reading - empty (not recorded yet)
    };
    records[todayStr].diaryNote = 'Started the day with DSA practice. Planning to work on the project this afternoon.';
  }

  return records;
}

export const mockDailyRecords: Record<string, DailyRecord> = generateDailyRecords();

// ============================================================
// TASKS
// ============================================================

const now = new Date().toISOString();

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Complete ML Assignment',
    description: 'Finish the machine learning assignment on linear regression.',
    dueDate: todayISO(),
    dueTime: '23:59',
    priority: 'high',
    status: 'in_progress',
    recurrence: 'none',
    activityId: 'act-6',
    tags: ['college', 'ml'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'task-2',
    title: 'Practice Python',
    description: 'Solve 5 Python coding problems on data structures.',
    dueDate: todayISO(),
    dueTime: '18:00',
    priority: 'medium',
    status: 'todo',
    recurrence: 'daily',
    activityId: 'act-2',
    tags: ['practice'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'task-3',
    title: 'Work on Project',
    description: 'Build the authentication module for the web project.',
    dueDate: daysFromNow(1),
    priority: 'high',
    status: 'in_progress',
    recurrence: 'none',
    activityId: 'act-7',
    tags: ['project', 'dev'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'task-4',
    title: 'Apply for Internship',
    description: 'Submit applications to 3 companies.',
    dueDate: daysFromNow(3),
    priority: 'medium',
    status: 'todo',
    recurrence: 'none',
    tags: ['career'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'task-5',
    title: 'DSA Practice',
    description: 'Solve 2 graph problems.',
    dueDate: daysAgo(1),
    priority: 'high',
    status: 'completed',
    recurrence: 'daily',
    activityId: 'act-1',
    tags: ['practice', 'dsa'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'task-6',
    title: 'SQL Revision',
    description: 'Review joins and subqueries.',
    dueDate: daysAgo(2),
    priority: 'medium',
    status: 'completed',
    recurrence: 'weekly',
    activityId: 'act-3',
    tags: ['sql', 'revision'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'task-7',
    title: 'NPTEL Course Week 5',
    description: 'Watch lectures and submit assignment.',
    dueDate: daysFromNow(5),
    priority: 'medium',
    status: 'blocked',
    recurrence: 'none',
    activityId: 'act-6',
    tags: ['nptel', 'course'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'task-8',
    title: 'Read Chapter 7',
    description: 'Read chapter 7 of the algorithms book.',
    dueDate: daysFromNow(2),
    priority: 'low',
    status: 'todo',
    recurrence: 'none',
    activityId: 'act-5',
    tags: ['reading'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'task-9',
    title: 'Waiting for API docs',
    description: 'Blocked until the backend team shares the API documentation.',
    dueDate: daysFromNow(7),
    priority: 'medium',
    status: 'blocked',
    recurrence: 'none',
    tags: ['project', 'blocked'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'task-10',
    title: 'Morning Exercise Routine',
    description: '30 minutes of cardio and stretching.',
    dueDate: todayISO(),
    priority: 'low',
    status: 'completed',
    recurrence: 'daily',
    activityId: 'act-4',
    tags: ['health'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'task-11',
    title: 'Weekly Review',
    description: 'Review progress and plan next week.',
    dueDate: daysFromNow(6),
    priority: 'medium',
    status: 'todo',
    recurrence: 'weekly',
    tags: ['planning'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'task-12',
    title: 'Database Schema Design',
    description: 'Design the MongoDB schema for the project.',
    dueDate: daysFromNow(4),
    priority: 'high',
    status: 'todo',
    recurrence: 'none',
    activityId: 'act-7',
    tags: ['project', 'database'],
    createdAt: now,
    updatedAt: now,
  },
];

// ============================================================
// FOCUS SESSIONS
// ============================================================

function generateFocusSessions(): FocusSession[] {
  const sessions: FocusSession[] = [];
  const today = new Date();
  let id = 1;

  // Generate sessions for the last 30 days
  for (let d = 30; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = toISODate(date);

    // 0-5 sessions per day, weighted toward 2-3
    const seed = seededRandom(`focus-${dateStr}`);
    let numSessions: number;
    if (seed < 0.1) numSessions = 0;
    else if (seed < 0.3) numSessions = 1;
    else if (seed < 0.6) numSessions = 2;
    else if (seed < 0.85) numSessions = 3;
    else numSessions = 4;

    // Don't generate future sessions
    if (d < 0) continue;

    let hour = 9;
    for (let s = 0; s < numSessions; s++) {
      const start = new Date(date);
      start.setHours(hour, 0, 0, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 25);

      const activityIds = ['act-1', 'act-2', 'act-3', 'act-7', 'act-6'];
      const activityId = activityIds[Math.floor(seededRandom(`fa-${dateStr}-${s}`) * activityIds.length)];
      const taskIds = ['task-1', 'task-2', 'task-3', 'task-5', undefined];
      const taskId = taskIds[Math.floor(seededRandom(`ft-${dateStr}-${s}`) * taskIds.length)];

      sessions.push({
        id: `fs-${id++}`,
        date: dateStr,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        duration: 25,
        type: 'focus',
        activityId,
        taskId,
      });

      hour += 1; // gap between sessions
    }
  }

  return sessions;
}

export const mockFocusSessions: FocusSession[] = generateFocusSessions();

// ============================================================
// SOUND PRESETS
// ============================================================

export const mockSoundPresets: SoundPreset[] = [
  {
    id: 'preset-rainy-focus',
    name: 'Rainy Focus',
    sounds: { rain: 70, thunderstorm: 20 },
    isBuiltIn: true,
  },
  {
    id: 'preset-lofi-focus',
    name: 'Lo-fi Focus',
    sounds: { lofi: 55, rain: 30 },
    isBuiltIn: true,
  },
  {
    id: 'preset-cafe-focus',
    name: 'Cafe Focus',
    sounds: { cafe: 60, keyboard: 25 },
    isBuiltIn: true,
  },
  {
    id: 'preset-nature-focus',
    name: 'Nature Focus',
    sounds: { forest: 60, birds: 40, wind: 30 },
    isBuiltIn: true,
  },
  {
    id: 'preset-cozy-focus',
    name: 'Cozy Focus',
    sounds: { fireplace: 55, rain: 45 },
    isBuiltIn: true,
  },
];

// ============================================================
// DEFAULT SETTINGS
// ============================================================

export const defaultSettings: AppSettings = {
  theme: 'system',
  pomodoro: {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
    autoStartBreaks: false,
    autoStartFocus: false,
    playAmbienceDuringBreaks: true,
  },
  sounds: {
    masterVolume: 70,
    enabledSounds: [],
    soundVolumes: {},
    selectedPreset: 'preset-rainy-focus',
  },
  activityOrder: [],
};

// ============================================================
// SOUND DEFINITIONS
// ============================================================

import type { SoundDefinition } from '@/types';

export const soundDefinitions: SoundDefinition[] = [
  { id: 'lofi', label: 'Lo-fi', icon: '🎵', category: 'music' },
  { id: 'rain', label: 'Rain', icon: '🌧️', category: 'nature' },
  { id: 'thunderstorm', label: 'Thunderstorm', icon: '⛈️', category: 'nature' },
  { id: 'ocean', label: 'Ocean', icon: '🌊', category: 'nature' },
  { id: 'fireplace', label: 'Fireplace', icon: '🔥', category: 'ambient' },
  { id: 'forest', label: 'Forest', icon: '🌲', category: 'nature' },
  { id: 'birds', label: 'Birds', icon: '🐦', category: 'nature' },
  { id: 'cafe', label: 'Cafe', icon: '☕', category: 'ambient' },
  { id: 'train', label: 'Train', icon: '🚂', category: 'ambient' },
  { id: 'wind', label: 'Wind', icon: '💨', category: 'nature' },
  { id: 'stream', label: 'Stream', icon: '🏞️', category: 'nature' },
  { id: 'night', label: 'Night', icon: '🌙', category: 'nature' },
  { id: 'keyboard', label: 'Keyboard', icon: '⌨️', category: 'ambient' },
  { id: 'library', label: 'Library', icon: '📚', category: 'ambient' },
  { id: 'whiteNoise', label: 'White Noise', icon: '⚪', category: 'noise' },
  { id: 'brownNoise', label: 'Brown Noise', icon: '🟤', category: 'noise' },
  { id: 'pinkNoise', label: 'Pink Noise', icon: '🩷', category: 'noise' },
];
