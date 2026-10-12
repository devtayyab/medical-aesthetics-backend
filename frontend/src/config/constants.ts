/**
 * Application-wide Constants
 */

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  THEME: 'theme',
  SELECTED_CLINIC_ID: 'selectedClinicId',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

export const DATE_FORMATS = {
  DISPLAY_DATE: 'dd/MM/yyyy',
  DISPLAY_TIME: 'HH:mm',
  DISPLAY_DATETIME: 'dd/MM/yyyy HH:mm',
  API_DATE: 'yyyy-MM-dd',
} as const;

export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  PENDING_PAYMENT: 'bg-orange-100 text-orange-800 border-orange-300',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-300',
  ARRIVED: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 border-purple-300',
  COMPLETED: 'bg-green-100 text-green-800 border-green-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300',
  NO_SHOW: 'bg-gray-100 text-gray-800 border-gray-300',
  EXECUTED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};
