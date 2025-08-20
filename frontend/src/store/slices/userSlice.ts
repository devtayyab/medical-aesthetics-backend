import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAPI, loyaltyAPI } from '@/services/api';
import type { User, LoyaltyBalance } from '@/types';

interface UserState {
  profile: User | null;
  loyaltyBalance: LoyaltyBalance | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  loyaltyBalance: null,
  isLoading: false,
  error: null,
};

export const fetchProfile = createAsyncThunk(
  'user/fetchProfile',
  async () => {
    const response = await userAPI.getProfile();
    return response.data;
  }
);

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (data: Partial<User>) => {
    const response = await userAPI.updateProfile(data);
    return response.data;
  }
);

export const fetchLoyaltyBalance = createAsyncThunk(
  'user/fetchLoyaltyBalance',
  async ({ clientId, clinicId }: { clientId: string; clinicId?: string }) => {
    const response = await loyaltyAPI.getBalance(clientId, clinicId);
    return response.data;
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch profile
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch profile';
      })
      // Update profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      // Fetch loyalty balance
      .addCase(fetchLoyaltyBalance.fulfilled, (state, action) => {
        state.loyaltyBalance = action.payload;
      });
  },
});

export const { clearError } = userSlice.actions;
export default userSlice.reducer;