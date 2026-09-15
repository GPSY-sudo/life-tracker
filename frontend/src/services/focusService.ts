import { store } from './store';
import type { FocusSession, FocusSessionType } from '@/types';

const delay = (ms = 50) => new Promise((r) => setTimeout(r, ms));

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const focusService = {
  async getSessions(): Promise<FocusSession[]> {
    await delay();
    return [...store.focusSessions];
  },

  async getTodaySessions(): Promise<FocusSession[]> {
    await delay();
    const today = toISODate(new Date());
    return store.focusSessions.filter((s) => s.date === today && s.type === 'focus');
  },

  async getSessionsForDate(date: string): Promise<FocusSession[]> {
    await delay();
    return store.focusSessions.filter((s) => s.date === date);
  },

  async completeSession(data: {
    type: FocusSessionType;
    duration: number;
    activityId?: string;
    taskId?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<FocusSession> {
    await delay();
    const now = data.endTime ? new Date(data.endTime) : new Date();
    const start = data.startTime ? new Date(data.startTime) : new Date(now.getTime() - data.duration * 60 * 1000);
    const session: FocusSession = {
      id: store.generateId('fs'),
      date: toISODate(now),
      startTime: start.toISOString(),
      endTime: now.toISOString(),
      duration: data.duration,
      type: data.type,
      activityId: data.activityId,
      taskId: data.taskId,
    };
    store.addFocusSession(session);
    return session;
  },

  async getFocusStats(): Promise<{
    todayPomodoros: number;
    todayFocusMinutes: number;
    weekPomodoros: number;
    weekFocusMinutes: number;
  }> {
    await delay();
    const today = toISODate(new Date());
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = toISODate(weekAgo);

    const todaySessions = store.focusSessions.filter((s) => s.date === today && s.type === 'focus');
    const weekSessions = store.focusSessions.filter(
      (s) => s.date >= weekAgoStr && s.date <= today && s.type === 'focus'
    );

    return {
      todayPomodoros: todaySessions.length,
      todayFocusMinutes: todaySessions.reduce((sum, s) => sum + s.duration, 0),
      weekPomodoros: weekSessions.length,
      weekFocusMinutes: weekSessions.reduce((sum, s) => sum + s.duration, 0),
    };
  },
};
