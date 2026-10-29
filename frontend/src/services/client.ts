import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ENV } from '@/config/env';

export const API_BASE_URL = ENV.API_BASE_URL;

/**
 * Base Axios Client
 * Configured with standard timeouts, base URL, and headers.
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  // Session tokens live in httpOnly cookies set by the API; send them on every request.
  withCredentials: true,
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

/** Short-lived access token kept in memory only (never in localStorage). Used for sockets. */
export const getAccessToken = (): string | null => {
  if (!store) return null;
  return store.getState()?.auth?.accessToken || null;
};

/** Same-path check used for redirects after login: only relative app paths are allowed. */
export const isSafeRedirect = (value: string | null | undefined): value is string =>
  typeof value === 'string' &&
  value.startsWith('/') &&
  !value.startsWith('//') &&
  // Browsers drop tabs/newlines and treat "\" as "/" in URLs: "/\t/evil.com" is "//evil.com".
  !/[\\\u0000-\u001f\u007f]/.test(value);

/** Sends the user to the login page with "Please log in again" and a way back. */
export const redirectToLoginAfterExpiry = () => {
  if (typeof window === 'undefined') return;
  const { pathname, search } = window.location;
  if (pathname.startsWith('/login')) return;
  const params = new URLSearchParams({ reason: 'session_expired' });
  const current = pathname + search;
  if (isSafeRedirect(current) && current !== '/') params.set('redirect', current);
  window.location.href = `/login?${params.toString()}`;
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

// Request Interceptor: the httpOnly cookie authenticates the request. The in-memory access
// token is also sent as a Bearer header so cross-site setups and the app WebView keep working.
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const retryWithToken = (originalRequest: any, token: string | null) => {
  if (originalRequest.headers) {
    delete originalRequest.headers.authorization;
    delete originalRequest.headers.Authorization;
    if (token) originalRequest.headers.Authorization = `Bearer ${token}`;
  }
  return api(originalRequest);
};

// Response Interceptor: refresh the session once on 401, otherwise ask to log in again.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Skip auth endpoints: 401 on login/register means invalid credentials, not an expired session
    if (typeof originalRequest?.url === 'string' && originalRequest.url.includes('/auth/')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (!store) return Promise.reject(error);

      // If already refreshing, queue this request until the new session arrives
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token, refreshError) => {
            if (refreshError) {
              reject(refreshError);
            } else {
              resolve(retryWithToken(originalRequest, token));
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // The refresh token is sent as an httpOnly cookie.
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const { accessToken, user } = response.data;

        if (store && setTokensAction) {
          store.dispatch(setTokensAction({ accessToken, user }));
        }

        isRefreshing = false;
        onRefreshed(accessToken);
        return retryWithToken(originalRequest, accessToken);
      } catch (refreshError: any) {
        isRefreshing = false;
        onRefreshFailed(refreshError);

        if (store && logoutAction) {
          await store.dispatch(logoutAction());
        }
        redirectToLoginAfterExpiry();
        return Promise.reject(refreshError);
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
