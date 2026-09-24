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
  LogOut,
} from 'lucide-react';
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

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-slate-200 dark:border-slate-700 bg-surface-card dark:bg-surface-dark-card p-4">
      <div className="flex items-center gap-2.5 px-3 py-4 mb-6">
        <img src="/miraithread-icon.png" alt="MiraiThread" className="h-6 w-6 flex-shrink-0" />
        <span className="text-lg font-bold text-slate-100">MiraiThread</span>
      </div>

      {/* Logged-in Username */}
      {user && (
        <p className="text-xs text-ink dark:text-slate-200 px-3 py-2 truncate mb-3 font-medium" title={user.email}>
          {user.name}
        </p>
      )}

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* Logout as part of navigation */}
        <button
          onClick={logout}
          className="btn btn-ghost justify-start gap-2 w-full text-sm px-0"
          aria-label="Log out"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </nav>
    </aside>
  );
}
