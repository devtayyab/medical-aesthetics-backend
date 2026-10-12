import { configureStore } from '@reduxjs/toolkit';
import authSlice from '@/store/slices/authSlice';
import clinicsSlice from '@/store/slices/clinicsSlice';
import bookingSlice from '@/store/slices/bookingSlice';
import userSlice from '@/store/slices/userSlice';
import notificationsSlice from '@/store/slices/notificationsSlice';
import clientSlice from '@/store/slices/clientSlice';
import clinicSlice from '@/store/slices/clinicSlice';
import crmSlice from '@/store/slices/crmSlice';
import adminSlice from '@/store/slices/adminSlice';
import taskSlice from '@/store/slices/taskSlice';
import messagesSlice from '@/store/slices/messagesSlice';
import dialerSlice from '@/store/slices/dialerSlice';
import uiSlice from '@/store/slices/uiSlice';

/**
 * Central Redux Toolkit Store
 * Combines domain-specific slices (auth, clinics, bookings, CRM, notifications, etc.)
 * Configured with custom serializable checks for external actions.
 */
export const store = configureStore({
  reducer: {
    auth: authSlice,
    clinics: clinicsSlice,
    booking: bookingSlice,
    user: userSlice,
    notifications: notificationsSlice,
    client: clientSlice,
    clinic: clinicSlice,
    crm: crmSlice,
    admin: adminSlice,
    task: taskSlice,
    messages: messagesSlice,
    dialer: dialerSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist or non-serializable payloads where applicable
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

// Inferred RootState and AppDispatch types for application-wide type safety
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export * from './hooks';
