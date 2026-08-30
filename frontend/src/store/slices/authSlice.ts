import { createSlice, createAsyncThunk, PayloadAction, Reducer } from "@reduxjs/toolkit";
import { authAPI, userAPI } from "@/services/api";
import type { User } from "@/types";

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getStoredRefreshToken = (): string | null => {
  return localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken") || null;
};

const getStoredAccessToken = (): string | null => {
  return localStorage.getItem("accessToken") || null;
};

const initialState: AuthState = {
  user: getStoredUser(),
  accessToken: getStoredAccessToken(),
  refreshToken: getStoredRefreshToken(),
  isAuthenticated: !!getStoredRefreshToken() || !!getStoredAccessToken(),
  isLoading: false,
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await authAPI.login(email, password);
      if (response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }
      if (response.data.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
      }
      if (response.data.user) {
        const isClientOnlyApp = import.meta.env.VITE_APP_TYPE === 'client' || (typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.());
        if (isClientOnlyApp && response.data.user.role && response.data.user.role !== 'client') {
          await authAPI.logout().catch(() => {});
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          localStorage.removeItem("userRole");
          return rejectWithValue("Access Denied: This mobile app is exclusively for Clients. Staff & Admins must use the web portal.");
        }
        localStorage.setItem("user", JSON.stringify(response.data.user));
        if (response.data.user.role) {
          localStorage.setItem("userRole", response.data.user.role);
        }
      }
      return response.data;
    } catch (error: any) {
      console.error("Login failed:", error.response?.data?.message || error.message);
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (
    userData: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await authAPI.register(userData);
      if (response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }
      if (response.data.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
      }
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
        if (response.data.user.role) {
          localStorage.setItem("userRole", response.data.user.role);
        }
      }
      return response.data;
    } catch (error: any) {
      console.error("Register failed:", error.response?.data?.message || error.message);
      return rejectWithValue(
        error.response?.data?.message || "Registration failed"
      );
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
    } catch {
      // Logout API failure is non-critical — state is cleared regardless
    }
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    sessionStorage.removeItem("refreshToken");
    return {};
  }
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (
    { email }: { email: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await authAPI.forgotPassword(email);
      return response.data;
    } catch (error: any) {
      console.error("Forgot password failed:", error.response?.data?.message || error.message);
      return rejectWithValue(error.response?.data?.message || "Forgot password failed");
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (
    { password, resetToken }: { password: string; resetToken: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await authAPI.resetPassword(password, resetToken);
      return response.data;
    } catch (error: any) {
      console.error("Reset password failed:", error.response?.data?.message || error.message);
      return rejectWithValue(error.response?.data?.message || "Reset password failed");
    }
  }
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await userAPI.updateProfile(userData);
      if (response.data) {
        localStorage.setItem("user", JSON.stringify(response.data));
      }
      return response.data;
    } catch (error: any) {
      console.error("Update profile failed:", error.response?.data?.message || error.message);
      return rejectWithValue(error.response?.data?.message || "Update profile failed");
    }
  }
);

export const restoreSession = createAsyncThunk(
  "auth/restoreSession",
  async (_, { getState, dispatch, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    const refreshToken =
      state.auth.refreshToken || localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken");

    if (!refreshToken) {
      return rejectWithValue(null); // Silent rejection - no error in state
    }

    try {
      const response = await authAPI.refreshToken(refreshToken);
      if (response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }
      if (response.data.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
      }
      if (response.data.user) {
        const isClientOnlyApp = import.meta.env.VITE_APP_TYPE === 'client' || (typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.());
        if (isClientOnlyApp && response.data.user.role && response.data.user.role !== 'client') {
          dispatch(logout());
          return rejectWithValue("Access Denied: This mobile app is exclusively for Clients.");
        }
        localStorage.setItem("user", JSON.stringify(response.data.user));
        if (response.data.user.role) {
          localStorage.setItem("userRole", response.data.user.role);
        }
      }
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        dispatch(logout());
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("userRole");
        sessionStorage.removeItem("refreshToken");
      }
      return rejectWithValue(
        error.response?.data?.message || "Session restoration failed"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setTokens: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken?: string; user?: User }>
    ) => {
      state.accessToken = action.payload.accessToken;
      localStorage.setItem("accessToken", action.payload.accessToken);
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
        localStorage.setItem("refreshToken", action.payload.refreshToken);
      }
      if (action.payload.user) {
        state.user = action.payload.user;
        localStorage.setItem("user", JSON.stringify(action.payload.user));
        if (action.payload.user.role) {
          localStorage.setItem("userRole", action.payload.user.role);
        }
      }
      state.isAuthenticated = true;
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      localStorage.setItem("accessToken", action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
        if (action.payload.accessToken) {
          localStorage.setItem("accessToken", action.payload.accessToken);
        }
        if (action.payload.refreshToken) {
          localStorage.setItem("refreshToken", action.payload.refreshToken);
        }
        if (action.payload.user) {
          localStorage.setItem("user", JSON.stringify(action.payload.user));
          if (action.payload.user.role) {
            localStorage.setItem("userRole", action.payload.user.role);
          }
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user || null;
        state.accessToken = action.payload.accessToken || null;
        state.refreshToken = action.payload.refreshToken || null;
        state.isAuthenticated = !action.payload.requiresVerification;
        state.error = null;
        if (action.payload.accessToken) {
          localStorage.setItem("accessToken", action.payload.accessToken);
        }
        if (action.payload.refreshToken) {
          localStorage.setItem("refreshToken", action.payload.refreshToken);
        }
        if (action.payload.user) {
          localStorage.setItem("user", JSON.stringify(action.payload.user));
          if (action.payload.user.role) {
            localStorage.setItem("userRole", action.payload.user.role);
          }
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("userRole");
        sessionStorage.removeItem("refreshToken");
      })
      .addCase(restoreSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken || state.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
        if (action.payload.accessToken) {
          localStorage.setItem("accessToken", action.payload.accessToken);
        }
        if (action.payload.refreshToken) {
          localStorage.setItem("refreshToken", action.payload.refreshToken);
        }
        if (action.payload.user) {
          localStorage.setItem("user", JSON.stringify(action.payload.user));
          if (action.payload.user.role) {
            localStorage.setItem("userRole", action.payload.user.role);
          }
        }
      })
      .addCase(restoreSession.rejected, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.error = action.payload as string;
          // Only clear session on 401 or invalid token errors
          if (state.error.includes("401") || state.error.includes("Invalid")) {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
            localStorage.removeItem("userRole");
            sessionStorage.removeItem("refreshToken");
          }
        }
      })
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload; // Assuming payload returns the updated user object
        state.error = null;
        if (action.payload) {
          localStorage.setItem("user", JSON.stringify(action.payload));
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setTokens, setAccessToken } = authSlice.actions;
const authReducer: Reducer<AuthState> = authSlice.reducer;
export default authReducer;