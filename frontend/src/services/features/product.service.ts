import { api } from '../client';

export interface ProductQueryParams {
  search?: string;
  categoryId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

/**
 * Product & Treatment Catalog Service
 * Provides centralized management for treatments, therapies, and aesthetic products.
 */
export const productService = {
  // Query product / treatment catalog
  getAll: (params?: ProductQueryParams) =>
    api.get('/clinic/master/treatments', { params }),

  getById: (id: string) =>
    api.get(`/clinics/treatments/${id}`),

  create: (data: any) =>
    api.post('/clinic/master/treatments', data),

  update: (id: string, data: any) =>
    api.put(`/clinic/master/treatments/${id}`, data),

  delete: (id: string) =>
    api.delete(`/clinic/master/treatments/${id}`),

  // Categories & Trees
  getCategories: (params?: { search?: string; status?: string }) =>
    api.get('/clinic/master/categories', { params }),

  getCategoryTree: () =>
    api.get('/clinic/master/categories/tree'),

  // Product Status & Approvals
  getPending: () =>
    api.get('/clinics/treatments/pending'),

  setStatus: (id: string, status: string) =>
    api.patch(`/clinics/treatments/${id}/status`, { status }),

  autoConnectCategories: () =>
    api.post('/clinic/master/treatments/auto-connect-categories'),
};

export default productService;
