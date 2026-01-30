import axios, { AxiosError } from "axios";
import { store } from "@/store";
import { setTokens, logout } from "@/store/slices/authSlice";
import type {
  Lead,
  CustomerRecord,
  CommunicationLog,
  CrmAction,
  CrmFilters,
  User,
  Task
} from "@/types";

const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  // Force HTTP for IP address (no SSL support on raw IP)
  if (url.includes('51.20.72.67') && url.startsWith('https://')) {
    url = url.replace('https://', 'http://');
  }

  // Remove trailing slash if present
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  // Append /api if not present
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

const API_BASE_URL = getBaseUrl();
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

api.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log(
        "401 detected, isRefreshing:",
        isRefreshing,
        "originalRequest:",
        {
          url: originalRequest.url,
          method: originalRequest.method,
          headers: originalRequest.headers,
        }
      );
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const state = store.getState();
      const refreshToken =
        state.auth.refreshToken || localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          store.dispatch(
            setTokens({ accessToken, refreshToken: newRefreshToken })
          );
          onRefreshed(accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError: any) {
          console.error("Refresh failed:", {
            message: refreshError.response?.data || refreshError.message,
            status: refreshError.response?.status,
          });
          store.dispatch(logout());
          window.location.href = "/login";
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        store.dispatch(logout());
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => api.post("/auth/register", userData),
  logout: () => {
    const state = store.getState();
    const token = state.auth.accessToken;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return api.post("/auth/logout", {}, { headers }).catch((error) => {
      console.log(
        "Logout API failed, clearing state:",
        error.response?.data || error.message
      );
      return Promise.resolve({ data: { message: "Logged out" } });
    });
  },
  refreshToken: (refreshToken: string) =>
    axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken }),

  resetPassword: (password: string, resetToken: string) =>
    api.post("/auth/reset-password", { password, resetToken }),

  forgotPassword: (email: string) =>
    api.post("/auth/forget-password", { email })
      .catch((error) => {
        console.log("Forgot password API failed:", error.response?.data || error.message);
        return Promise.reject(error);
      }),


};

