import api from './api';

export const analyticsService = {
  getDashboard: (params?: Record<string, string>) => api.get('/analytics/dashboard', { params }),
  getBureauStats: (params?: Record<string, string>) => api.get('/analytics/bureau-stats', { params }),
  getComplaintTrends: (months?: number) => api.get('/analytics/complaint-trends', { params: { months } }),
  getCategoryDistribution: () => api.get('/analytics/category-distribution'),
  getStatusDistribution: () => api.get('/analytics/status-distribution'),
  getResolutionTime: () => api.get('/analytics/resolution-time'),
  getOfficerDashboard: () => api.get('/analytics/officer-dashboard'),
  getStudentDashboard: () => api.get('/analytics/student-dashboard'),
};

