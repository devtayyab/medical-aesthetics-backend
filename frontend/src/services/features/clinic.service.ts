import { api } from '../client';

export const clinicService = {
  search: (params: {
    location?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => api.get('/clinics', { params: { ...params, search: params.search || (params as any).query } }),

  getById: (id: string) => api.get(`/clinics/${id}`),
  getServices: (clinicId: string) => api.get(`/clinics/${clinicId}/services`),
  getFeatured: () => api.get('/clinics/featured'),
  getTreatmentDetails: (id: string) => api.get(`/clinics/treatments/${id}`),

  createReview: (id: string, data: { rating: number; comment?: string; appointmentId?: string }) =>
    api.post(`/clinics/${id}/reviews`, data),

  getPublicReviews: (id: string, params?: { limit?: number; offset?: number }) =>
    api.get(`/clinics/${id}/reviews`, { params }),

  getProviders: (clinicId: string) => api.get(`/clinics/${clinicId}/providers`),

  getPendingReviews: (params?: { limit?: number; offset?: number }) =>
    api.get('/clinics/reviews/pending', { params }),

  moderateReview: (id: string, data: { status: 'APPROVED' | 'REJECTED'; rejectReason?: string }) =>
    api.patch(`/clinics/reviews/${id}/moderate`, data),

  getSuggestions: (q: string) => api.get('/clinics/suggestions', { params: { q } }),

  getCategoryTree: (withTreatments?: boolean) =>
    api.get('/clinics/categories', { params: withTreatments ? { withTreatments: true } : undefined }),

  getCategoryTreatments: (id: string) => api.get(`/clinics/categories/${id}/treatments`),
  getTopTreatments: (limit?: number) => api.get('/clinics/top-treatments', { params: { limit } }),
};

export const publicCatalogService = {
  getCategories: () => api.get('/clinics/categories'),
  getTreatmentsByCategory: (catId: string) =>
    api.get(`/clinics/categories/${catId}/treatments`),
  getAllMasterTreatments: () =>
    api.get('/clinic/master/treatments', { params: { status: 'approved' } }),
  getCities: () => api.get('/clinics/cities'),
};

export default clinicService;
