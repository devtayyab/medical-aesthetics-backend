import { createSlice, createAsyncThunk, PayloadAction, Reducer } from "@reduxjs/toolkit";
import { authAPI, userAPI } from "@/services/api";
import type { User } from "@/types";

/**
 * Session model:
 * - access + refresh tokens are httpOnly cookies set by the API (scripts cannot read them)
 * - the short-lived access token is also kept IN MEMORY for socket connections
 * - only the non-secret user profile is cached in localStorage for the first paint
 */
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  /** Kept for type compatibility; refresh tokens are no longer stored client-side. */
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Cross-tab sync key (login/logout in another tab).
export const AUTH_EVENT_KEY = "bd_auth_event";

// "lastUsedPhone" was a phone number cached by checkout; "activeClinicId" is the clinic
// switcher choice, which must not carry over to the next account. Removed with the tokens.
const LEGACY_TOKEN_KEYS = ["accessToken", "refreshToken", "lastUsedPhone", "activeClinicId"];

const readLegacyRefreshToken = (): string | null => {
  try {
    return localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken") || null;
  } catch {
    return null;
  }
};

const clearLegacyTokens = () => {
  try {
    LEGACY_TOKEN_KEYS.forEach((k) => localStorage.removeItem(k));
    sessionStorage.removeItem("refreshToken");
  } catch {
    // storage unavailable
  }
};

const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const storeUser = (user?: User | null) => {
  try {
    if (user) {
      // Only what the first paint needs; no name, email or phone in localStorage.
      const { id, role, assignedClinicId } = user;
      localStorage.setItem("user", JSON.stringify({ id, role, assignedClinicId }));
      if (user.role) localStorage.setItem("userRole", user.role);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("userRole");
    }
  } catch {
    // storage unavailable
  }
};

const broadcastAuthEvent = (type: "login" | "logout") => {
  try {
    localStorage.setItem(AUTH_EVENT_KEY, `${type}:${Date.now()}`);
  } catch {
    // storage unavailable
  }
};

const isClientOnlyApp = () =>
  import.meta.env.VITE_APP_TYPE === 'client' ||
  (typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.()) ||
  (typeof window !== "undefined" && (window as any).isClientMobileApp) ||
  (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.includes("BeautyDoctorMobileApp")) ||
  (typeof localStorage !== "undefined" && localStorage.getItem("is_client_mobile_app") === "true");

const initialState: AuthState = {
  user: getStoredUser(),
  accessToken: null,
  refreshToken: null,
  // Optimistic until restoreSession confirms the cookie session on load.
  isAuthenticated: !!getStoredUser(),
  isLoading: false,
  error: null,
};

const errorMessage = (error: any, fallback: string) => {
  const data = error?.response?.data;
  const msg = data?.message;
  if (Array.isArray(msg)) return msg.join(" ");
  return msg || fallback;
};

/** Step 1: email + password. On success the API emails a 6-digit code. */
export const login = createAsyncThunk(
  "auth/login",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await authAPI.login(email, password);
      return response.data as { requiresCode: boolean; challengeToken: string; email: string; codeExpiresInSeconds: number };
    } catch (error: any) {
      return rejectWithValue({
        message: errorMessage(error, "Login failed"),
        code: error?.response?.data?.code,
      });
    }
  }
);

