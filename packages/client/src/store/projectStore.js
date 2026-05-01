import { create } from 'zustand';
import * as projectApi from '../api/projectApi';

export const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const res = await projectApi.getProjects();
      set({ projects: res.data.data.projects });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load projects' });
    } finally {
      set({ loading: false });
    }
  },

  fetchProject: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await projectApi.getProject(id);
      set({ currentProject: res.data.data.project });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load project' });
    } finally {
      set({ loading: false });
    }
  },

  createProject: async (data) => {
    const res = await projectApi.createProject(data);
    const project = res.data.data.project;
    set((state) => ({ projects: [project, ...state.projects] }));
    return project;
  },

  updateProject: async (id, data) => {
    const res = await projectApi.updateProject(id, data);
    const updated = res.data.data.project;
    set((state) => ({
      projects: state.projects.map((p) => (p._id === id ? updated : p)),
      currentProject: updated,
    }));
    return updated;
  },

  deleteProject: async (id) => {
    await projectApi.deleteProject(id);
    set((state) => ({ projects: state.projects.filter((p) => p._id !== id) }));
  },
}));
