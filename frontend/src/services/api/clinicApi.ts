import {
  ClinicProfile,
  Service,
  CreateServiceDto,
  Appointment,
  AppointmentFilters,
  CompleteAppointmentDto,
  RecordPaymentDto,
  Payment,
  AppointmentAnalytics,
  RevenueAnalytics,
  LoyaltyAnalytics,
  RepeatForecast,
  Client,
  Review,
  ReviewStatistics,
  SendNotificationDto,
  SendBulkNotificationDto,
  AvailabilitySettings,
  AppointmentStatus,
} from '../../types/clinic.types';
import { api as apiClient } from '../api';



// Clinic Profile API
export const clinicProfileApi = {
  getProfile: async (): Promise<ClinicProfile> => {
    const response = await apiClient.get('/clinic/profile');
    return response.data;
  },

  createProfile: async (data: Partial<ClinicProfile>): Promise<ClinicProfile> => {
    const response = await apiClient.post('/clinic/profile', data);
    return response.data;
  },

  updateProfile: async (data: Partial<ClinicProfile>): Promise<ClinicProfile> => {
    const response = await apiClient.put('/clinic/profile', data);
    return response.data;
  },

  getProviders: async (clinicId: string): Promise<any[]> => {
    const response = await apiClient.get(`/clinics/${clinicId}/providers`);
    return response.data;
  },
};

// Services/Treatments API
export const servicesApi = {
  getAll: async (clinicId?: string): Promise<Service[]> => {
    const params = clinicId ? { clinicId } : {};
    const response = await apiClient.get('/clinic/services', { params });
    return response.data;
  },

  create: async (data: CreateServiceDto): Promise<Service> => {
    const response = await apiClient.post('/clinic/services', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateServiceDto>): Promise<Service> => {
    const response = await apiClient.put(`/clinic/services/${id}`, data);
    return response.data;
  },

  toggleStatus: async (id: string): Promise<Service> => {
    const response = await apiClient.patch(`/clinic/services/${id}/toggle`);
    return response.data;
  },
};

// Appointments API
export const appointmentsApi = {
  getAll: async (filters?: AppointmentFilters): Promise<Appointment[]> => {
    const response = await apiClient.get('/clinic/appointments', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Appointment> => {
    const response = await apiClient.get(`/clinic/appointments/${id}`);
    return response.data;
  },

  updateStatus: async (
    id: string,
    status: AppointmentStatus,
    notes?: string,
    treatmentDetails?: any
  ): Promise<Appointment> => {
    const response = await apiClient.patch(`/clinic/appointments/${id}/status`, {
      status,
      notes,
      treatmentDetails,
    });
    return response.data;
  },

  reschedule: async (
    id: string,
    startTime: string,
    endTime: string,
    reason?: string
  ): Promise<Appointment> => {
    const response = await apiClient.patch(`/clinic/appointments/${id}/reschedule`, {
      startTime,
      endTime,
      reason,
    });
    return response.data;
  },

  complete: async (id: string, data: CompleteAppointmentDto): Promise<Appointment> => {
    const response = await apiClient.patch(`/clinic/appointments/${id}/complete`, data);
    return response.data;
  },

  recordPayment: async (id: string, data: RecordPaymentDto): Promise<Payment> => {
    const response = await apiClient.post(`/clinic/appointments/${id}/payment`, data);
    return response.data;
  },

  getPayments: async (id: string): Promise<Payment[]> => {
    const response = await apiClient.get(`/clinic/appointments/${id}/payments`);
    return response.data;
  },

  sendReminder: async (id: string): Promise<void> => {
    await apiClient.post(`/clinic/appointments/${id}/send-reminder`);
  },
};

// Analytics API
export const analyticsApi = {
  getAppointmentAnalytics: async (params?: {
    startDate?: string;
    endDate?: string;
    serviceId?: string;
  }): Promise<AppointmentAnalytics> => {
    const response = await apiClient.get('/clinic/analytics/appointments', { params });
    return response.data;
  },

  getRevenueAnalytics: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<RevenueAnalytics> => {
    const response = await apiClient.get('/clinic/analytics/revenue', { params });
    return response.data;
  },

  getLoyaltyAnalytics: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<LoyaltyAnalytics> => {
    const response = await apiClient.get('/clinic/analytics/loyalty', { params });
    return response.data;
  },

  getRepeatForecast: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<RepeatForecast> => {
    const response = await apiClient.get('/clinic/analytics/repeat-forecast', { params });
    return response.data;
  },
};

// Clients API
export const clientsApi = {
  getAll: async (params?: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ clients: any[]; total: number; limit: number; offset: number }> => {
    const response = await apiClient.get('/clinic/clients', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Client & { appointments: Appointment[] }> => {
    const response = await apiClient.get(`/clinic/clients/${id}`);
    return response.data;
  },
};

// Reviews API
export const reviewsApi = {
  getAll: async (params?: { limit?: number; offset?: number }): Promise<{
    reviews: Review[];
    total: number;
    averageRating: number;
  }> => {
    const response = await apiClient.get('/clinic/reviews', { params });
    return response.data;
  },

  getStatistics: async (): Promise<ReviewStatistics> => {
    const response = await apiClient.get('/clinic/reviews/statistics');
    return response.data;
  },

  respond: async (id: string, response: string): Promise<Review> => {
    const res = await apiClient.post(`/clinic/reviews/${id}/respond`, { response });
    return res.data;
  },

  toggleVisibility: async (id: string): Promise<Review> => {
    const response = await apiClient.patch(`/clinic/reviews/${id}/toggle-visibility`);
    return response.data;
  },
};

// Notifications API
export const notificationsApi = {
  send: async (data: SendNotificationDto): Promise<void> => {
    await apiClient.post('/clinic/notifications/send', data);
  },

  sendBulk: async (data: SendBulkNotificationDto): Promise<void> => {
    await apiClient.post('/clinic/notifications/send-bulk', data);
  },
};

// Availability API
export const availabilityApi = {
  get: async (clinicId?: string): Promise<AvailabilitySettings> => {
    const params = clinicId ? { clinicId } : {};
    const response = await apiClient.get('/clinic/availability', { params });
    return response.data;
  },

  update: async (data: AvailabilitySettings): Promise<AvailabilitySettings> => {
    const response = await apiClient.put('/clinic/availability', data);
    return response.data;
  },

  getBlockedSlots: async (): Promise<any[]> => {
    const response = await apiClient.get('/clinic/availability/blocked-slots');
    return response.data;
  },

  blockSlot: async (data: { providerId?: string; startTime: string; endTime: string; reason?: string }): Promise<any> => {
    const response = await apiClient.post('/clinic/availability/block-time-slot', data);
    return response.data;
  },

  unblockSlot: async (id: string): Promise<any> => {
    const response = await apiClient.delete(`/clinic/availability/block-time-slot/${id}`);
    return response.data;
  },


};

export default {
  clinicProfile: clinicProfileApi,
  services: servicesApi,
  appointments: appointmentsApi,
  analytics: analyticsApi,
  clients: clientsApi,
  reviews: reviewsApi,
  notifications: notificationsApi,
  availability: availabilityApi,
};
