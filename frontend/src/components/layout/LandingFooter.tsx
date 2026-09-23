import { useNavigate, useLocation } from 'react-router-dom';

export function LandingFooter() {
  const navigate = useNavigate();
  const location = useLocation();

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
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 border-t border-slate-800 mt-20">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/miraithread-icon.png" alt="MiraiThread" className="h-8 w-8" />
              <span className="font-semibold text-white">MiraiThread</span>
            </div>
            <p className="text-sm text-slate-500">
              Connect your days. Shape your future.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => handleProductLinkClick('features')}
                  className="text-slate-400 hover:text-white transition-colors text-left"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleProductLinkClick('how-it-works')}
                  className="text-slate-400 hover:text-white transition-colors text-left"
                >
                  How It Works
                </button>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-3">Let's Start</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => navigate('/login')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Login
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/signup')}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Sign Up
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-3">Community</h4>
            <p className="text-sm text-slate-500">
              Built by people who believe in intentional living.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8">
          <p className="text-sm text-slate-500">© 2026 MiraiThread. Connect your days. Shape your future.</p>
        </div>
      </div>
    </footer>
  );
}
