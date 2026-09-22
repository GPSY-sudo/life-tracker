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
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center gap-2 px-3 py-2 rounded-xl text-ink dark:text-slate-200"
        aria-label="Open menu"
      >
        <img src="/miraithread-icon.png" alt="MiraiThread" className="h-6 w-6" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 animate-fade-in md:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-64 bg-surface-card dark:bg-surface-dark-card p-4 animate-slide-in-right flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <img src="/miraithread-icon.png" alt="MiraiThread" className="h-6 w-6" />
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="w-5 h-5 text-ink-muted dark:text-slate-400" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 flex-1">
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
            </nav>
            <div className="flex flex-col gap-1 pt-2 border-t border-slate-200 dark:border-slate-700">
              {user && (
                <p className="text-xs text-ink-muted dark:text-slate-500 px-3 py-1 truncate" title={user.email}>
                  {user.name}
                </p>
              )}
              <button
                onClick={handleLogout}
                className="btn btn-ghost justify-start gap-2 w-full text-sm"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
