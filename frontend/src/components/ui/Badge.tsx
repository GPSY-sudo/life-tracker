import type { TaskPriority, TaskStatus } from '@/types';

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  high: { label: 'High', className: 'bg-danger-soft text-danger-text dark:bg-red-900/30 dark:text-red-400' },
  medium: { label: 'Medium', className: 'bg-warning-soft text-warning-text dark:bg-amber-900/30 dark:text-amber-400' },
  low: { label: 'Low', className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
};

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  todo: { label: 'To Do', className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  in_progress: { label: 'In Progress', className: 'bg-primary-50 text-primary dark:bg-primary/15 dark:text-primary-300' },
  completed: { label: 'Completed', className: 'bg-success-soft text-success-text dark:bg-green-900/30 dark:text-green-400' },
  blocked: { label: 'Blocked', className: 'bg-danger-soft text-danger-text dark:bg-red-900/30 dark:text-red-400' },
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const cfg = priorityConfig[priority];
  return <span className={`badge ${cfg.className}`}>{cfg.label}</span>;
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const cfg = statusConfig[status];
  return <span className={`badge ${cfg.className}`}>{cfg.label}</span>;
}
