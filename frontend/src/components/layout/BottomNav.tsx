import { NavLink } from 'react-router-dom';
import { CalendarDays, CheckSquare, Target, ListChecks, BarChart3 } from 'lucide-react';

const bottomNavItems = [
  { to: '/today', label: 'Today', icon: CalendarDays },
  { to: '/activities', label: 'Tracker', icon: CheckSquare },
  { to: '/focus', label: 'Focus', icon: Target },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-card dark:bg-surface-dark-card border-t border-slate-200 dark:border-slate-700 px-2 py-1.5 flex justify-around items-center">
      {bottomNavItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-[44px] min-h-[44px] justify-center ${
              isActive
                ? 'text-primary dark:text-primary-300'
                : 'text-ink-light dark:text-slate-500'
            }`
          }
        >
          <item.icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
