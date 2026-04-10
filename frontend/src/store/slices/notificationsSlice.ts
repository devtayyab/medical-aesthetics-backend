import { createSlice, createAsyncThunk, Reducer } from '@reduxjs/toolkit';
import { notificationsAPI } from '@/services/api';
import type { Notification } from '@/types';

export interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (limit?: number) => {
    const response = await notificationsAPI.getNotifications(limit);
    return response.data;
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async () => {
    const response = await notificationsAPI.getUnreadCount();
    return response.data;
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id: string) => {
    await notificationsAPI.markAsRead(id);
    return id;
  }
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { dispatch }) => {
    await notificationsAPI.markAllAsRead();
    dispatch(fetchUnreadCount());
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload;
      })
      // Fetch unread count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.count;
      })
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notificationId = action.payload;
        const notification = state.notifications.find(n => n.id === notificationId);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          notification.readAt = new Date().toISOString();
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllAsRead.pending, (state) => {
        state.isLoading = true;
        // Optimistic update: mark all as read immediately
        state.notifications = state.notifications.map(n => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString()
        }));
        state.unreadCount = 0;
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(markAllAsRead.rejected, (state) => {
        state.isLoading = false;
        // Optional: revert optimistic update if needed, but for "read all" it's usually fine to keep it
      })
      // Loading states
      .addMatcher(
        (action) => action.type.endsWith('/pending'),
        (state) => {
          state.isLoading = true;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith('/fulfilled') || action.type.endsWith('/rejected'),
        (state) => {
          state.isLoading = false;
        }
      );
  },
});

export const { clearError } = notificationsSlice.actions;
const notificationsReducer: Reducer<NotificationsState> = notificationsSlice.reducer;
export default notificationsReducer;
