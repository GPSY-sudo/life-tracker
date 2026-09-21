import { apiFetch } from './api';
import type { Task, TaskStatus, TaskPriority, TaskRecurrence } from '@/types';

export const taskService = {
  async getTasks(): Promise<Task[]> {
    return apiFetch<Task[]>('/tasks');
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
    return apiFetch<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTask(id: string, data: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task | null> {
    return apiFetch<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteTask(id: string): Promise<boolean> {
    await apiFetch<{ message: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    });
    return true;
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
