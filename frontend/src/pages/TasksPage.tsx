import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Columns, Plus } from 'lucide-react';
import { useTasks, loadTasksFromAPI, syncTaskToState } from '@/hooks/useAppData';
import { useToast } from '@/hooks/useToast';
import { taskService } from '@/services/taskService';
import { PageHeader } from '@/components/ui/PageHeader';
import { TaskForm } from '@/components/TaskForm';
import { TaskListView } from './tasks/TaskListView';
import { KanbanView } from './tasks/KanbanView';
import type { Task, TaskStatus } from '@/types';

export function TasksPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const tasks = useTasks();

  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus | undefined>(undefined);
  const [focusTask, setFocusTask] = useState<Task | null>(null);

  // Load tasks on mount
  useEffect(() => {
    loadTasksFromAPI().catch((err) => {
      console.error('Failed to load tasks:', err);
      toast('Failed to load tasks', 'error');
    });
  }, [toast]);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleAddTask = (status?: TaskStatus) => {
    setEditingTask(null);
    setDefaultStatus(status);
    setFormOpen(true);
  };

  const handleStartFocus = (task: Task) => {
    setFocusTask(task);
    navigate('/focus');
  };

  const handleSubmit = async (data: Parameters<typeof taskService.createTask>[0]) => {
    try {
      if (editingTask) {
        const updated = await taskService.updateTask(editingTask.id, data);
        syncTaskToState(updated);
        toast('Task updated', 'success');
      } else {
        const created = await taskService.createTask(data);
        syncTaskToState(created);
        toast('Task added', 'success');
      }
    } catch (err) {
      toast('Failed to save task', 'error');
      console.error(err);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Tasks"
        subtitle={`${tasks.length} total tasks`}
        actions={
          <>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  view === 'list' ? 'bg-surface-card dark:bg-surface-dark-card text-primary dark:text-primary-300 shadow-sm' : 'text-ink-muted dark:text-slate-400'
                }`}
              >
                <List className="w-4 h-4" /> List
              </button>
              <button
                onClick={() => setView('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  view === 'kanban' ? 'bg-surface-card dark:bg-surface-dark-card text-primary dark:text-primary-300 shadow-sm' : 'text-ink-muted dark:text-slate-400'
                }`}
              >
                <Columns className="w-4 h-4" /> Kanban
              </button>
            </div>
            <button className="btn-primary px-4 py-2.5 text-sm" onClick={() => handleAddTask()}>
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </>
        }
      />

      {view === 'list' ? (
        <TaskListView onEditTask={handleEditTask} onAddTask={() => handleAddTask()} onStartFocus={handleStartFocus} />
      ) : (
        <KanbanView onEditTask={handleEditTask} onAddTask={handleAddTask} onStartFocus={handleStartFocus} />
      )}

      <TaskForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingTask(null); setDefaultStatus(undefined); }}
        task={editingTask}
        defaultStatus={defaultStatus}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
