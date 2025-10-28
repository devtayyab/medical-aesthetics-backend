import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { authAPI } from "@/services/api";
import type { User } from "@/types";

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem("accessToken") || null,
  refreshToken: localStorage.getItem("refreshToken") || null,
  isAuthenticated: false, // Will be set to true only after successful restoreSession or login
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
      const refreshToken = response.data.refreshToken;
      console.log("🎯 refreshToken:", refreshToken);
      localStorage.setItem("refreshToken", refreshToken);
      console.log("🎯 login response:", response.data);
      return response.data;
    } catch (error: any) {
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
      localStorage.setItem("refreshToken", response.data.refreshToken);
      return response.data;
    } catch (error: any) {
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
    } catch (error: any) {
    }
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("accessToken");

    return {};
  }
);

// Global flag to prevent concurrent restoreSession calls
let isRestoringSession = false;

export const restoreSession = createAsyncThunk(
  "auth/restoreSession",
  async (_, { rejectWithValue }) => {
    // Prevent concurrent restore attempts
    if (isRestoringSession) {
      console.warn("⚠️ Restore already in progress, skipping duplicate call");
      return rejectWithValue("Already restoring");
    }

    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      console.warn("⚠️ No refresh token found, skipping restore.");
      return rejectWithValue(null);
    }

    isRestoringSession = true;

    try {
      const response = await authAPI.refreshToken(refreshToken);
      console.log("✅ Session restored successfully:", response.data);

      const { accessToken, refreshToken: newRefreshToken, user } = response.data;

      // Validate that we got a new refresh token
      if (!newRefreshToken) {
        console.warn("⚠️ Backend did not return new refreshToken!");
      }

      const finalRefreshToken = newRefreshToken || refreshToken;

      // Persist latest tokens to localStorage
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", finalRefreshToken);

      console.log("🔄 Tokens updated:", {
        oldRefreshToken: refreshToken.substring(0, 20) + "...",
        newRefreshToken: finalRefreshToken.substring(0, 20) + "...",
        tokensMatch: refreshToken === finalRefreshToken ? "❌ SAME" : "✅ ROTATED",
      });

      return { accessToken, refreshToken: finalRefreshToken, user };

    } catch (error: any) {
      console.error("❌ Restore session failed:", error.response?.data || error.message);
      // Clear localStorage on auth failure
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return rejectWithValue(
        error.response?.data?.message || "Session restoration failed"
      );
    } finally {
      isRestoringSession = false;
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
      action: PayloadAction<{ accessToken: string; refreshToken?: string }>
    ) => {
      console.log("🔧 setTokens called:", {
        oldRefreshToken: state.refreshToken?.substring(0, 20) + "...",
        newRefreshToken: action.payload.refreshToken?.substring(0, 20) + "...",
        hasNewToken: !!action.payload.refreshToken,
      });

      state.accessToken = action.payload.accessToken;
      localStorage.setItem("accessToken", action.payload.accessToken);

      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
        localStorage.setItem("refreshToken", action.payload.refreshToken);
      }

      state.isAuthenticated = true;
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      localStorage.setItem("accessToken", action.payload);
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log("🎯 Login successful, storing tokens:", {
          hasAccessToken: !!action.payload.accessToken,
          hasRefreshToken: !!action.payload.refreshToken,
          user: action.payload.user?.email,
        });
        
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
        
        // Store in localStorage SYNCHRONOUSLY
        localStorage.setItem("accessToken", action.payload.accessToken);
        localStorage.setItem("refreshToken", action.payload.refreshToken);
        
        console.log("✅ Tokens stored in localStorage:", {
          accessTokenStored: !!localStorage.getItem("accessToken"),
          refreshTokenStored: !!localStorage.getItem("refreshToken"),
        });
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
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
        localStorage.setItem("accessToken", action.payload.accessToken);
        localStorage.setItem("refreshToken", action.payload.refreshToken);
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
      })
      .addCase(restoreSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        console.log("🎯 restoreSession.fulfilled payload:", action.payload);
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken || state.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(restoreSession.rejected, (state, action) => {
        console.log("❌ restoreSession.rejected reason:", action.payload);
        state.isLoading = false;
        // Clear tokens and auth state on failed restoration
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        // Don't set error if there was no refresh token (null payload means no token found)
        if (action.payload) {
          state.error = action.payload as string;
        }
      });
  },
});

export const { clearError, setTokens, setAccessToken } = authSlice.actions;
export default authSlice.reducer;
