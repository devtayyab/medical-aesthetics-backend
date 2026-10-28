import { api } from '../client';
import type { Lead, CustomerRecord, CommunicationLog, CrmAction, CrmFilters, Task } from '@/types';

export const crmService = {
  // Lead Management
  createLead: (data: {
    source: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    facebookLeadId?: string;
    facebookFormId?: string;
    facebookCampaignId?: string;
    facebookAdSetId?: string;
    facebookAdId?: string;
    facebookLeadData?: any;
    status: string;
    metadata?: any;
    assignedSalesId?: string;
    notes?: string;
    estimatedValue?: number;
  }) => api.post('/crm/leads', data),
  getLeads: (filters?: CrmFilters) => api.get('/crm/leads', { params: filters }),
  getLeadStats: (filters?: CrmFilters) => api.get('/crm/leads/stats', { params: filters }),
  getLead: (id: string) => api.get(`/crm/leads/${id}`),
  updateLead: (id: string, data: Partial<Lead>) => api.patch(`/crm/leads/${id}`, data),
  deleteLead: (id: string) => api.delete(`/crm/leads/${id}`),
  bulkCreateLeads: (leads: any[]) => api.post('/crm/leads/bulk', leads),

  // Facebook Integration
  handleFacebookWebhook: (data: any) => api.post('/crm/facebook/webhook', data),
  importFacebookLeads: (formId: string, limit?: number) =>
    api.post(`/crm/facebook/import/${formId}`, {}, { params: { limit } }),
  importAllFacebookLeads: () => api.post('/crm/facebook/import-all'),
  getFacebookForms: (pageId?: string) => api.get('/crm/facebook/forms', { params: pageId ? { pageId } : undefined }),
  getFacebookStats: (pageId?: string) => api.get('/crm/facebook/stats', { params: pageId ? { pageId } : undefined }),
  getWebhookLeads: (params?: { days?: number; page?: number; limit?: number }) => api.get('/crm/facebook/webhook-leads', { params }),
  testFacebookConnection: () => api.get('/crm/facebook/test'),
  assignFormsToDay: (data: { formNames: string[]; scheduledAt: string }) => api.post('/crm/facebook/forms/assign', data),
  bulkCreateTasks: (data: { leadIds: string[]; salespersonId: string; dueDate: string; title: string }) => api.post('/crm/actions/bulk', data),

  // Duplicate Detection
  checkForDuplicates: (data: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  }) => api.get('/crm/duplicates/check', { params: data }),
  getDuplicateSuggestions: (data: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  }) => api.get('/crm/duplicates/suggestions', { params: data }),
  mergeDuplicates: (targetId: string, sourceId: string) =>
    api.post('/crm/duplicates/merge', { targetId, sourceId }),

  // Customer Records
  getCustomers: (filters?: any) => api.get('/crm/customers', { params: filters }),
  getCustomerRecord: (customerId: string, salespersonId?: string) =>
    api.get(`/crm/customers/${customerId}/record`, { params: { salespersonId } }),
  getCustomer: (id?: string) => api.get(`/crm/customer/${id}`),
  updateCustomerRecord: (customerId: string, data: Partial<CustomerRecord>) =>
    api.patch(`/crm/customers/${customerId}`, data),

  // Communication Management
  logCommunication: (data: Partial<CommunicationLog>) => api.post('/crm/communications', data),
  getCommunicationHistory: (customerId: string, filters?: {
    type?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get(`/crm/customers/${customerId}/communications`, { params: filters }),
  updateCommunication: (id: string, data: Partial<CommunicationLog>) =>
    api.patch(`/crm/communications/${id}`, data),
  deleteCommunication: (id: string) => api.delete(`/crm/communications/${id}`),

  // Action/Task Management
  createAction: (data: Partial<CrmAction>) => api.post('/crm/actions', data),
  updateAction: (id: string, data: Partial<CrmAction>) => api.patch(`/crm/actions/${id}`, data),
  deleteAction: (id: string) => api.delete(`/crm/actions/${id}`),
  getActions: (salespersonId?: string, filters?: {
    status?: string;
    priority?: string;
    customerId?: string;
    // Server-side paging (Tasks page): response is { data, total, page, limit, totalPages }
    page?: number;
    limit?: number;
    search?: string;
    actionType?: string;
    dateRange?: string;
  }) => api.get('/crm/actions', { params: { ...filters, salespersonId } }),
  importTasksCsv: (csv: string, dryRun = false) => api.post('/crm/actions/import-csv', { csv, dryRun }),
  getPendingActions: (salespersonId?: string) => api.get(`/crm/actions/${salespersonId}/pending`),
  getOverdueTasks: (salespersonId?: string) => api.get('/crm/tasks/overdue', { params: { salespersonId } }),
  getTaskKpis: (salespersonId?: string) => api.get('/crm/tasks/kpis', { params: { salespersonId } }),

  // Tag Management
  addCustomerTag: (customerId: string, tagId: string, notes?: string) =>
    api.post(`/crm/customers/${customerId}/tags`, { tagId, notes }),
  removeCustomerTag: (id: string) => api.delete(`/crm/tags/${id}`),
  getCustomersByTag: (tagId: string, salespersonId?: string) =>
    api.get(`/crm/tags/${tagId}/customers`, { params: { salespersonId } }),

  // Task Automation
  getAutomationRules: () => api.get('/crm/automation/rules'),
  runTaskAutomationCheck: () => api.post('/crm/automation/run-check'),
  createAutomatedTasks: () => api.post('/crm/automation/create-tasks'),

  // Field Validation
  getRequiredFieldsForCall: () => api.get('/crm/validation/required-fields/call'),
  getRequiredFieldsForAction: (actionType: string) =>
    api.get(`/crm/validation/required-fields/action/${actionType}`),
  validateCommunication: (data: {
    customerId: string;
    communicationData: Partial<CommunicationLog>;
  }) => api.post('/crm/validation/validate-communication', data),
  validateAction: (data: {
    customerId: string;
    actionData: Partial<CrmAction>;
  }) => api.post('/crm/validation/validate-action', data),

  // Analytics
  getSalespersonAnalytics: (salespersonId: string, dateRange?: {
    startDate: string;
    endDate: string;
  }) => api.get(`/crm/analytics/${salespersonId}`, { params: dateRange }),
  getCrmMetrics: () => api.get('/crm/metrics'),
  getPerformanceDashboard: (params?: { startDate?: string; endDate?: string; salespersonId?: string }) =>
    api.get('/crm/analytics/performance-dashboard', { params }),
  getClinicAnalytics: (params?: { startDate?: string; endDate?: string; clinicId?: string }) =>
    api.get('/crm/analytics/manager/clinics', { params }),

  // Repeat Customer Management
  identifyRepeatCustomers: (salespersonId?: string) =>
    api.get('/crm/customers/repeat', { params: { salespersonId } }),
  getCustomersDueForFollowUp: (salespersonId?: string, daysThreshold?: number) =>
    api.get('/crm/follow-up', { params: { salespersonId, daysThreshold } }),

  // Reassignment & Dashboard
  reassignCustomer: (customerId: string, salespersonId: string) =>
    api.post(`/crm/customers/${customerId}/reassign`, { salespersonId }),
  getSuperAdminDashboardStats: (params: { startDate?: string; endDate?: string }) =>
    api.get('/crm/analytics/super-admin/dashboard', { params }),

  // Legacy compatibility methods
  logAction: (customerId: string, data: { type: string; notes: string }) =>
    api.post('/crm/actions', { customerId, ...data }),
  createTask: (data: {
    customerId: string;
    description: string;
    type: string;
    dueDate: string;
    assignedTo: string;
  }) => api.post('/crm/tasks', data),
  getTasks: (salespersonId: string) => api.get(`/crm/tasks/${salespersonId}`),
  updateTask: (id: string, data: Partial<CrmAction>) => api.patch(`/crm/tasks/${id}`, data),
  scheduleRecurring: (data: {
    customerId: string;
    clinicId: string;
    serviceId: string;
    frequency: string;
    startDate: string;
  }) => api.post('/crm/recurring-appointments', data),
  getAccessibleClinics: () => api.get('/crm/accessible-clinics'),
  getSalespersons: () => api.get('/crm/salespersons'),
  getSalesActivities: (date?: string, salespersonId?: string) =>
    api.get('/crm/activities/diary', { params: { date, salespersonId } }),
};

export const taskService = {
  createTask: (data: {
    description: string;
    type: string;
    dueDate: string;
    assignedTo: string;
    metadata: Record<string, any>;
    customerId: string;
  }) => api.post('/tasks', data),
  getTasks: () => api.get('/tasks'),
  updateTask: (id: string, data: Partial<Task>) => api.patch(`/tasks/${id}`, data),
  deleteTask: (id: string) => api.delete(`/tasks/${id}`),
};

export default crmService;
