import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import clinicsSlice from './slices/clinicsSlice';
import bookingSlice from './slices/bookingSlice';
import userSlice from './slices/userSlice';
import notificationsSlice from './slices/notificationsSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    clinics: clinicsSlice,
    booking: bookingSlice,
    user: userSlice,
    notifications: notificationsSlice,
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