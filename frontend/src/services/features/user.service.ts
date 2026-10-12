import { api } from '../client';
import type { User } from '@/types';

export const userService = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: Partial<User>) => api.patch('/users/me/profile', data),
  exportData: () => api.get('/users/me/export'),
  deleteData: () => api.post('/users/me/delete'),
  deactivateData: () => api.post('/users/me/deactivate'),
  getAllUsers: (params: { limit?: number; offset?: number; role?: string; search?: string }) =>
    api.get('/users', { params }),
  createUser: (userData: any) => api.post('/users', userData),
  changePassword: (data: any) => api.post('/users/me/change-password', data),
  getReferralStats: () => api.get('/users/me/referral-stats'),
};

export const loyaltyService = {
  getCatalog: () => api.get('/loyalty/catalog'),
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

export default userService;
