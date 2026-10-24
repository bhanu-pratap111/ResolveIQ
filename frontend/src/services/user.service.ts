import api from './api';
export const userService = {
  list: (params?: Record<string, string | number>) => api.get('/officers', { params }),
  create: (data: Record<string, unknown>) => api.post('/officers', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/officers/${id}`, data),
  resetPassword: (id: number, newPassword: string) =>
    api.post(`/officers/${id}/reset-password`, { newPassword }),
};
export const notificationService = {
  list: (params?: Record<string, number>) => api.get('/notifications', { params }),
  markRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};
export const settingService = {
  getAll: () => api.get('/settings'),
  getCategories: () => api.get('/settings/categories'),
  update: (key: string, value: string) => api.put(`/settings/${key}`, { value }),
};
export const auditService = {
  list: (params?: Record<string, string | number>) => api.get('/audit-logs', { params }),
  getActions: () => api.get('/audit-logs/actions'),
};
export const relatedCaseService = {
  confirm: (data: Record<string, unknown>) => api.post('/related-cases', data),
  getForComplaint: (id: number) => api.get(`/related-cases/${id}`),
};

