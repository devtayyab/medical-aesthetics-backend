import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Header } from './Header';
import authSlice from '@/store/slices/authSlice';
import notificationsSlice from '@/store/slices/notificationsSlice';

const meta: Meta<typeof Header> = {
  title: 'Organisms/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story, { args }) => {
      const store = configureStore({
        reducer: {
          auth: authSlice,
          notifications: notificationsSlice,
        },
        preloadedState: {
          auth: {
            user: args.user || null,
            accessToken: args.user ? 'mock-token' : null,
            refreshToken: args.user ? 'mock-refresh-token' : null,
            isAuthenticated: !!args.user,
            isLoading: false,
            error: null,
          },
          notifications: {
            notifications: [],
            unreadCount: args.unreadCount || 0,
            isLoading: false,
            error: null,
          },
        },
      });

      return (
        <Provider store={store}>
          <BrowserRouter>
            <Story />
          </BrowserRouter>
        </Provider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const LoggedOut: Story = {};

export const LoggedIn: Story = {
  args: {
    user: {
      id: '1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'client',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  },
};

export const WithNotifications: Story = {
  args: {
    user: {
      id: '1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'client',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    unreadCount: 3,
  },
};

export const ManyNotifications: Story = {
  args: {
    user: {
      id: '1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'client',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    unreadCount: 15,
  },
};