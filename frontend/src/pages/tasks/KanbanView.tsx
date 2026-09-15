import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Calendar, AlertCircle, Play, GripVertical } from 'lucide-react';
import { useTasks, useActivities } from '@/hooks/useAppData';
import { useToast } from '@/hooks/useToast';
import { taskService } from '@/services/taskService';
import { PriorityBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { todayISO, formatShortDate } from '@/utils/date';
import type { Task, TaskStatus, TaskPriority } from '@/types';

const columns: { id: TaskStatus; label: string; accent: string }[] = [
  { id: 'todo', label: 'To Do', accent: 'border-slate-300 dark:border-slate-600' },
  { id: 'in_progress', label: 'In Progress', accent: 'border-primary' },
  { id: 'completed', label: 'Completed', accent: 'border-success' },
  { id: 'blocked', label: 'Blocked', accent: 'border-danger' },
];

interface KanbanViewProps {
  onEditTask: (task: Task) => void;
  onAddTask: (status?: TaskStatus) => void;
  onStartFocus: (task: Task) => void;
}

export function KanbanView({ onEditTask, onAddTask, onStartFocus }: KanbanViewProps) {
  const toast = useToast();
  const tasks = useTasks();
  const activities = useActivities();

  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'high' | 'today' | 'overdue'>('all');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [mobileColumn, setMobileColumn] = useState<TaskStatus>('todo');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  const todayStr = todayISO();

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (priorityFilter !== 'all') {
      result = result.filter((t) => t.priority === priorityFilter);
    }
    if (activityFilter !== 'all') {
      if (activityFilter === 'none') {
        result = result.filter((t) => !t.activityId);
      } else {
        result = result.filter((t) => t.activityId === activityFilter);
      }
    }
    switch (quickFilter) {
      case 'high':
        result = result.filter((t) => t.priority === 'high');
        break;
      case 'today':
        result = result.filter((t) => t.dueDate === todayStr);
        break;
      case 'overdue':
        result = result.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== 'completed');
        break;
    }
    return result;
  }, [tasks, priorityFilter, activityFilter, quickFilter, todayStr]);

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], completed: [], blocked: [] };
    for (const t of filteredTasks) {
      map[t.status].push(t);
    }
    return map;
  }, [filteredTasks]);

  const getActivityName = (activityId?: string) =>
    activityId ? activities.find((a) => a.id === activityId)?.name : null;

  const handleDrop = async (status: TaskStatus) => {
    if (!draggedId) return;
    const task = tasks.find((t) => t.id === draggedId);
    if (task && task.status !== status) {
      await taskService.setStatus(draggedId, status);
      toast(`Moved to ${columns.find((c) => c.id === status)?.label}`, 'success');
    }
    setDraggedId(null);
    setDragOverCol(null);
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    await taskService.setStatus(taskId, status);
    toast('Status updated', 'success');
  };

  const renderCard = (task: Task) => {
    const isOverdue = task.dueDate && task.dueDate < todayStr && task.status !== 'completed';
    const isToday = task.dueDate === todayStr;
    const activityName = getActivityName(task.activityId);

    return (
    <div
      key={task.id}
      draggable
      onDragStart={() => setDraggedId(task.id)}
      onDragEnd={() => { setDraggedId(null); setDragOverCol(null); }}
      className={`card p-3 cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${draggedId === task.id ? 'opacity-40' : ''}`}
    >
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <h4 className="text-sm font-medium text-ink dark:text-slate-200 flex-1">{task.title}</h4>
        <GripVertical className="w-4 h-4 text-ink-light dark:text-slate-600 shrink-0 mt-0.5" />
      </div>

      {task.description && (
        <p className="text-xs text-ink-muted dark:text-slate-400 mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span className={`flex items-center gap-0.5 text-xs ${isOverdue ? 'text-danger-text dark:text-red-400' : isToday ? 'text-warning-text dark:text-amber-400' : 'text-ink-muted dark:text-slate-400'}`}>
            {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
            {isOverdue ? 'Overdue' : isToday ? 'Today' : formatShortDate(task.dueDate)}
          </span>
        )}
        {activityName && (
          <span className="badge bg-primary-50 text-primary dark:bg-primary/15 dark:text-primary-300 text-[10px]">{activityName}</span>
        )}
      </div>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.map((tag) => (
            <span key={tag} className="badge bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 text-[10px]">{tag}</span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 pt-1 border-t border-slate-100 dark:border-slate-700/50">
        <button onClick={() => onStartFocus(task)} className="p-1 rounded text-ink-light hover:text-primary dark:text-slate-500 dark:hover:text-primary-300" aria-label="Start focus">
          <Play className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onEditTask(task)} className="p-1 rounded text-ink-light hover:text-primary dark:text-slate-500 dark:hover:text-primary-300" aria-label="Edit task">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1" />
        <select
          value={task.status}
          onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
          className="text-xs bg-transparent text-ink-muted dark:text-slate-400 border-0 focus:outline-none cursor-pointer"
          aria-label="Change status"
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>
    </div>
    );
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(['all', 'high', 'today', 'overdue'] as const).map((qf) => (
          <button
            key={qf}
            onClick={() => setQuickFilter(qf)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              quickFilter === qf ? 'bg-primary text-white' : 'bg-slate-100 text-ink-muted dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {qf === 'high' ? 'High Priority' : qf === 'today' ? 'Due Today' : qf === 'overdue' ? 'Overdue' : 'All'}
          </button>
        ))}
        <select className="input py-1.5 text-sm w-auto" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}>
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select className="input py-1.5 text-sm w-auto" value={activityFilter} onChange={(e) => setActivityFilter(e.target.value)}>
          <option value="all">All Activities</option>
          <option value="none">No Activity</option>
          {activities.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      {/* Mobile: Column tabs */}
      <div className="md:hidden mb-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {columns.map((col) => (
            <button
              key={col.id}
              onClick={() => setMobileColumn(col.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                mobileColumn === col.id ? 'bg-primary text-white' : 'bg-slate-100 text-ink-muted dark:bg-slate-700 dark:text-slate-400'
              }`}
            >
              {col.label} ({tasksByStatus[col.id].length})
            </button>
          ))}
        </div>
        <div className="space-y-2 mt-3">
          {tasksByStatus[mobileColumn].length === 0 ? (
            <div className="card p-6">
              <EmptyState title="No tasks" description={`No tasks in ${columns.find((c) => c.id === mobileColumn)?.label}`} />
            </div>
          ) : (
            tasksByStatus[mobileColumn].map(renderCard)
          )}
          <button
            onClick={() => onAddTask(mobileColumn)}
            className="btn-secondary w-full py-2.5 text-sm"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Desktop: 4 columns */}
      <div className="hidden md:grid grid-cols-4 gap-4">
        {columns.map((col) => (
          <div
            key={col.id}
            onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
            onDrop={() => handleDrop(col.id)}
            className={`rounded-2xl border-t-2 ${col.accent} bg-slate-50 dark:bg-slate-800/50 p-3 min-h-[200px] transition-colors ${dragOverCol === col.id ? 'bg-primary-50 dark:bg-primary/10' : ''}`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-ink dark:text-slate-200">{col.label}</h3>
              <span className="text-xs text-ink-muted dark:text-slate-400 bg-white dark:bg-slate-700 px-2 py-0.5 rounded-full">
                {tasksByStatus[col.id].length}
              </span>
            </div>
            <div className="space-y-2">
              {tasksByStatus[col.id].map(renderCard)}
            </div>
            <button
              onClick={() => onAddTask(col.id)}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs text-ink-muted dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Task
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
