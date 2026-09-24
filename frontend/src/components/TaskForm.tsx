import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useActivities } from '@/hooks/useAppData';
import type { Task, TaskPriority, TaskStatus, TaskRecurrence } from '@/types';

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    dueDate?: string;
    dueTime?: string;
    priority: TaskPriority;
    status?: TaskStatus;
    recurrence: TaskRecurrence;
    activityId?: string;
    tags: string[];
  }) => void;
  task?: Task | null;
  defaultStatus?: TaskStatus;
}

export function TaskForm({ open, onClose, onSubmit, task, defaultStatus }: TaskFormProps) {
  const activities = useActivities();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('none');
  const [activityId, setActivityId] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? '');
      setDescription(task?.description ?? '');
      setDueDate(task?.dueDate ?? '');
      setDueTime(task?.dueTime ?? '');
      setPriority(task?.priority ?? 'medium');
      setStatus(task?.status ?? defaultStatus ?? 'todo');
      setRecurrence(task?.recurrence ?? 'none');
      setActivityId(task?.activityId ?? '');
      setTags(task?.tags?.join(', ') ?? '');
      setError('');
    }
  }, [open, task, defaultStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      priority,
      status,
      recurrence,
      activityId: activityId || null,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Edit Task' : 'Add Task'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="task-title">Title</label>
          <input
            id="task-title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Complete ML Assignment"
            autoFocus
          />
        </div>
        <div>
          <label className="label" htmlFor="task-desc">Description (optional)</label>
          <textarea
            id="task-desc"
            className="input min-h-[80px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details about this task..."
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="task-due-date">Due Date</label>
            <input
              id="task-due-date"
              type="date"
              className="input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="task-due-time">Due Time (optional)</label>
            <input
              id="task-due-time"
              type="time"
              className="input"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="task-priority">Priority</label>
            <select
              id="task-priority"
              className="input"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="task-status">Status</label>
            <select
              id="task-status"
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="task-recurrence">Recurrence</label>
            <select
              id="task-recurrence"
              className="input"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as TaskRecurrence)}
            >
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="task-activity">Linked Activity (optional)</label>
            <select
              id="task-activity"
              className="input"
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
            >
              <option value="">None</option>
              {activities.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="task-tags">Tags (comma-separated)</label>
          <input
            id="task-tags"
            className="input"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. college, ml, important"
          />
        </div>
        {error && <p className="text-xs sm:text-sm text-danger-text dark:text-red-400">{error}</p>}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end pt-2">
          <button type="button" className="btn-ghost px-3 sm:px-4 py-2 text-xs sm:text-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary px-3 sm:px-4 py-2 text-xs sm:text-sm">
            {task ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
