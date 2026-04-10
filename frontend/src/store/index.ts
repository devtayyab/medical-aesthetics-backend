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
import taskSlice from '@/store/slices/TaskSlice';
import messagesSlice from '@/store/slices/messagesSlice';
import dialerSlice from '@/store/slices/dialerSlice';

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
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
