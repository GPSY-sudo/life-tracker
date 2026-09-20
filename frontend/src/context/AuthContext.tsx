import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getStoredToken,
  clearStoredToken,
  registerUnauthorizedHandler,
} from '@/services/api';
import { authService } from '@/services/authService';
import { loadSoundPreferencesFromAPI, loadAppPreferencesFromAPI } from '@/hooks/useAppData';
import type { User, AuthResponse } from '@/types';

// ── Context shape ──────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** Authenticated user, or null when logged out. */
  user: User | null;
  /** True while the initial token validation is in flight. */
  isLoading: boolean;
  /** Call after a successful login/register — stores the user from the response. */
  handleAuthSuccess: (response: AuthResponse) => void;
  /** Clears auth state, removes the token, and redirects to /login. */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Clear state and redirect — used both for explicit logout and 401 responses.
  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  // Register the 401 handler with the API layer once on mount.
  useEffect(() => {
    registerUnauthorizedHandler(logout);
  }, [logout]);

  // On mount: if a token exists in storage, validate it by calling /api/auth/me.
  // This restores the session after a page refresh.
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    authService
      .getMe()
      .then((me) => {
        setUser(me);
        // Load user-specific preferences (sound, theme, Pomodoro) after authentication
        return Promise.all([
          loadSoundPreferencesFromAPI(),
          loadAppPreferencesFromAPI(),
        ]);
      })
      .catch(() => {
        // Token is stale or invalid — clear it silently.
        clearStoredToken();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []); // runs once on mount

  // Called by LoginPage / RegisterPage after a successful API response.
  const handleAuthSuccess = useCallback((response: AuthResponse) => {
    // Token is already stored by authService.login / authService.register.
    setUser({
      id: response.id,
      name: response.name,
      email: response.email,
    });
    // Load user-specific preferences (sound, theme, Pomodoro) after authentication
    Promise.all([
      loadSoundPreferencesFromAPI(),
      loadAppPreferencesFromAPI(),
    ]).catch((error) => {
      console.error('Failed to load preferences on login:', error);
      // Don't block the user from logging in if preferences fail to load
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, handleAuthSuccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
