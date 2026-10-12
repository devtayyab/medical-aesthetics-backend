import { api } from '../client';

export const notificationService = {
  getNotifications: (limit?: number) => api.get('/notifications', { params: { limit } }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),

  // Template Management (Admin)
  getTemplates: () => api.get('/notifications/templates'),
  createTemplate: (data: any) => api.post('/notifications/templates', data),
  updateTemplate: (id: string, data: any) => api.patch(`/notifications/templates/${id}`, data),
  resetDefaultTemplates: () => api.post('/notifications/templates/reset-defaults'),
  sendNotification: (data: { recipientId: string; type: string; title: string; message: string; data?: any }) =>
    api.post('/notifications/send', data),
};

export const messageService = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (conversationId: string, params?: { limit?: number; offset?: number }) =>
    api.get(`/messages/conversations/${conversationId}/messages`, { params }),
  sendMessage: (conversationId: string, data: { content: string; type?: string; metadata?: any }) =>
    api.post(`/messages/conversations/${conversationId}/messages`, data),
  createConversation: (participantIds: string[], title?: string, isGroup?: boolean) =>
    api.post('/messages/conversations', { participantIds, title, isGroup }),
  search: (query: string) => api.get('/messages/search', { params: { q: query } }),
};

export default notificationService;
