import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export function PublicNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Determine if we're on landing page
  const isLanding = location.pathname === '/';

  const handleLogoClick = () => {
    setMobileMenuOpen(false);
    if (isLanding) {
      // Scroll to top smoothly on landing page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Navigate to landing page from auth pages
      navigate('/');
    }
  };

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between py-3 md:py-4">
          {/* LEFT: Brand - Icon + Text */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
            aria-label="MiraiThread home"
          >
            <img 
              src="/miraithread-icon.png" 
              alt="MiraiThread" 
              className="h-7 w-7 md:h-8 md:w-8"
            />
            <span className="text-base md:text-lg font-bold text-slate-900 dark:text-white hidden sm:inline">MiraiThread</span>
          </button>
          
          {/* CENTER: Navigation - Only on Landing (Desktop) */}
          {isLanding && (
            <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
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
          
          {/* RIGHT: Actions - Desktop */}
          <div className="hidden sm:flex items-center gap-2 md:gap-4 flex-shrink-0">
            <button
              onClick={() => {
                navigate('/login');
                handleNavClick();
              }}
              className="btn-primary px-4 md:px-8 py-2 md:py-3 text-sm md:text-base font-semibold"
            >
              Login
            </button>
            <button
              onClick={() => {
                navigate('/register');
                handleNavClick();
              }}
              className="btn-primary px-4 md:px-8 py-2 md:py-3 text-sm md:text-base font-semibold whitespace-nowrap"
            >
              Start
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden flex-shrink-0 p-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-slate-900 dark:text-white" />
            ) : (
              <Menu className="w-5 h-5 text-slate-900 dark:text-white" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && isLanding && (
          <div className="sm:hidden border-t border-slate-200 dark:border-slate-800 py-3 space-y-3">
            <a
              href="#features"
              onClick={handleNavClick}
              className="block text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium px-4"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={handleNavClick}
              className="block text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium px-4"
            >
              How It Works
            </a>
            <div className="flex gap-2 px-4">
              <button
                onClick={() => {
                  navigate('/login');
                  handleNavClick();
                }}
                className="btn-primary flex-1 px-3 py-2 text-sm font-semibold"
              >
                Login
              </button>
              <button
                onClick={() => {
                  navigate('/register');
                  handleNavClick();
                }}
                className="btn-primary flex-1 px-3 py-2 text-sm font-semibold"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
