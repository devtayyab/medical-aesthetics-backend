import { api } from '../client';

export const paymentService = {
  getMyWallet: (params?: { limit?: number; offset?: number }) =>
    api.get('/payments/my-wallet', { params }),

  getMyGiftCards: () =>
    api.get('/payments/gift-cards'),

  purchaseGiftCard: (data: { amount: number; recipientEmail?: string; message?: string }) =>
    api.post('/payments/gift-cards', data),

  applyGiftCard: (code: string) =>
    api.post('/payments/gift-cards/apply', { code }),
};

export default paymentService;
