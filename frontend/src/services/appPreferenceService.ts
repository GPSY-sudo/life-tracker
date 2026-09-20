import { apiFetch } from './api';
import type { AppSettings } from '@/types';

interface AppPreferenceResponse {
  id: string;
  theme: AppSettings['theme'];
  pomodoro: AppSettings['pomodoro'];
}

export const appPreferenceService = {
  /**
   * GET /api/preferences/app
   * Fetches the user's app preferences (theme and Pomodoro settings)
   */
  async getAppPreferences(): Promise<AppPreferenceResponse> {
    return apiFetch<AppPreferenceResponse>('/preferences/app');
  },

  /**
   * PUT /api/preferences/app
   * Updates the user's app preferences (theme and/or Pomodoro settings)
   */
  async updateAppPreferences(data: {
    theme?: AppSettings['theme'];
    pomodoro?: Partial<AppSettings['pomodoro']>;
  }): Promise<AppPreferenceResponse> {
    return apiFetch<AppPreferenceResponse>('/preferences/app', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
