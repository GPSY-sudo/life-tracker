import { apiFetch } from './api';
import type { DailyRecord, ActivityStatus } from '@/types';

export const dailyService = {
  /** GET /api/days/:date — returns real doc or the backend stub shape */
  async getDay(date: string): Promise<DailyRecord> {
    return apiFetch<DailyRecord>(`/days/${date}`);
  },

  /**
   * GET /api/days?start=YYYY-MM-DD&end=YYYY-MM-DD
   * Returns only dates that have an existing DailyRecord in the DB.
   * Dates with no record simply won't appear — callers must treat missing
   * dates as the empty stub: { activities: {}, diaryNote: '' }.
   */
  async getDays(startDate: string, endDate: string): Promise<DailyRecord[]> {
    return apiFetch<DailyRecord[]>(
      `/days?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`,
    );
  },

  /**
   * PUT /api/days/:date/activity/:activityId
   * Sends { status } — null/undefined means "not recorded" (removes the key).
   */
  async updateActivityStatus(
    date: string,
    activityId: string,
    status?: ActivityStatus,
  ): Promise<DailyRecord> {
    return apiFetch<DailyRecord>(`/days/${date}/activity/${activityId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: status ?? null }),
    });
  },

  /**
   * Applies the four-state cycle locally, then persists via updateActivityStatus.
   * Not recorded → partial → completed → incomplete → not recorded
   */
  async cycleActivityStatus(
    date: string,
    activityId: string,
    current?: ActivityStatus,
  ): Promise<ActivityStatus | undefined> {
    const next: ActivityStatus | undefined =
      !current
        ? 'partial'
        : current === 'partial'
          ? 'completed'
          : current === 'completed'
            ? 'incomplete'
            : undefined;
    await dailyService.updateActivityStatus(date, activityId, next);
    return next;
  },
};
