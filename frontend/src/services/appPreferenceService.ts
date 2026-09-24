import { apiFetch } from './api';
import type { AppSettings } from '@/types';

interface AppPreferenceResponse {
  id: string;
  theme: AppSettings['theme'];
  pomodoro: AppSettings['pomodoro'];
  activityOrder: string[];
}

export const appPreferenceService = {
  /**
   * GET /api/preferences/app
   * Fetches the user's app preferences (theme, Pomodoro settings, and activity order)
   */
  async getAppPreferences(): Promise<AppPreferenceResponse> {
    return apiFetch<AppPreferenceResponse>('/preferences/app');
  },

  /**
   * PUT /api/preferences/app
   * Updates the user's app preferences (theme, Pomodoro settings, and/or activity order)
   */
  async updateAppPreferences(data: {
    theme?: AppSettings['theme'];
    pomodoro?: Partial<AppSettings['pomodoro']>;
    activityOrder?: string[];
  }): Promise<AppPreferenceResponse> {
    return apiFetch<AppPreferenceResponse>('/preferences/app', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
