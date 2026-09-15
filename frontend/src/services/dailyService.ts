import { store } from './store';
import type { DailyRecord, ActivityStatus } from '@/types';

const delay = (ms = 50) => new Promise((r) => setTimeout(r, ms));

export const dailyService = {
  async getDay(date: string): Promise<DailyRecord> {
    await delay();
    return store.getDay(date) ?? { id: `day-${date}`, date, activities: {}, diaryNote: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  },

  async getDays(startDate: string, endDate: string): Promise<DailyRecord[]> {
    await delay();
    const days: DailyRecord[] = [];
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const existing = store.getDay(dateStr);
      if (existing) days.push(existing);
    }
    return days;
  },

  async updateActivityStatus(date: string, activityId: string, status?: ActivityStatus): Promise<void> {
    await delay();
    store.setActivityStatus(date, activityId, status);
  },

  async cycleActivityStatus(date: string, activityId: string): Promise<ActivityStatus | undefined> {
    await delay();
    const day = store.getOrCreateDay(date);
    const current = day.activities[activityId];
    const next: ActivityStatus | undefined =
      !current ? 'partial' : current === 'partial' ? 'completed' : current === 'completed' ? 'incomplete' : undefined;
    store.setActivityStatus(date, activityId, next);
    return next;
  },
};
