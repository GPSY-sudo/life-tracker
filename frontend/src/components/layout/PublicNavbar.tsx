import { useNavigate, useLocation } from 'react-router-dom';

export function PublicNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if we're on landing page
  const isLanding = location.pathname === '/';

  const handleLogoClick = () => {
    if (isLanding) {
      // Scroll to top smoothly on landing page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Navigate to landing page from auth pages
      navigate('/');
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid items-center py-4" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
          {/* LEFT: Brand - Icon + Text */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            aria-label="MiraiThread home"
          >
            <img 
              src="/miraithread-icon.png" 
              alt="MiraiThread" 
              className="h-8 w-8"
            />
            <span className="text-lg font-bold text-slate-900 dark:text-white">MiraiThread</span>
          </button>
          
          {/* CENTER: Navigation - Only on Landing */}
          {isLanding && (
            <div className="hidden md:flex items-center gap-8" style={{ justifySelf: 'center' }}>
              <a
                href="#features"
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
              >
                How It Works
              </a>
            </div>
          )}
          
          {/* RIGHT: Actions */}
          <div className="flex items-center gap-4" style={{ justifySelf: 'end' }}>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary px-8 py-3 text-base font-semibold"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary px-8 py-3 text-base font-semibold"
            >
              Start Your Journey
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
