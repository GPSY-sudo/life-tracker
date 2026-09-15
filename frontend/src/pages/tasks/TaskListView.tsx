import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Pencil,
  Trash2,
  Calendar,
  RotateCcw,
  Play,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTasks, useActivities } from '@/hooks/useAppData';
import { useToast } from '@/hooks/useToast';
import { taskService } from '@/services/taskService';
import { TaskForm } from '@/components/TaskForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { todayISO, formatShortDate } from '@/utils/date';
import type { Task, TaskStatus, TaskPriority } from '@/types';

type Filter = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';

interface TaskListViewProps {
  onEditTask: (task: Task) => void;
  onAddTask: () => void;
  onStartFocus: (task: Task) => void;
}

export function TaskListView({ onEditTask, onAddTask, onStartFocus }: TaskListViewProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const tasks = useTasks();
  const activities = useActivities();

  const [filter, setFilter] = useState<Filter>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const todayStr = todayISO();

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Main filter
    switch (filter) {
      case 'today':
        result = result.filter((t) => t.dueDate === todayStr);
        break;
      case 'upcoming':
        result = result.filter((t) => t.dueDate && t.dueDate > todayStr && t.status !== 'completed');
        break;
      case 'overdue':
        result = result.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== 'completed');
        break;
      case 'completed':
        result = result.filter((t) => t.status === 'completed');
        break;
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    // Activity filter
    if (activityFilter !== 'all') {
      if (activityFilter === 'none') {
        result = result.filter((t) => !t.activityId);
      } else {
        result = result.filter((t) => t.activityId === activityFilter);
      }
    }

    // Sort: by priority then by due date
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    result.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });

    return result;
  }, [tasks, filter, priorityFilter, activityFilter, todayStr]);

  const handleToggleComplete = async (task: Task) => {
    if (task.status === 'completed') {
      await taskService.reopenTask(task.id);
      toast('Task reopened', 'info');
    } else {
      await taskService.completeTask(task.id);
      toast('Task completed', 'success');
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    await taskService.setStatus(taskId, status);
    toast('Status updated', 'success');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await taskService.deleteTask(deleteId);
    toast('Task deleted', 'success');
  };

  const getActivityName = (activityId?: string) => {
    if (!activityId) return null;
    return activities.find((a) => a.id === activityId)?.name;
  };

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'today', label: 'Today' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-ink-muted dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Secondary Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          className="input py-1.5 text-sm w-auto"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          className="input py-1.5 text-sm w-auto"
          value={activityFilter}
          onChange={(e) => setActivityFilter(e.target.value)}
        >
          <option value="all">All Activities</option>
          <option value="none">No Activity</option>
          {activities.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="card p-8">
          <EmptyState
            title="No tasks found"
            description="No tasks match your current filters. Try adjusting filters or add a new task."
            action={
              <button className="btn-primary px-4 py-2.5 text-sm" onClick={onAddTask}>
                Add Task
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => {
            const isOverdue = task.dueDate && task.dueDate < todayStr && task.status !== 'completed';
            const isToday = task.dueDate === todayStr;
            const activityName = getActivityName(task.activityId);

            return (
              <div
                key={task.id}
                className={`card p-4 ${task.status === 'completed' ? 'opacity-70' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleComplete(task)}
                    className="mt-0.5 shrink-0"
                    aria-label={task.status === 'completed' ? 'Reopen task' : 'Complete task'}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-success dark:text-green-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-ink-light dark:text-slate-500 hover:text-primary dark:hover:text-primary-300" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className={`text-sm font-medium ${task.status === 'completed' ? 'text-ink-muted dark:text-slate-500 line-through' : 'text-ink dark:text-slate-200'}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-xs text-ink-muted dark:text-slate-400 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onStartFocus(task)}
                          className="p-1.5 rounded-lg text-ink-light hover:text-primary dark:text-slate-500 dark:hover:text-primary-300"
                          aria-label="Start focus for this task"
                          title="Start Focus"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditTask(task)}
                          className="p-1.5 rounded-lg text-ink-light hover:text-primary dark:text-slate-500 dark:hover:text-primary-300"
                          aria-label="Edit task"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(task.id)}
                          className="p-1.5 rounded-lg text-ink-light hover:text-danger dark:text-slate-500 dark:hover:text-red-400"
                          aria-label="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <PriorityBadge priority={task.priority} />
                      {task.status !== 'completed' && <StatusBadge status={task.status} />}
                      {task.dueDate && (
                        <span className={`flex items-center gap-1 text-xs ${
                          isOverdue ? 'text-danger-text dark:text-red-400' : isToday ? 'text-warning-text dark:text-amber-400' : 'text-ink-muted dark:text-slate-400'
                        }`}>
                          {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                          {isOverdue ? 'Overdue' : isToday ? 'Due today' : `Due ${formatShortDate(task.dueDate)}`}
                          {task.dueTime && ` at ${task.dueTime}`}
                        </span>
                      )}
                      {activityName && (
                        <span className="badge bg-primary-50 text-primary dark:bg-primary/15 dark:text-primary-300">
                          {activityName}
                        </span>
                      )}
                      {task.tags.map((tag) => (
                        <span key={tag} className="badge bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Status selector */}
                    {task.status !== 'completed' && (
                      <div className="mt-2">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                          className="input py-1 text-xs w-auto"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
      />
    </div>
  );
}
