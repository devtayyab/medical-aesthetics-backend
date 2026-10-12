import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ENV } from '@/config/env';

export const API_BASE_URL = ENV.API_BASE_URL;

/**
 * Base Axios Client
 * Configured with standard timeouts, base URL, and headers.
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let store: any;
let setTokensAction: any;
let logoutAction: any;

/**
 * Injects Redux store and auth actions into the HTTP client interceptor
 */
export const setupAxiosInterceptors = (
  _store: any,
  _actions: { setTokens: any; logout: any }
) => {
  store = _store;
  setTokensAction = _actions.setTokens;
  logoutAction = _actions.logout;
};

let isRefreshing = false;
let refreshSubscribers: ((token: string | null, error?: any) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string | null, error?: any) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const onRefreshFailed = (error: any) => {
  refreshSubscribers.forEach((cb) => cb(null, error));
  refreshSubscribers = [];
};

// Request Interceptor: Attach Bearer token from Redux store or localStorage
api.interceptors.request.use((config) => {
  let token = null;
  if (store) {
    const state = store.getState();
    token = state?.auth?.accessToken;
  }
  if (!token) {
    token = localStorage.getItem('accessToken');
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Automatic JWT token refresh on 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Skip auth endpoints: 401 on login/register means invalid credentials, not an expired session
    if (typeof originalRequest?.url === 'string' && originalRequest.url.includes('/auth/')) {
      return Promise.reject(error);
    }

    // Handle token expiration: queue concurrent requests while single refresh is active
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (!store) return Promise.reject(error);

      // If already refreshing, queue this request callback until the new token arrives
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token, refreshError) => {
            if (refreshError) {
              reject(refreshError);
            } else if (token) {
              if (originalRequest.headers) {
                delete originalRequest.headers.authorization;
                delete originalRequest.headers.Authorization;
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const state = store.getState();
      const refreshToken =
        localStorage.getItem('refreshToken') ||
        state?.auth?.refreshToken ||
        sessionStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          const { accessToken, refreshToken: newRefreshToken, user } = response.data;

          if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
          }
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          if (user) {
            localStorage.setItem('user', JSON.stringify(user));
            if (user.role) localStorage.setItem('userRole', user.role);
          }

          if (store && setTokensAction) {
            store.dispatch(
              setTokensAction({ accessToken, refreshToken: newRefreshToken, user })
            );
          }

          isRefreshing = false;
          onRefreshed(accessToken);

          if (originalRequest.headers) {
            delete originalRequest.headers.authorization;
            delete originalRequest.headers.Authorization;
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          return api(originalRequest);
        } catch (refreshError: any) {
          console.error('Refresh failed:', {
            message: refreshError.response?.data || refreshError.message,
            status: refreshError.response?.status,
          });

          isRefreshing = false;
          onRefreshFailed(refreshError);

          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('userRole');
          sessionStorage.removeItem('refreshToken');

          if (store && logoutAction) {
            store.dispatch(logoutAction());
          }
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        console.warn('No refresh token found, logging out');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        sessionStorage.removeItem('refreshToken');

        if (store && logoutAction) {
          store.dispatch(logoutAction());
        }
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Base HTTP helper object for concise, typed API requests
 * Facilitates easily adding new endpoints in any service file.
 */
export const httpClient = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    api.get<T>(url, config),
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    api.post<T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    api.put<T>(url, data, config),
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    api.patch<T>(url, data, config),
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    api.delete<T>(url, config),
};

export default api;
