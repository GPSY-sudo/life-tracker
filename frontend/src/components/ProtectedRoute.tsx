import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * Wraps routes that require authentication.
 * - While the initial token validation is in flight, renders nothing (avoids flash).
 * - Unauthenticated visitors are redirected to /login with the intended path saved
 *   in location state so they can be sent back after login if desired.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Avoid a flash of the login page while the token is being validated.
    return null;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
