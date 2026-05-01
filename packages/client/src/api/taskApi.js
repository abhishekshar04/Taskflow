import api from './axios';

export const getDashboardStats = () => api.get('/tasks/dashboard');
export const getTasksByProject = (projectId) => api.get(`/tasks/project/${projectId}`);
export const getTask = (id) => api.get(`/tasks/${id}`);
export const createTask = (projectId, data) => api.post(`/tasks/project/${projectId}`, data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);
export const updateTaskStatus = (id, status) => api.patch(`/tasks/${id}/status`, { status });
