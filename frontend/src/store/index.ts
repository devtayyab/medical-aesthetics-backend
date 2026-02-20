import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import clinicsSlice from './slices/clinicsSlice';
import bookingSlice from './slices/bookingSlice';
import userSlice from './slices/userSlice';
import notificationsSlice from './slices/notificationsSlice';
import clientSlice from './slices/clientSlice';
import clinicSlice from './slices/clinicSlice';
import crmSlice from './slices/crmSlice';
import adminSlice from './slices/adminSlice';
import taskSlice from './slices/TaskSlice';
import messagesSlice from './slices/messagesSlice';

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