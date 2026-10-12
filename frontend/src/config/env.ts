/**
 * Centralized Environment Configuration
 */

const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    let url = envUrl.trim();
    if (url.endsWith('/')) url = url.slice(0, -1);
    // Ensure it has the /api prefix
    return url.endsWith('/api') ? url : `${url}/api`;
  }
  // Default fallback for dev proxy
  return '/api';
};

const getSocketBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  // Strip trailing /api for socket.io namespace connectivity
  return envUrl.replace(/\/api\/?$/, '');
};

export const ENV = {
  // Mode
  IS_DEV: import.meta.env.DEV || import.meta.env.VITE_NODE_ENV === 'development',
  IS_PROD: import.meta.env.PROD || import.meta.env.VITE_NODE_ENV === 'production',
  MODE: import.meta.env.MODE,

  // API & WebSockets
  API_BASE_URL: getApiBaseUrl(),
  SOCKET_URL: getSocketBaseUrl(),
  APP_TYPE: import.meta.env.VITE_APP_TYPE || 'all',
  STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',

  // Firebase Credentials
  FIREBASE: {
    API_KEY: import.meta.env.VITE_FIREBASE_API_KEY || '',
    AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    APP_ID: import.meta.env.VITE_FIREBASE_APP_ID || '',
    VAPID_KEY: import.meta.env.VITE_FIREBASE_VAPID_KEY || '',
  },
} as const;

export default ENV;
