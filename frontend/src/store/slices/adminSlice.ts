import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminAPI } from "@/services/api";
import type { User, LoyaltyTier } from "@/types";

export interface AdminState {
  metrics: { leads: number; conversions: number; revenue: number };
  users: User[];
  loyaltyTiers: LoyaltyTier[];
  logs: { id: string; userId: string; action: string; timestamp: string }[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  metrics: { leads: 0, conversions: 0, revenue: 0 },
  users: [],
  loyaltyTiers: [],
  logs: [],
  isLoading: false,
  error: null,
};

export const fetchMetrics = createAsyncThunk("admin/fetchMetrics", async () => {
  const response = await adminAPI.getMetrics();
  return response.data;
});

export const fetchUsers = createAsyncThunk("admin/fetchUsers", async () => {
  const response = await adminAPI.getUsers();
  return response.data.users;
});

export const updateUserRole = createAsyncThunk(
  "admin/updateUserRole",
  async (data: { id: string; role: string }) => {
    const response = await adminAPI.updateRole(data.id, data.role);
    return response.data;
  }
);

export const fetchLoyaltyTiers = createAsyncThunk(
  "admin/fetchLoyaltyTiers",
  async () => {
    const response = await adminAPI.getLoyalty();
    return response.data;
  }
);

export const updateLoyaltyTiers = createAsyncThunk(
  "admin/updateLoyaltyTiers",
  async (tiers: LoyaltyTier[]) => {
    const response = await adminAPI.updateLoyalty({ tiers });
    return response.data.tiers;
  }
);

export const fetchLogs = createAsyncThunk("admin/fetchLogs", async () => {
  const response = await adminAPI.getLogs();
  return response.data;
});

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMetrics.fulfilled, (state, action) => {
        state.metrics = action.payload;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users = action.payload;
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(fetchLoyaltyTiers.fulfilled, (state, action) => {
        state.loyaltyTiers = action.payload;
      })
      .addCase(updateLoyaltyTiers.fulfilled, (state, action) => {
        state.loyaltyTiers = action.payload;
      })
      .addCase(fetchLogs.fulfilled, (state, action) => {
        state.logs = action.payload;
      });
  },
});

export const { clearError } = adminSlice.actions;
export default adminSlice.reducer;
