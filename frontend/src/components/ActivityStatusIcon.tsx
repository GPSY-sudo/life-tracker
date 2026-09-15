import { Check, X, Minus, CircleDashed } from 'lucide-react';
import type { ActivityStatus } from '@/types';

interface ActivityStatusIconProps {
  status?: ActivityStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function ActivityStatusIcon({ status, size = 'md' }: ActivityStatusIconProps) {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  };
  const iconSizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' };

  if (status === 'completed') {
    return (
      <div className={`${sizes[size]} rounded-full bg-success-soft dark:bg-green-900/30 flex items-center justify-center shrink-0`}>
        <Check className={`${iconSizes[size]} text-success-text dark:text-green-400`} />
      </div>
    );
  }

  if (status === 'incomplete') {
    return (
      <div className={`${sizes[size]} rounded-full bg-danger-soft dark:bg-red-900/30 flex items-center justify-center shrink-0`}>
        <X className={`${iconSizes[size]} text-danger-text dark:text-red-400`} />
      </div>
    );
  }

  if (status === 'partial') {
    return (
      <div className={`${sizes[size]} rounded-full bg-warning-soft dark:bg-amber-900/30 flex items-center justify-center shrink-0`} title="Partial">
        <CircleDashed className={`${iconSizes[size]} text-warning-text dark:text-amber-400`} />
      </div>
    );
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0`} title="Not recorded">
      <Minus className={`${iconSizes[size]} text-ink-light dark:text-slate-500`} />
    </div>
  );
}
