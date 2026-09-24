import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function LandingFooter() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if dark class exists on html element
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    // Listen for changes to the dark class
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const handleProductLinkClick = (sectionId: string) => {
    if (location.pathname === '/') {
      // Already on landing page, scroll to section
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // On login/register, navigate to home
      navigate('/');
    }
  };

  return (
    <footer className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 mt-12 md:mt-20">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-2 md:mb-3">
              <img 
                src={isDark ? "/miraithread-logo-dark.png" : "/miraithread-logo-light.png"} 
                alt="MiraiThread" 
                className="h-8 md:h-10 w-auto"
              />
            </div>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-500">
              Connect your days. Shape your future.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-2 md:mb-3 text-sm md:text-base">Product</h4>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <li>
                <button
                  onClick={() => handleProductLinkClick('features')}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-left"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleProductLinkClick('how-it-works')}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-left"
                >
                  How It Works
                </button>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-2 md:mb-3 text-sm md:text-base">Let's Start</h4>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <li>
                <button
                  onClick={() => navigate('/login')}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Login
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/register')}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Sign Up
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <h4 className="font-semibold text-slate-900 dark:text-white mb-2 md:mb-3 text-sm md:text-base">Community</h4>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-500">
              Built by people who believe in intentional living.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 md:pt-8">
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-500">© 2026 MiraiThread. Connect your days. Shape your future.</p>
        </div>
      </div>
    </footer>
  );
}
