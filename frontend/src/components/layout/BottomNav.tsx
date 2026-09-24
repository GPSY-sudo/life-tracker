import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, CheckSquare, Target, ListChecks, BarChart3, Settings } from 'lucide-react';

const bottomNavItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/today', label: 'Today', icon: CalendarDays },
  { to: '/activities', label: 'Tracker', icon: CheckSquare },
  { to: '/focus', label: 'Focus', icon: Target },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-card dark:bg-surface-dark-card border-t border-slate-200 dark:border-slate-700 py-1.5">
      {/* Horizontal scrollable container for bottom nav items */}
      <div className="flex overflow-x-auto snap-x snap-mandatory px-1 scrollbar-hide">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-[56px] min-h-[56px] justify-center shrink-0 snap-center ${
                isActive
                  ? 'text-primary dark:text-primary-300'
                  : 'text-ink-light dark:text-slate-500'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium text-center">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
