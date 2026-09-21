/**
 * Central API client.
 *
 * - All requests go through `apiFetch` so token injection and
 *   401 handling live in exactly one place.
 * - The JWT is stored in localStorage under TOKEN_KEY.
 *   Reading/writing/clearing the token is only done here and in
 *   AuthContext — nowhere else in the codebase should touch storage.
 */

const BASE_URL = '/api';
const TOKEN_KEY = 'lt_token';

// ── Token helpers (package-private — used only by this module and AuthContext) ──

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Core fetch wrapper ──

type ApiError = {
  error: string;
};

/**
 * A callback that AuthContext registers so the API layer can trigger
 * a logout when it receives a 401 from the server (expired / invalid token).
 */
let onUnauthorized: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  ignoreUnauthorized: boolean = false,
): Promise<T> {
  const token = getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If ignoreUnauthorized is true (e.g., for login attempts), do NOT automatically logout
    if (!ignoreUnauthorized) {
      clearStoredToken();
      onUnauthorized?.();
      throw new Error('Session expired. Please log in again.');
    }
    // Otherwise, fall through to read error response body below
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as ApiError;
      if (body.error) message = body.error;
    } catch {
      // ignore parse errors — use the default message
    }
    throw new Error(message);
  }

  // 204 No Content — return undefined cast as T
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
