import api from './api';

export const complaintService = {
  list: (params?: Record<string, string | number>) =>
    api.get('/complaints', { params }),
  getOne: (id: number) => api.get(`/complaints/${id}`),
  create: (data: FormData | Record<string, unknown>) =>
    api.post('/complaints', data),
  changeStatus: (id: number, status: string, reason?: string, notes?: string) =>
    api.post(`/complaints/${id}/status`, { status, reason, notes }),
  getTimeline: (id: number) => api.get(`/complaints/${id}/timeline`),
  getMessages: (id: number) => api.get(`/complaints/${id}/messages`),
  sendMessage: (id: number, message: string, message_type?: string, is_visible_to_student?: boolean) =>
    api.post(`/complaints/${id}/messages`, { message, message_type, is_visible_to_student }),
  getNotes: (id: number) => api.get(`/complaints/${id}/notes`),
  addNote: (id: number, note: string) => api.post(`/complaints/${id}/notes`, { note }),
  uploadEvidence: (id: number, file: File) => {
    const form = new FormData();
    form.append('evidence', file);
    return api.post(`/complaints/${id}/evidence`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  listEvidence: (id: number) => api.get(`/complaints/${id}/evidence`),
  getRelated: (id: number) => api.get(`/complaints/${id}/related`),
  resolve: (id: number, data: Record<string, string>) =>
    api.post(`/complaints/${id}/resolve`, data),
  getResolution: (id: number) => api.get(`/complaints/${id}/resolution`),
  updateAiSuggestion: (id: number, accepted: boolean, category_id?: number, bureau_id?: number) =>
    api.put(`/complaints/${id}/ai-suggestion`, { accepted, category_id, bureau_id }),
};

