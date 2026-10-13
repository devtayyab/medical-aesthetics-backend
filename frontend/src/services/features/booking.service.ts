import { api } from '../client';

export const bookingService = {
  getAvailability: (params: {
    clinicId: string;
    serviceId: string | string[];
    providerId?: string;
    date: string;
    allowPast?: boolean;
    excludeAppointmentId?: string;
  }) => api.get('/availability', {
    params,
    paramsSerializer: {
      indexes: null,
    },
  }),

  holdSlot: (data: {
    clinicId: string;
    serviceId: string;
    providerId?: string;
    startTime: string;
    endTime: string;
    additionalServiceIds?: string[];
  }) => api.post('/appointments/hold', data),

  createAppointment: (data: {
    clinicId: string;
    serviceId: string;
    additionalServiceIds?: string[];
    providerId?: string;
    clientId: string;
    startTime: string;
    endTime: string;
    notes?: string;
    paymentMethod?: string;
    advancePaymentAmount?: number;
    holdId?: string;
    status?: string;
    bookedById?: string;
    representativeId?: string;
    clientDetails?: {
      fullName: string;
      email: string;
      phone: string;
    };
  }) => api.post('/appointments', data),

  getUserAppointments: () => api.get('/appointments'),
  getAppointment: (id: string) => api.get(`/appointments/${id}`),

  getClinicAppointments: (params: { clinicId?: string; date?: string; providerId?: string; status?: string }) =>
    api.get('/appointments/clinic', { params }),

  recordPayment: (id: string, data: { amount: number; method: string; notes?: string }) =>
    api.post(`/appointments/${id}/payment`, data),

  generatePaymentUrl: (id: string) =>
    api.post(`/appointments/${id}/payment-url`),

  reschedule: (id: string, startTime: string, endTime: string, notes?: string) =>
    api.patch(`/appointments/${id}/reschedule`, { startTime, endTime, notes }),

  cancel: (id: string) => api.patch(`/appointments/${id}/cancel`),
  complete: (id: string, data?: any) => api.patch(`/clinic/appointments/${id}/complete`, data),
  validateGiftCard: (code: string) => api.post('/clinic/appointments/validate-gift-card', { code }).then(res => res.data),

  updateStatus: (id: string, status: string) =>
    api.patch(`/appointments/${id}/status`, { status }),

  createBlockedSlot: (data: {
    clinicId: string;
    providerId?: string | null;
    startTime: string;
    endTime: string;
    reason?: string;
  }) => api.post('/blocked-slots', data),

  updateAppointment: (id: string, data: {
    startTime?: string;
    endTime?: string;
    providerId?: string;
    clinicId?: string;
    serviceId?: string;
    notes?: string;
    totalAmount?: number;
    additionalServiceIds?: string[];
    representativeId?: string | null;
    bookedById?: string | null;
  }) => api.patch(`/appointments/${id}/update`, data),

  deleteAppointment: (id: string) => api.patch(`/appointments/${id}/delete`),
};

export default bookingService;
