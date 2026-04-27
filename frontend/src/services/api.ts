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

  verifyLogin2fa: (data: { user_id: string; otp: string }) =>
    api.post('/auth/verify-login-2fa', data),
  
  me: () => api.get('/auth/me'),
};

// Users API
export const usersApi = {
  getAll: (params?: { search?: string; team_id?: string }) => api.get('/users', { params }),
  updateProfile: (id: string, data: { name?: string; email?: string; two_factor_enabled?: boolean }) =>
    api.put(`/users/${id}`, data),
  uploadAvatar: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post(`/users/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
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
  
  downloadPdf: (id: string) => api.get(`/meetings/${id}/download/pdf`, { responseType: 'blob' }),
  
  downloadDocx: (id: string) => api.get(`/meetings/${id}/download/docx`, { responseType: 'blob' }),
};

// Action Items API
export const actionItemsApi = {
  getMy: () => api.get('/action-items/my'),
  
  getAssignedByMe: () => api.get('/action-items/assigned-by-me'),
  
  getAll: (params?: { status?: string; priority?: string }) =>
    api.get('/action-items', { params }),
  
  getById: (id: string) => api.get(`/action-items/${id}`),
  
  create: (data: any) => api.post('/action-items', data),
  
  update: (id: string, data: any) => api.put(`/action-items/${id}`, data),
  
  updateStatus: (id: string, status: string) =>
    api.patch(`/action-items/${id}/status`, { status }),
  
  delete: (id: string) => api.delete(`/action-items/${id}`),
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

// Teams API
export const teamsApi = {
  getAll: () => api.get('/teams'),
  getById: (id: string) => api.get(`/teams/${id}`),
  getMessages: (id: string) => api.get(`/teams/${id}/messages`),
  create: (data: { name: string; description?: string }) => api.post('/teams', data),
  addMember: (teamId: string, data: { user_id: string; role?: string }) =>
    api.post(`/teams/${teamId}/members`, data),
  removeMember: (teamId: string, userId: string) =>
    api.delete(`/teams/${teamId}/members/${userId}`),
};

// 2FA API
export const twoFaApi = {
  enableOtp: () => api.post('/2fa/enable-2fa'),
  verifyOtp: (otp: string) => api.post('/2fa/verify-2fa', { otp }),
  disable: () => api.post('/2fa/disable-2fa'),
};

export default api;
