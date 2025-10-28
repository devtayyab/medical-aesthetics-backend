import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import { combineReducers } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import clinicsSlice from './slices/clinicsSlice';
import bookingSlice from './slices/bookingSlice';
import userSlice from './slices/userSlice';
import notificationsSlice from './slices/notificationsSlice';
import clientSlice from './slices/clientSlice';
import clinicSlice from './slices/clinicSlice';
import crmSlice from './slices/crmSlice';
import adminSlice from './slices/adminSlice';

// Persist configuration - blacklist tokens from auth
const authPersistConfig = {
  key: 'auth',
  storage,
  // BLACKLIST tokens - do NOT persist them
  blacklist: ['accessToken', 'refreshToken', 'isLoading', 'error'],
};

// Combine reducers with persist only on auth slice
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authSlice),
  clinics: clinicsSlice,
  booking: bookingSlice,
  user: userSlice,
  notifications: notificationsSlice,
  client: clientSlice,
  clinic: clinicSlice,
  crm: crmSlice,
  admin: adminSlice,
});

// Configure store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;