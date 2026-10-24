import api from './api';
export const bureauService = {
  list: () => api.get('/bureaus'),
  getOne: (id: number) => api.get(`/bureaus/${id}`),
  create: (data: Record<string, unknown>) => api.post('/bureaus', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/bureaus/${id}`, data),
  listCells: (bureau_id?: number) => api.get('/bureaus/cells', { params: bureau_id ? { bureau_id } : {} }),
  createCell: (data: Record<string, unknown>) => api.post('/bureaus/cells', data),
};

