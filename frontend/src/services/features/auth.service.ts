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
  /** Step 1: password check. Returns { requiresCode, challengeToken, email }. */
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  /** Step 2: 6-digit email code. Sets the httpOnly session cookies. */
  verifyLoginCode: (challengeToken: string, code: string) =>
    api.post('/auth/login/verify-code', { challengeToken, code }),

  resendLoginCode: (challengeToken: string) =>
    api.post('/auth/login/resend-code', { challengeToken }),

  register: (userData: RegisterUserData, redirect?: string) =>
    api.post('/auth/register', userData, { params: redirect ? { redirect } : undefined }),

  verifyEmail: (token: string) =>
    api.post('/auth/verify-email', { token }),

  resendVerification: (email: string, redirect?: string) =>
    api.post('/auth/resend-verification', { email, redirect }),

  logout: () => {
    return api.post('/auth/logout', {}).catch(() => {
      return Promise.resolve({ data: { message: 'Logged out' } });
    });
  },

  /**
   * Uses the httpOnly refresh cookie. `legacyRefreshToken` is only for sessions that were
   * started before tokens moved out of localStorage (one-time migration).
   */
  refreshToken: (legacyRefreshToken?: string) =>
    axios.post(
      `${API_BASE_URL}/auth/refresh`,
      legacyRefreshToken ? { refreshToken: legacyRefreshToken } : {},
      { withCredentials: true },
    ),

  resetPassword: (password: string, resetToken: string) =>
    api.post('/auth/reset-password', { password, resetToken }),

  forgotPassword: (email: string) =>
    api.post('/auth/forget-password', { email }),
};

export default authService;
