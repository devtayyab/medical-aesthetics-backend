import axios, { AxiosError } from 'axios';
import { store } from '@/store';
import { setTokens, logout } from '@/store/slices/authSlice';
import type { User, Clinic, Service, Appointment, TimeSlot, LoyaltyBalance, Notification } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth.accessToken || localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const state = store.getState();
      const refreshToken = state.auth.refreshToken || localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          store.dispatch(setTokens({ accessToken, refreshToken: newRefreshToken }));
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          store.dispatch(logout());
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => api.post('/auth/register', userData),
  
  logout: () => api.post('/auth/logout'),
  
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

export const clinicsAPI = {
  search: (params: {
    location?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => api.get('/clinics', { params }),
  
  getById: (id: string) => api.get(`/clinics/${id}`),
  
  getServices: (clinicId: string) => api.get(`/clinics/${clinicId}/services`),
  
  getFeatured: () => api.get('/clinics/featured'),
};

export const bookingAPI = {
  getAvailability: (params: {
    clinicId: string;
    serviceId: string;
    providerId: string;
    date: string;
  }) => api.get('/availability', { params }),
  
  holdSlot: (data: {
    clinicId: string;
    serviceId: string;
    providerId: string;
    startTime: string;
    endTime: string;
  }) => api.post('/appointments/hold', data),
  
  createAppointment: (data: {
    clinicId: string;
    serviceId: string;
    providerId: string;
    clientId: string;
    startTime: string;
    endTime: string;
    notes?: string;
    paymentMethod?: string;
    advancePaymentAmount?: number;
    holdId?: string;
  }) => api.post('/appointments', data),
  
  getUserAppointments: () => api.get('/appointments'),
  
  getAppointment: (id: string) => api.get(`/appointments/${id}`),
  
  reschedule: (id: string, startTime: string, endTime: string) =>
    api.patch(`/appointments/${id}/reschedule`, { startTime, endTime }),
  
  cancel: (id: string) => api.patch(`/appointments/${id}/cancel`),
};

export const userAPI = {
  getProfile: () => api.get('/users/me'),
  
  updateProfile: (data: Partial<User>) => api.patch('/users/me/profile', data),
  
  exportData: () => api.get('/users/me/export'),
  
  deleteData: () => api.post('/users/me/delete'),
  
  // New endpoint to fetch all users (for admin use)
  getAllUsers: (params: { limit?: number; offset?: number; role?: string }) =>
    api.get('/users', { params }),
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
  }) => api.post('/loyalty/redeem', data),
};

export const notificationsAPI = {
  getNotifications: (limit?: number) => {
    const params = limit ? { limit } : {};
    return api.get('/notifications', { params });
  },
  
  getUnreadCount: () => api.get('/notifications/unread-count'),
  
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
};

export default api;