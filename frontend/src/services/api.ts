import axios from 'axios';

const API_BASE = '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('acta_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('acta_token');
      localStorage.removeItem('acta_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { email: string; name: string; password: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  
  me: () => api.get('/auth/me'),
};

// Meetings API
export const meetingsApi = {
  create: (data: any) => api.post('/meetings', data),
  
  getAll: (params?: { type?: string; search?: string; page?: number }) =>
    api.get('/meetings', { params }),
  
  getById: (id: string) => api.get(`/meetings/${id}`),
  
  update: (id: string, data: any) => api.put(`/meetings/${id}`, data),
  
  delete: (id: string) => api.delete(`/meetings/${id}`),
  
  generateMom: (id: string) => api.post(`/meetings/${id}/generate`),
  
  downloadPdf: (id: string) => api.get(`/meetings/${id}/pdf`, { responseType: 'blob' }),
  
  downloadDocx: (id: string) => api.get(`/meetings/${id}/docx`, { responseType: 'blob' }),
};

// Action Items API
export const actionItemsApi = {
  getMy: () => api.get('/action-items/my'),
  
  getAssignedByMe: () => api.get('/action-items/assigned-by-me'),
  
  getAll: (params?: { status?: string; priority?: string }) =>
    api.get('/action-items', { params }),
  
  updateStatus: (id: string, status: string) =>
    api.patch(`/action-items/${id}/status`, { status }),
  
  update: (id: string, data: any) => api.put(`/action-items/${id}`, data),
};

// Dashboard API
export const dashboardApi = {
  getMy: () => api.get('/dashboard/my'),
  
  getStats: () => api.get('/dashboard/stats'),
};

// Notifications API
export const notificationsApi = {
  getMy: () => api.get('/notifications'),
  
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  
  markAllRead: () => api.patch('/notifications/read-all'),
};

// Transcription API
export const transcribeApi = {
  upload: (file: File, meetingId?: string) => {
    const formData = new FormData();
    formData.append('audio', file);
    if (meetingId) formData.append('meeting_id', meetingId);
    return api.post('/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
