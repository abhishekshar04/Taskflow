import { create } from 'zustand';
import * as taskApi from '../api/taskApi';
import socket from '../api/socket';

export const useTaskStore = create((set) => ({
  tasks: [],
  dashboardStats: null,
  loading: false,
  error: null,

  fetchDashboard: async () => {
    set({ loading: true });
    try {
      const res = await taskApi.getDashboardStats();
      set({ dashboardStats: res.data.data });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load dashboard' });
    } finally {
      set({ loading: false });
    }
  },

  fetchTasks: async (projectId) => {
    set({ loading: true });
    try {
      const res = await taskApi.getTasksByProject(projectId);
      set({ tasks: res.data.data.tasks });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load tasks' });
    } finally {
      set({ loading: false });
    }
  },

  createTask: async (projectId, data) => {
    const res = await taskApi.createTask(projectId, data);
    const task = res.data.data.task;
    set((state) => ({ tasks: [task, ...state.tasks] }));
    return task;
  },

  updateTaskStatus: async (id, status) => {
    const res = await taskApi.updateTaskStatus(id, status);
    const updated = res.data.data.task;
    set((state) => ({ tasks: state.tasks.map((t) => (t._id === id ? updated : t)) }));
    return updated;
  },

  updateTask: async (id, data) => {
    const res = await taskApi.updateTask(id, data);
    const updated = res.data.data.task;
    set((state) => ({ tasks: state.tasks.map((t) => (t._id === id ? updated : t)) }));
    return updated;
  },

  deleteTask: async (id) => {
    await taskApi.deleteTask(id);
    set((state) => ({ tasks: state.tasks.filter((t) => t._id !== id) }));
  },

  // Real-time updates
  handleTaskCreated: (task) => {
    set((state) => {
      if (state.tasks.some(t => t._id === task._id)) return state;
      return { tasks: [task, ...state.tasks] };
    });
  },
  
  handleTaskUpdated: (task) => {
    set((state) => ({ tasks: state.tasks.map((t) => (t._id === task._id ? task : t)) }));
  },
  
  handleTaskDeleted: (id) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t._id !== id) }));
  },
}));
