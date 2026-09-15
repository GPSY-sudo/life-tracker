import { store } from './store';
import type { Activity } from '@/types';

// Simulates async API calls. Each method returns a Promise
// to make swapping with real HTTP calls trivial later.

const delay = (ms = 50) => new Promise((r) => setTimeout(r, ms));

export const activityService = {
  async getActivities(): Promise<Activity[]> {
    await delay();
    return [...store.activities];
  },

  async createActivity(data: { name: string; startDate?: string; endDate?: string }): Promise<Activity> {
    await delay();
    const now = new Date().toISOString();
    const activity: Activity = {
      id: store.generateId('act'),
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      createdAt: now,
      updatedAt: now,
    };
    store.addActivity(activity);
    return activity;
  },

  async updateActivity(id: string, data: Partial<Pick<Activity, 'name' | 'startDate' | 'endDate'>>): Promise<Activity | null> {
    await delay();
    return store.updateActivity(id, { ...data, updatedAt: new Date().toISOString() });
  },

  async deleteActivity(id: string): Promise<boolean> {
    await delay();
    const idx = store.activities.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    return store.removeActivity(id);
  },
};
