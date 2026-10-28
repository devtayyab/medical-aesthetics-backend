import { api } from '../client';

export const adminService = {
  getMetrics: () => api.get('/admin/metrics'),
  getTags: () => api.get('/admin/tags'),
  createTag: (data: { name: string; color?: string; description?: string }) => api.post('/admin/tags', data),
  getClinics: () => api.get('/admin/clinics'),
  createClinic: (data: any) => api.post('/admin/clinics', data),
  updateClinic: (id: string, data: any) => api.put(`/admin/clinics/${id}`, data),
  getClinicServices: (clinicId: string) => api.get(`/clinic/services?clinicId=${clinicId}`),
  createClinicService: (data: any) => api.post(`/clinic/services`, data),
  updateClinicService: (id: string, data: any) => api.put(`/clinic/services/${id}`, data),
  deleteClinicService: (id: string, clinicId: string) => api.delete(`/clinic/services/${id}?clinicId=${clinicId}`),
  toggleServiceStatus: (id: string, clinicId: string) => api.patch(`/clinic/services/${id}/toggle?clinicId=${clinicId}`),
  getBlockedSlots: (clinicId: string) => api.get(`/clinic/availability/blocked-slots?clinicId=${clinicId}`),
  blockSlot: (data: any) => api.post(`/clinic/availability/block-time-slot`, data),
  updateBlockedSlot: (id: string, data: any) => api.put(`/clinic/availability/block-time-slot/${id}`, data),
  unblockSlot: (id: string) => api.delete(`/clinic/availability/block-time-slot/${id}`),
  createUser: (data: any) => api.post('/clinic/staff', data),
  getUsers: () => api.get('/admin/users'),
  updateUser: (id: string, updateData: any) => api.put(`/admin/users/${id}`, updateData),
  changeUserPassword: (id: string, data: { password: string }) => api.patch(`/admin/users/${id}/password`, data),
  getLoyalty: () => api.get('/admin/loyalty'),
  updateLoyalty: (data: { tiers: { name: string; points: number; rewards: string[] }[] }) =>
    api.patch('/admin/loyalty', data),
  getLogs: () => api.get('/admin/monitor'),
  toggleUserStatus: (id: string) => api.patch(`/admin/users/${id}/toggle-status`),
  getUserOpenWork: (id: string) => api.get(`/admin/users/${id}/open-work`),
  deactivateUser: (id: string, reassignToUserId?: string) =>
    api.post(`/admin/users/${id}/deactivate`, { reassignToUserId }),
  reactivateUser: (id: string) => api.post(`/admin/users/${id}/reactivate`),
  getStaffRequests: () => api.get('/admin/staff-requests'),
  approveStaffRequest: (id: string) => api.post(`/admin/staff-requests/${id}/approve`),
  rejectStaffRequest: (id: string) => api.post(`/admin/staff-requests/${id}/reject`),
  getWalletSummary: () => api.get('/admin/wallet/summary'),
  getRecentTransactions: () => api.get('/admin/wallet/transactions'),
  getPaymentsLedger: (params?: {
    clinicId?: string;
    providerId?: string;
    salespersonId?: string;
    date?: string;
    method?: string;
    limit?: number;
    offset?: number;
  }) => api.get('/admin/payments/ledger', { params }),
  refundPayment: (id: string, notes: string) => api.post(`/admin/payments/${id}/refund`, { notes }),
  voidPayment: (id: string, notes: string) => api.post(`/admin/payments/${id}/void`, { notes }),
  createManualPayment: (data: {
    amount: number;
    method: string;
    type: string;
    notes: string;
    clinicId: string;
    clientId: string;
    providerId?: string;
    salespersonId?: string;
  }) => api.post('/admin/payments/manual', data),
  getGiftCardsSummary: () => api.get('/admin/gift-cards/summary'),
  getGiftCards: (search?: string) => api.get('/admin/gift-cards', { params: { search } }),
  generateGiftCard: (data: { amount: number; recipientEmail?: string; message?: string; expiresAt?: string }) =>
    api.post('/admin/gift-cards/generate', data),
  redeemGiftCard: (data: { code: string; amount: number }) => api.post('/admin/gift-cards/redeem', data),
  getBlogCategories: () => api.get('/admin/blogs/categories'),
  createBlogCategory: (data: { name: string; slug: string }) => api.post('/admin/blogs/categories', data),
  getBlogPosts: (search?: string) => api.get('/admin/blogs/posts', { params: { search } }),
  getBlogPost: (id: string) => api.get(`/admin/blogs/posts/${id}`),
  createBlogPost: (data: any) => api.post('/admin/blogs/posts', data),
  updateBlogPost: (id: string, data: any) => api.put(`/admin/blogs/posts/${id}`, data),
  deleteBlogPost: (id: string) => api.delete(`/admin/blogs/posts/${id}`),

  // Master Catalog
  getMasterCategories: (params?: { search?: string; status?: string }) => api.get('/clinic/master/categories', { params }),
  getMasterCategoryTree: () => api.get('/clinic/master/categories/tree'),
  createMasterCategory: (data: any) => api.post('/clinic/master/categories', data),
  updateMasterCategory: (id: string, data: any) => api.put(`/clinic/master/categories/${id}`, data),
  deleteMasterCategory: (id: string) => api.delete(`/clinic/master/categories/${id}`),
  getMasterTreatments: (params?: { search?: string; status?: string; categoryId?: string }) =>
    api.get('/clinic/master/treatments', { params }),
  createMasterTreatment: (data: any) => api.post('/clinic/master/treatments', data),
  updateMasterTreatment: (id: string, data: any) => api.put(`/clinic/master/treatments/${id}`, data),
  deleteMasterTreatment: (id: string) => api.delete(`/clinic/master/treatments/${id}`),
  autoConnectCategories: () => api.post('/clinic/master/treatments/auto-connect-categories'),
  getPendingTreatments: () => api.get('/clinics/treatments/pending'),
  setTreatmentStatus: (id: string, status: string) => api.patch(`/clinics/treatments/${id}/status`, { status }),
  getGlobalCalendar: (params: {
    startDate: string;
    endDate: string;
    clinicId?: string;
    providerId?: string;
  }) => api.get('/admin/calendar', { params }),
};

export const adminAuditLogsService = {
  getAuditLogs: (params?: any) => api.get('/admin/audit-logs', { params }),
};

export const adminSettingsService = {
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (settings: any) => api.patch('/admin/settings', settings),
  getIntegrationLogs: () => api.get('/admin/integrations/logs'),
};

export const adminSystemListsService = {
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data: any) => api.post('/admin/categories', data),
  updateCategory: (id: string, data: any) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/admin/categories/${id}`),
  autoConnectCategories: () => api.post('/clinic/master/treatments/auto-connect-categories'),
  getTreatments: (params?: any) => api.get('/admin/treatments', { params }),
  createTreatment: (data: any) => api.post('/admin/treatments', data),
  updateTreatment: (id: string, data: any) => api.put(`/admin/treatments/${id}`, data),
  deleteTreatment: (id: string) => api.delete(`/admin/treatments/${id}`),
};

export default adminService;
