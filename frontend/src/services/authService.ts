import { apiFetch, setStoredToken, clearStoredToken } from './api';
import type { AuthResponse, User } from '@/types';

export const authService = {
  /**
   * POST /api/auth/register
   * Stores the returned JWT and returns the auth payload.
   * Errors are passed through without auto-logout.
   */
  async register(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const result = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true); // ignoreUnauthorized: true for registration attempts
    setStoredToken(result.token);
    return result;
  },

  /**
   * POST /api/auth/login
   * Stores the returned JWT and returns the auth payload.
   * Errors (including 401) are passed through without auto-logout.
   */
  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const result = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true); // ignoreUnauthorized: true for login attempts
    setStoredToken(result.token);
    return result;
  },

  /**
   * GET /api/auth/me
   * Returns the current authenticated user. Requires a valid token.
   */
  async getMe(): Promise<User> {
    return apiFetch<User>('/auth/me');
  },

  /**
   * PUT /api/auth/change-password
   * Changes the user's password. Requires current and new passwords.
   */
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<User> {
    return apiFetch<User>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * DELETE /api/auth/profile
   * Deletes the user's account and all associated data.
   */
  async deleteAccount(): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/auth/profile', {
      method: 'DELETE',
    });
  },

  /**
   * Clears the stored token. No backend call needed — JWT is stateless.
   */
  logout(): void {
    clearStoredToken();
  },
};
