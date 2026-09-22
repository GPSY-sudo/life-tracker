import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component handles scroll behavior on route changes.
 * - For routes without hash: scrolls to top
 * - For routes with hash: lets browser handle native anchor scrolling
 */
export function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    // Only scroll to top if there's no hash (no anchor navigation)
    if (!location.hash) {
      window.scrollTo({ top: 0, left: 0 });
    }
  }, [location.pathname]); // Re-run only when pathname changes, not hash

  return null;
}
