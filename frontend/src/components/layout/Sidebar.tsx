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
} from 'lucide-react';

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
  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-slate-200 dark:border-slate-700 bg-surface-card dark:bg-surface-dark-card p-4">
      <div className="flex items-center gap-2 px-3 py-4 mb-2">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
          <Target className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-ink dark:text-slate-100">Life Tracker</span>
      </div>
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
      </nav>
      <div className="px-3 py-2 text-xs text-ink-light dark:text-slate-500">
        Frontend demo with mock data
      </div>
    </aside>
  );
}