export const clinicsAPI = {
  search: (params: {
    location?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => api.get("/clinics", { params }),
  getById: (id: string) => api.get(`/clinics/${id}`),
  getServices: (clinicId: string) => api.get(`/clinics/${clinicId}/services`),
  getFeatured: () => api.get("/clinics/featured"),
  createReview: (id: string, data: { rating: number; comment?: string; appointmentId?: string }) =>
    api.post(`/clinics/${id}/reviews`, data),
};

export const bookingAPI = {
  getAvailability: (params: {
    clinicId: string;
    serviceId: string;
    providerId?: string;
    date: string;
  }) => api.get("/availability", { params }),
  holdSlot: (data: {
    clinicId: string;
    serviceId: string;
    providerId?: string;
    startTime: string;
    endTime: string;
  }) => api.post("/appointments/hold", data),
  createAppointment: (data: {
    clinicId: string;
    serviceId: string;
    providerId?: string;
    clientId: string;
    startTime: string;
    endTime: string;
    notes?: string;
    paymentMethod?: string;
    advancePaymentAmount?: number;
    holdId?: string;
  }) => api.post("/appointments", data),
  getUserAppointments: () => api.get("/appointments"),
  getAppointment: (id: string) => api.get(`/appointments/${id}`),
  reschedule: (id: string, startTime: string, endTime: string) =>
    api.patch(`/appointments/${id}/reschedule`, { startTime, endTime }),
  cancel: (id: string) => api.patch(`/appointments/${id}/cancel`),
};

export const userAPI = {
  getProfile: () => api.get("/users/me"),
  updateProfile: (data: Partial<User>) => api.patch("/users/me/profile", data),
  exportData: () => api.get("/users/me/export"),
  deleteData: () => api.post("/users/me/delete"),
  getAllUsers: (params: { limit?: number; offset?: number; role?: string }) =>
    api.get("/users", { params }),
};

export const loyaltyAPI = {
  getBalance: (clientId: string, clinicId?: string) => {
    const params = clinicId ? { clinicId } : {};
    return api.get(`/loyalty/${clientId}`, { params });
  },
  getHistory: (clientId: string, clinicId?: string) => {
    const params = clinicId ? { clinicId } : {};
    return api.get(`/loyalty/${clientId}/history`, { params });
  },
  redeemPoints: (data: {
    clientId: string;
    clinicId: string;
    points: number;
    description: string;
  }) => api.post("/loyalty/redeem", data),
};

export const notificationsAPI = {
  getNotifications: (limit?: number) => {
    const params = limit ? { limit } : {};
    return api.get("/notifications", { params });
  },
  getUnreadCount: () => api.get("/notifications/unread-count"),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
};

export const crmAPI = {
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
  }) => api.post("/crm/leads", data),
  getLeads: (filters?: CrmFilters) => api.get("/crm/leads", { params: filters }),
  getLead: (id: string) => api.get(`/crm/leads/${id}`),
  updateLead: (id: string, data: Partial<Lead>) =>
    api.patch(`/crm/leads/${id}`, data),
  deleteLead: (id: string) => api.delete(`/crm/leads/${id}`),

  // Facebook Integration
  handleFacebookWebhook: (data: any) => api.post("/crm/facebook/webhook", data),
  importFacebookLeads: (formId: string, limit?: number) =>
    api.post(`/crm/facebook/import/${formId}`, {}, { params: { limit } }),
  getFacebookForms: () => api.get("/crm/facebook/forms"),
  testFacebookConnection: () => api.get("/crm/facebook/test"),

  // Duplicate Detection
  checkForDuplicates: (data: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  }) => api.get("/crm/duplicates/check", { params: data }),
  getDuplicateSuggestions: (data: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  }) => api.get("/crm/duplicates/suggestions", { params: data }),
  mergeDuplicates: (targetId: string, sourceId: string) =>
    api.post(`/crm/duplicates/merge`, { targetId, sourceId }),

  // Customer Records
  getCustomerRecord: (customerId: string, salespersonId?: string) =>
    api.get(`/crm/customer/${customerId}`, { params: { salespersonId } }),
  getCustomer: (id?: string) =>
    api.get(`/crm/customer/${id}`),
  updateCustomerRecord: (customerId: string, data: Partial<CustomerRecord>) =>
    api.patch(`/crm/customers/${customerId}`, data),

  // Communication Management
  logCommunication: (data: Partial<CommunicationLog>) =>
    api.post("/crm/communications", data),
  getCommunicationHistory: (customerId: string, filters?: {
    type?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get(`/crm/customers/${customerId}/communications`, { params: filters }),

  // Action/Task Management
  createAction: (data: Partial<CrmAction>) =>
    api.post("/crm/actions", data),
  updateAction: (id: string, data: Partial<CrmAction>) =>
    api.patch(`/crm/actions/${id}`, data),
  deleteAction: (id: string) => api.delete(`/crm/actions/${id}`),
  getActions: (salespersonId?: string, filters?: {
    status?: string;
    priority?: string;
    customerId?: string;
  }) => api.get(`/crm/actions`, { params: filters }),
  getPendingActions: (salespersonId?: string) =>
    api.get(`/crm/actions/${salespersonId}/pending`),
  getOverdueTasks: (salespersonId?: string) =>
    api.get("/crm/tasks/overdue", { params: { salespersonId } }),

  // Tag Management
  addCustomerTag: (data: {
    customerId: string;
    tagId: string;
    addedBy: string;
    notes?: string;
  }) => api.post("/crm/tags", data),
  removeCustomerTag: (id: string) => api.delete(`/crm/tags/${id}`),
  getCustomersByTag: (tagId: string, salespersonId?: string) =>
    api.get(`/crm/tags/${tagId}/customers`, { params: { salespersonId } }),

  // Task Automation
  getAutomationRules: () => api.get("/crm/automation/rules"),
  runTaskAutomationCheck: () => api.post("/crm/automation/run-check"),
  createAutomatedTasks: () => api.post("/crm/automation/create-tasks"),

  // Field Validation
  getRequiredFieldsForCall: () => api.get("/crm/validation/required-fields/call"),
  getRequiredFieldsForAction: (actionType: string) =>
    api.get(`/crm/validation/required-fields/action/${actionType}`),
  validateCommunication: (data: {
    customerId: string;
    communicationData: Partial<CommunicationLog>;
  }) => api.post("/crm/validation/validate-communication", data),
  validateAction: (data: {
    customerId: string;
    actionData: Partial<CrmAction>;
  }) => api.post("/crm/validation/validate-action", data),

  // Analytics
  getSalespersonAnalytics: (salespersonId: string, dateRange?: {
    startDate: string;
    endDate: string;
  }) => api.get(`/crm/analytics/${salespersonId}`, { params: dateRange }),
  getCrmMetrics: () => api.get("/crm/metrics"),

  // Repeat Customer Management
  identifyRepeatCustomers: (salespersonId?: string) =>
    api.get("/crm/repeat-customers", { params: { salespersonId } }),
  getCustomersDueForFollowUp: (salespersonId?: string, daysThreshold?: number) =>
    api.get("/crm/follow-up", { params: { salespersonId, daysThreshold } }),

  // Legacy methods (keeping for backward compatibility)
  logAction: (customerId: string, data: { type: string; notes: string }) =>
    api.post("/crm/actions", { customerId, ...data }),
  createTask: (data: {
    customerId: string;
    description: string;
    type: string;
    dueDate: string;
    assignedTo: string;
  }) => api.post("/crm/tasks", data),
  getTasks: (salespersonId: string) => api.get(`/crm/tasks/${salespersonId}`),
  updateTask: (id: string, data: Partial<CrmAction>) =>
    api.patch(`/crm/tasks/${id}`, data),
  scheduleRecurring: (data: {
    customerId: string;
    serviceId: string;
    frequency: string;
    startDate: string;
  }) => api.post("/crm/recurring-appointments", data),
};

export const adminAPI = {
  getMetrics: () => api.get("/admin/metrics"),
  getUsers: () => api.get("/admin/users"),
  updateRole: (id: string, role: string) =>
    api.patch(`/admin/users/${id}/role`, { role }),
  getLoyalty: () => api.get("/admin/loyalty"),
  updateLoyalty: (data: {
    tiers: { name: string; points: number; rewards: string[] }[];
  }) => api.patch("/admin/loyalty", data),
  getLogs: () => api.get("/admin/monitor"),
};

export const TaskAPI = {
  createTask: (data: {
    description: string;
    type: string;
    dueDate: string;
    assignedTo: string;
    metadata: Record<string, any>;
    customerId: string;
  }) => api.post("/tasks", data),
  getTasks: () => api.get(`/tasks`),
  updateTask: (id: string, data: Partial<Task>) =>
    api.patch(`/tasks/${id}`, data),
  deleteTask: (id: string) => api.delete(`/tasks/${id}`),
};

export default api;
