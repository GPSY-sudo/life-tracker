import { apiFetch } from './api';
import type { DailyRecord } from '@/types';

export const diaryService = {
  /**
   * GET /api/days/:date
   * Fetch the daily record (including diary note) for a specific date.
   * Returns a lazy stub if no record exists in DB.
   */
  async getDiary(date: string): Promise<string> {
    const record = await apiFetch<DailyRecord>(`/days/${date}`);
    return record.diaryNote ?? '';
  },

  /**
   * PUT /api/days/:date/diary
   * Save a diary note for a specific date.
   * Backend creates the DailyRecord if needed, preserving existing activity statuses.
   */
  async saveDiary(date: string, note: string): Promise<DailyRecord> {
    return apiFetch<DailyRecord>(`/days/${date}/diary`, {
      method: 'PUT',
      body: JSON.stringify({ diaryNote: note }),
    });
  },

  /**
   * Check if a diary note exists for a date.
   * Requires the full daily record to check diaryNote content.
   */
  async hasDiary(date: string): Promise<boolean> {
    const record = await apiFetch<DailyRecord>(`/days/${date}`);
    return !!record && record.diaryNote.trim().length > 0;
  },
};
