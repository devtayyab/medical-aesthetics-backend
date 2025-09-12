import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authAPI } from '@/services/api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isAuthenticated: false, // Changed to false to avoid assuming until restoreSession succeeds
  isLoading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(email, password);
      console.log('Login success, response:', response.data);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      console.log('Login: Stored refreshToken:', response.data.refreshToken.substring(0, 20) + '...');
      return response.data;
    } catch (error: any) {
      console.error('Login failed:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      console.log('Register success, response:', response.data);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      console.log('Register: Stored refreshToken:', response.data.refreshToken.substring(0, 20) + '...');
      return response.data;
    } catch (error: any) {
      console.error('Register failed:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
      console.log('Logout success');
    } catch (error: any) {
      console.error('Logout request failed, clearing state:', error.response?.data || error.message);
    }
    localStorage.removeItem('refreshToken');
    console.log('Logout: Removed refreshToken from localStorage');
    return {};
  }
);

export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { getState, dispatch, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    const refreshToken = state.auth.refreshToken || localStorage.getItem('refreshToken');
    console.log('restoreSession: state.auth.refreshToken:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'null');
    console.log('restoreSession: localStorage.refreshToken:', localStorage.getItem('refreshToken') ? `${localStorage.getItem('refreshToken')!.substring(0, 20)}...` : 'null');
    console.log('restoreSession: Using refreshToken:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'null');

    if (!refreshToken) {
      console.log('restoreSession: No refresh token, rejecting silently');
      return rejectWithValue(null); // Silent rejection - no error in state
    }

    try {
      const response = await authAPI.refreshToken(refreshToken);
      console.log('restoreSession success, response:', response.data);
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
        console.log('restoreSession: Stored new refreshToken:', response.data.refreshToken.substring(0, 20) + '...');
      } else {
        console.log('restoreSession: No new refreshToken in response, keeping existing');
      }
      return response.data;
    } catch (error: any) {
      console.error('restoreSession failed:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        dispatch(logout());
        localStorage.removeItem('refreshToken');
        console.log('restoreSession: 401 error, cleared session');
      }
      return rejectWithValue(error.response?.data?.message || 'Session restoration failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken?: string }>) => {
      state.accessToken = action.payload.accessToken;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
        localStorage.setItem('refreshToken', action.payload.refreshToken);
        console.log('setTokens: Stored new refreshToken:', action.payload.refreshToken.substring(0, 20) + '...');
      }
      state.isAuthenticated = true;
      console.log('setTokens: Updated accessToken, isAuthenticated: true');
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      console.log('setAccessToken: Updated accessToken');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        console.log('login.pending');
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
        console.log('login.fulfilled: User:', state.user, 'refreshToken:', state.refreshToken?.substring(0, 20) + '...');
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        console.log('login.rejected: Error:', state.error);
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        console.log('register.pending');
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
        console.log('register.fulfilled: User:', state.user, 'refreshToken:', state.refreshToken?.substring(0, 20) + '...');
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        console.log('register.rejected: Error:', state.error);
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
        console.log('logout.fulfilled: State cleared');
      })
      .addCase(restoreSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        console.log('restoreSession.pending');
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken || state.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
        console.log('restoreSession.fulfilled: User:', state.user, 'refreshToken:', state.refreshToken?.substring(0, 20) + '...');
      })
      .addCase(restoreSession.rejected, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.error = action.payload as string;
          // Only clear session on 401 or invalid token errors
          if (state.error.includes('401') || state.error.includes('Invalid')) {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            localStorage.removeItem('refreshToken');
            console.log('restoreSession.rejected: 401/Invalid error, cleared session');
          } else {
            console.log('restoreSession.rejected: Non-critical error:', state.error, 'Keeping session');
          }
        } else {
          console.log('restoreSession.rejected: No token (silent), keeping state');
        }
      });
  },
});

export const { clearError, setTokens, setAccessToken } = authSlice.actions;
export default authSlice.reducer;