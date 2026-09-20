import { apiFetch } from './api';
import type { Activity } from '@/types';

export const activityService = {
  async getActivities(): Promise<Activity[]> {
    return apiFetch<Activity[]>('/activities');
  },

  async createActivity(data: {
    name: string;
    startDate?: string;
    endDate?: string | null;
    scheduledDays?: string[];
    pausePeriods?: Array<{ startDate: string; endDate: string; reason?: string }>;
  }): Promise<Activity> {
    return apiFetch<Activity>('/activities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateActivity(
    id: string,
    data: Partial<Pick<Activity, 'name' | 'startDate' | 'endDate' | 'scheduledDays' | 'pausePeriods'> & { endDate?: string | null }>,
  ): Promise<Activity> {
    return apiFetch<Activity>(`/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteActivity(id: string): Promise<void> {
    await apiFetch<{ message: string }>(`/activities/${id}`, {
      method: 'DELETE',
    });
  },
};
