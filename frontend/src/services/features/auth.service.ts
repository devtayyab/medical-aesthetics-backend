import { api, API_BASE_URL } from '../client';
import axios from 'axios';

export interface RegisterUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (userData: RegisterUserData) =>
    api.post('/auth/register', userData),

  logout: () => {
    return api.post('/auth/logout', {}).catch(() => {
      return Promise.resolve({ data: { message: 'Logged out' } });
    });
  },

  refreshToken: (refreshToken: string) =>
    axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken }),

  resetPassword: (password: string, resetToken: string) =>
    api.post('/auth/reset-password', { password, resetToken }),

  forgotPassword: (email: string) =>
    api.post('/auth/forget-password', { email }),
};

export default authService;
