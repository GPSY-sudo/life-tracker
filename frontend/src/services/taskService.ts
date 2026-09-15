import { store } from './store';
import type { Task, TaskStatus, TaskPriority, TaskRecurrence } from '@/types';

const delay = (ms = 50) => new Promise((r) => setTimeout(r, ms));

export const taskService = {
  async getTasks(): Promise<Task[]> {
    await delay();
    return [...store.tasks];
  },

  async createTask(data: {
    title: string;
    description?: string;
    dueDate?: string;
    dueTime?: string;
    priority: TaskPriority;
    status?: TaskStatus;
    recurrence?: TaskRecurrence;
    activityId?: string;
    tags?: string[];
  }): Promise<Task> {
    await delay();
    const now = new Date().toISOString();
    const task: Task = {
      id: store.generateId('task'),
      title: data.title,
      description: data.description ?? '',
      dueDate: data.dueDate,
      dueTime: data.dueTime,
      priority: data.priority,
      status: data.status ?? 'todo',
      recurrence: data.recurrence ?? 'none',
      activityId: data.activityId,
      tags: data.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    store.addTask(task);
    return task;
  },

  async updateTask(id: string, data: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task | null> {
    await delay();
    return store.updateTask(id, { ...data, updatedAt: new Date().toISOString() });
  },

  async deleteTask(id: string): Promise<boolean> {
    await delay();
    return store.removeTask(id);
  },

  async setStatus(id: string, status: TaskStatus): Promise<Task | null> {
    return this.updateTask(id, { status });
  },

  async completeTask(id: string): Promise<Task | null> {
    return this.setStatus(id, 'completed');
  },

  async reopenTask(id: string): Promise<Task | null> {
    return this.setStatus(id, 'todo');
  },
};
