import axios from 'axios';
import { auth } from './firebase.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['x-user-id'] = user.uid;
  }
  return config;
});

// Applications
export const getApplications = (params) => api.get('/applications', { params });
export const getApplication = (id) => api.get(`/applications/${id}`);
export const createApplication = (data) => api.post('/applications', data);
export const updateApplication = (id, data) => api.put(`/applications/${id}`, data);
export const deleteApplication = (id) => api.delete(`/applications/${id}`);
export const getDashboardStats = () => api.get('/applications/stats');

// Agent
export const runFullAnalysis = (applicationId) => api.post(`/agent/analyze/${applicationId}`);
export const analyzeJob = (data) => api.post('/agent/analyze-job', data);
export const getInterviewQuestions = (applicationId) => api.get(`/agent/interview/${applicationId}`);
export const askCopilot = (question) => api.post('/agent/ask', { question });

// Resume
export const uploadResume = (formData) => api.post('/resume/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

// Profile
export const getProfile = () => api.get('/profile');
export const updateProfile = (data) => api.put('/profile', data);

// Notifications
export const getNotificationLogs = () => api.get('/notifications');

export default api;
