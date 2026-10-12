/**
 * Central API Gateway & Backward Compatibility Layer
 * Re-exports the base HTTP client and all modular feature services.
 */

import { api, API_BASE_URL, setupAxiosInterceptors, httpClient } from './client';
import {
  authService,
  clinicService,
  publicCatalogService,
  bookingService,
  userService,
  loyaltyService,
  paymentService,
  crmService,
  taskService,
  adminService,
  adminAuditLogsService,
  adminSettingsService,
  adminSystemListsService,
  blogService,
  notificationService,
  messageService,
  uploadService,
  productService,
} from './features';

// Base client exports
export { api, API_BASE_URL, setupAxiosInterceptors, httpClient };

// Feature Services exports
export {
  authService,
  clinicService,
  publicCatalogService,
  bookingService,
  userService,
  loyaltyService,
  paymentService,
  crmService,
  taskService,
  adminService,
  adminAuditLogsService,
  adminSettingsService,
  adminSystemListsService,
  blogService,
  notificationService,
  messageService,
  uploadService,
  productService,
};

// Backward-compatible API aliases (guarantees existing imports continue to work seamlessly)
export const authAPI = authService;
export const clinicsAPI = clinicService;
export const publicCatalogAPI = publicCatalogService;
export const bookingAPI = bookingService;
export const userAPI = userService;
export const loyaltyAPI = loyaltyService;
export const paymentsAPI = paymentService;
export const crmAPI = crmService;
export const TaskAPI = taskService;
export const adminAPI = adminService;
export const adminAuditLogsAPI = adminAuditLogsService;
export const adminSettingsAPI = adminSettingsService;
export const adminSystemListsAPI = adminSystemListsService;
export const publicBlogsAPI = blogService;
export const notificationsAPI = notificationService;
export const messagesAPI = messageService;
export const uploadAPI = uploadService;

export default api;
