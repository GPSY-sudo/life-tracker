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
    
    // Compute date in local timezone (not UTC) to match frontend's date representation
    const endDate = toISODate(now);
    
    const payload = {
      type: data.type,
      duration: data.duration,
      date: endDate, // Include explicit local date to prevent UTC shift
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

  async updateTaskStatus(taskId: string, status: 'in_progress' | 'todo' | 'completed' | 'blocked'): Promise<void> {
    await apiFetch(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async updateActivityStatus(activityId: string, date: string, status: 'partial' | 'completed' | 'incomplete'): Promise<void> {
    // First check current status to prevent downgrading from completed
    try {
      const response = await apiFetch<any>(`/days/${date}`);
      const currentStatus = response.activities?.[activityId];
      
      // Don't downgrade from 'completed' status
      if (currentStatus === 'completed' && status !== 'completed') {
        console.log(`Activity ${activityId} already marked completed for ${date}, not downgrading to ${status}`);
        return;
      }
    } catch (error) {
      console.error('Failed to check current activity status:', error);
    }
    
    await apiFetch(`/days/${date}/activity/${activityId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
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