/** Step 2: the emailed code. Starts the cookie session. */
export const verifyLoginCode = createAsyncThunk(
  "auth/verifyLoginCode",
  async (
    { challengeToken, code }: { challengeToken: string; code: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await authAPI.verifyLoginCode(challengeToken, code);
      const user = response.data.user;
      if (isClientOnlyApp() && user?.role && user.role.toLowerCase() !== 'client') {
        await authAPI.logout().catch(() => {});
        return rejectWithValue({
          message: "Access Denied: This mobile app is exclusively for Clients. Staff & Admins must use the web portal.",
          code: "CLIENT_APP_ONLY",
        });
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue({
        message: errorMessage(error, "Invalid code"),
        code: error?.response?.data?.code,
      });
    }
  }
);

/** Registration never logs in: the user first confirms the email link. */
export const register = createAsyncThunk(
  "auth/register",
  async (
    { redirect, ...userData }: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      redirect?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await authAPI.register(userData, redirect);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(errorMessage(error, "Registration failed"));
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async () => {
    try {
      await authAPI.logout();
    } catch {
      // Logout API failure is non-critical — state is cleared regardless
    }
    clearLegacyTokens();
    storeUser(null);
    broadcastAuthEvent("logout");
    return {};
  }
);

/** Clears local state only (used when another tab logged out). */
export const clearSessionLocally = createAsyncThunk("auth/clearSessionLocally", async () => {
  clearLegacyTokens();
  storeUser(null);
  return {};
});

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
      return rejectWithValue(errorMessage(error, "Forgot password failed"));
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
      return rejectWithValue(errorMessage(error, "Reset password failed"));
    }
  }
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await userAPI.updateProfile(userData);
      if (response.data) {
        storeUser(response.data);
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(errorMessage(error, "Update profile failed"));
    }
  }
);

/**
 * Restores the session on page load from the httpOnly refresh cookie. Sessions started
 * before the cookie change still have a refresh token in localStorage: it is sent once,
 * the API answers with cookies, and the stored copy is deleted.
 */
export const restoreSession = createAsyncThunk(
  "auth/restoreSession",
  async (_, { dispatch, rejectWithValue }) => {
    const legacyRefreshToken = readLegacyRefreshToken();
    try {
      let response;
      try {
        response = await authAPI.refreshToken();
      } catch (cookieError: any) {
        if (!legacyRefreshToken) throw cookieError;
        response = await authAPI.refreshToken(legacyRefreshToken);
      }
      clearLegacyTokens();

      const user = response.data.user;
      if (isClientOnlyApp() && user?.role && user.role.toLowerCase() !== "client") {
        dispatch(logout());
        return rejectWithValue("Access Denied: This mobile app is exclusively for Clients.");
      }
      return response.data;
    } catch (error: any) {
      clearLegacyTokens();
      if (error.response?.status === 401) {
        storeUser(null);
        return rejectWithValue("401");
      }
      return rejectWithValue(errorMessage(error, "Session restoration failed"));
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
      state.accessToken = action.payload.accessToken || null;
      if (action.payload.user) {
        state.user = action.payload.user;
        storeUser(action.payload.user);
      }
      state.isAuthenticated = true;
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
  },
  extraReducers: (builder) => {
    const clearState = (state: AuthState) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    };

    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        if ((action.payload as any).accessToken) {
          state.isLoading = false;
          state.user = (action.payload as any).user;
          state.accessToken = (action.payload as any).accessToken || null;
          state.isAuthenticated = true;
          state.error = null;
          clearLegacyTokens();
          storeUser((action.payload as any).user);
          broadcastAuthEvent("login");
        } else {
          // Not authenticated yet: waiting for the emailed code.
          state.isLoading = false;
          state.error = null;
        }
      })
      .addCase(login.rejected, (state) => {
        // Login page shows the message inline.
        state.isLoading = false;
      })
      .addCase(verifyLoginCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyLoginCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken || null;
        state.isAuthenticated = true;
        state.error = null;
        clearLegacyTokens();
        storeUser(action.payload.user);
        broadcastAuthEvent("login");
      })
      .addCase(verifyLoginCode.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        clearState(state);
        state.error = null;
      })
      .addCase(clearSessionLocally.fulfilled, (state) => {
        clearState(state);
      })
      .addCase(restoreSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken || null;
        state.isAuthenticated = true;
        state.error = null;
        storeUser(action.payload.user);
      })
      .addCase(restoreSession.rejected, (state, action) => {
        state.isLoading = false;
        const reason = action.payload as string | undefined;
        // No valid cookie session: treat as logged out (no error banner).
        if (reason === "401" || !state.user) {
          clearState(state);
          storeUser(null);
        } else if (reason) {
          state.error = reason;
        }
      })
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
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
