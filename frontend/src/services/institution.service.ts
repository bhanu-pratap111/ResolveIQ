import api from './api';
export const institutionService = {
  list: (params?: Record<string, string | number>) => api.get('/institutions', { params }),
  getOne: (id: number) => api.get(`/institutions/${id}`),
  get360: (id: number) => api.get(`/institutions/${id}/360`),
  create: (data: Record<string, unknown>) => api.post('/institutions', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/institutions/${id}`, data),
};

