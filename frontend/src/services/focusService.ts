import { apiFetch } from './api';
import type { FocusSession, FocusSessionType } from '@/types';

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const focusService = {
  async getSessions(): Promise<FocusSession[]> {
    return apiFetch<FocusSession[]>('/focus/sessions');
  },

  async getTodaySessions(): Promise<FocusSession[]> {
    const sessions = await apiFetch<FocusSession[]>('/focus/sessions');
    const today = toISODate(new Date());
    return sessions.filter((s) => s.date === today && s.type === 'focus');
  },

  async getSessionsForDate(date: string): Promise<FocusSession[]> {
    const sessions = await apiFetch<FocusSession[]>('/focus/sessions');
    return sessions.filter((s) => s.date === date);
  },

  async completeSession(data: {
    type: FocusSessionType;
    duration: number;
    activityId?: string;
    taskId?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<FocusSession> {
    const now = data.endTime ? new Date(data.endTime) : new Date();
    const start = data.startTime ? new Date(data.startTime) : new Date(now.getTime() - data.duration * 60 * 1000);
    
    const payload = {
      type: data.type,
      duration: data.duration,
      startTime: start.toISOString(),
      endTime: now.toISOString(),
      ...(data.activityId && { activityId: data.activityId }),
      ...(data.taskId && { taskId: data.taskId }),
    };

    return apiFetch<FocusSession>('/focus/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getFocusStats(): Promise<{
    todayPomodoros: number;
    todayFocusMinutes: number;
    weekPomodoros: number;
    weekFocusMinutes: number;
  }> {
    const sessions = await apiFetch<FocusSession[]>('/focus/sessions');
    const today = toISODate(new Date());
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = toISODate(weekAgo);

    const todaySessions = sessions.filter((s) => s.date === today && s.type === 'focus');
    const weekSessions = sessions.filter(
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
