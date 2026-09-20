import {
  mockActivities, mockDailyRecords, mockFocusSessions, mockSoundPresets, defaultSettings,
} from '@/data/mockData';
import type { Activity, DailyRecord, Task, FocusSession, SoundPreset, AppSettings, ActivityStatus } from '@/types';

class DataStore {
  activities: Activity[] = mockActivities.map((a) => ({ ...a }));
  dailyRecords: Record<string, DailyRecord> = Object.fromEntries(
    Object.entries(mockDailyRecords).map(([k, v]) => [k, { ...v, activities: { ...v.activities } }])
  );
  tasks: Task[] = []; // Tasks are now API-backed, initialized empty here
  focusSessions: FocusSession[] = mockFocusSessions.map((s) => ({ ...s }));
  soundPresets: SoundPreset[] = mockSoundPresets.map((p) => ({ ...p, sounds: { ...p.sounds } }));
  settings: AppSettings = JSON.parse(JSON.stringify(defaultSettings));

  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  getDay(date: string): DailyRecord | undefined {
    return this.dailyRecords[date];
  }

  getOrCreateDay(date: string): DailyRecord {
    const existing = this.dailyRecords[date];
    if (existing) return existing;
    const now = new Date().toISOString();
    const day: DailyRecord = { id: `day-${date}`, date, activities: {}, diaryNote: '', createdAt: now, updatedAt: now };
    this.dailyRecords = { ...this.dailyRecords, [date]: day };
    return day;
  }

  setActivityStatus(date: string, activityId: string, status?: ActivityStatus): void {
    const oldDay = this.dailyRecords[date];
    const now = new Date().toISOString();
    const day = oldDay ?? { id: `day-${date}`, date, activities: {}, diaryNote: '', createdAt: now, updatedAt: now };
    const activities = { ...day.activities };
    if (!status) delete activities[activityId];
    else activities[activityId] = status;
    this.dailyRecords = { ...this.dailyRecords, [date]: { ...day, activities, updatedAt: now } };
    this.notify();
  }

  setDiaryNote(date: string, note: string): void {
    const oldDay = this.dailyRecords[date];
    const now = new Date().toISOString();
    const day = oldDay ?? { id: `day-${date}`, date, activities: {}, diaryNote: '', createdAt: now, updatedAt: now };
    this.dailyRecords = { ...this.dailyRecords, [date]: { ...day, diaryNote: note, updatedAt: now } };
    this.notify();
  }

  addActivity(activity: Activity): void { this.activities = [...this.activities, activity]; this.notify(); }
  updateActivity(id: string, data: Partial<Activity>): Activity | null {
    let updated: Activity | null = null;
    this.activities = this.activities.map((a) => {
      if (a.id !== id) return a;
      updated = { ...a, ...data };
      return updated;
    });
    this.notify();
    return updated;
  }
  removeActivity(id: string): boolean {
    const next = this.activities.filter((a) => a.id !== id);
    if (next.length === this.activities.length) return false;
    this.activities = next;
    // Historical daily records intentionally remain untouched.
    this.notify();
    return true;
  }

  addTask(task: Task): void { this.tasks = [...this.tasks, task]; this.notify(); }
  updateTask(id: string, data: Partial<Task>): Task | null {
    let updated: Task | null = null;
    this.tasks = this.tasks.map((t) => {
      if (t.id !== id) return t;
      updated = { ...t, ...data, tags: data.tags ? [...data.tags] : t.tags };
      return updated;
    });
    this.notify();
    return updated;
  }
  removeTask(id: string): boolean {
    const next = this.tasks.filter((t) => t.id !== id);
    if (next.length === this.tasks.length) return false;
    this.tasks = next; this.notify(); return true;
  }

  addFocusSession(session: FocusSession): void { this.focusSessions = [...this.focusSessions, session]; this.notify(); }
  addSoundPreset(preset: SoundPreset): void { this.soundPresets = [...this.soundPresets, preset]; this.notify(); }
  updateSoundPreset(id: string, data: Partial<SoundPreset>): SoundPreset | null {
    let updated: SoundPreset | null = null;
    this.soundPresets = this.soundPresets.map((p) => {
      if (p.id !== id) return p;
      updated = { ...p, ...data, sounds: data.sounds ? { ...data.sounds } : p.sounds };
      return updated;
    });
    this.notify(); return updated;
  }
  removeSoundPreset(id: string): boolean {
    const next = this.soundPresets.filter((p) => p.id !== id);
    if (next.length === this.soundPresets.length) return false;
    this.soundPresets = next; this.notify(); return true;
  }

  setSettings(settings: AppSettings): void { this.settings = settings; this.notify(); }
}

export const store = new DataStore();
