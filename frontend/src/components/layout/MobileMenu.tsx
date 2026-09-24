import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  Target,
  BookOpen,
  BarChart3,
  Settings,
  ListChecks,
  X,
  LogOut,
  Menu,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/today', label: 'Today', icon: CalendarDays },
  { to: '/activities', label: 'Activity Tracker', icon: CheckSquare },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/focus', label: 'Focus', icon: Target },
  { to: '/diary', label: 'Diary', icon: BookOpen },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  function handleLogout() {
    setOpen(false);
    logout();
  }

  return (
    <>
      {/* Hamburger Button - Left aligned with logo and branding */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-xl text-ink dark:text-slate-200 min-w-[44px] min-h-[44px] justify-center sm:justify-start"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 shrink-0" />
      </button>

      {/* Mobile Header Branding - Shows logo + name + tagline */}
      <div className="md:hidden flex-1 flex flex-col min-w-0 px-2 sm:px-3">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <img src="/miraithread-icon.png" alt="MiraiThread" className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
          <span className="font-semibold text-sm sm:text-base text-ink dark:text-white truncate">MiraiThread</span>
        </div>
        <p className="text-xs sm:text-xs text-ink-muted dark:text-slate-400 truncate">
          Connect your days. Shape your future.
        </p>
      </div>

      {/* Mobile Menu Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 animate-fade-in md:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-64 bg-surface-card dark:bg-surface-dark-card p-4 animate-slide-in-right flex flex-col overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <img src="/miraithread-icon.png" alt="MiraiThread" className="h-6 w-6" />
                <span className="font-semibold text-ink dark:text-white">MiraiThread</span>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="min-w-[44px] min-h-[44px] flex items-center justify-center">
                <X className="w-5 h-5 text-ink-muted dark:text-slate-400" />
              </button>
            </div>

            {/* Logged-in Username */}
            {user && (
              <p className="text-xs text-ink dark:text-slate-200 px-3 py-2 truncate mb-3 font-medium" title={user.email}>
                {user.name}
              </p>
            )}

            {/* Navigation Items + Logout */}
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
              
              {/* Logout as part of navigation */}
              <button
                onClick={handleLogout}
                className="btn btn-ghost justify-start gap-2 w-full text-sm"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
