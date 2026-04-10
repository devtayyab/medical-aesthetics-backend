import { createSlice, createAsyncThunk, Reducer } from "@reduxjs/toolkit";
import { adminAPI } from "@/services/api";
import type { User, LoyaltyTier } from "@/types";

export interface AdminState {
  metrics: { leads: number; conversions: number; revenue: number };
  users: User[];
  loyaltyTiers: LoyaltyTier[];
  logs: { id: string; userId: string; action: string; timestamp: string }[];
  walletSummary: { totalPointsIssued: number; totalEuroValueIssued: number; totalPointsRedeemed: number };
  recentTransactions: any[];
  giftCardsSummary: { activeCards: number; totalLiability: number };
  giftCards: any[];
  paymentsLedger: any[];
  blogCategories: any[];
  blogPosts: any[];
  clinics: any[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  metrics: { leads: 0, conversions: 0, revenue: 0 },
  users: [],
  loyaltyTiers: [],
  logs: [],
  walletSummary: { totalPointsIssued: 0, totalEuroValueIssued: 0, totalPointsRedeemed: 0 },
  recentTransactions: [],
  giftCardsSummary: { activeCards: 0, totalLiability: 0 },
  giftCards: [],
  paymentsLedger: [],
  blogCategories: [],
  blogPosts: [],
  clinics: [],
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

export const createNewUser = createAsyncThunk(
  "admin/createNewUser",
  async (userData: any) => {
    const response = await adminAPI.createUser(userData);
    return response.data;
  }
);

export const updateUserDetails = createAsyncThunk(
  "admin/updateUserDetails",
  async (updateData: { id: string; role?: string; monthlyTarget?: number; assignedClinicIds?: string[] }) => {
    const { id, ...data } = updateData;
    const response = await adminAPI.updateUser(id, data);
    return response.data;
  }
);

export const toggleUserStatus = createAsyncThunk(
  "admin/toggleUserStatus",
  async (id: string) => {
    const response = await adminAPI.toggleUserStatus(id);
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

export const fetchWalletSummary = createAsyncThunk("admin/fetchWalletSummary", async () => {
  const response = await adminAPI.getWalletSummary();
  return response.data;
});

export const fetchRecentTransactions = createAsyncThunk("admin/fetchRecentTransactions", async () => {
  const response = await adminAPI.getRecentTransactions();
  return response.data;
});

export const fetchGiftCardsSummary = createAsyncThunk("admin/fetchGiftCardsSummary", async () => {
  const response = await adminAPI.getGiftCardsSummary();
  return response.data;
});

export const fetchGiftCards = createAsyncThunk("admin/fetchGiftCards", async (search?: string) => {
  const response = await adminAPI.getGiftCards(search);
  return response.data;
});

export const generateGiftCard = createAsyncThunk("admin/generateGiftCard", async (data: any) => {
  const response = await adminAPI.generateGiftCard(data);
  return response.data;
});

export const redeemGiftCardThunk = createAsyncThunk("admin/redeemGiftCard", async (data: { code: string; amount: number }) => {
  const response = await adminAPI.redeemGiftCard(data);
  return response.data;
});

export const fetchPaymentsLedger = createAsyncThunk(
  "admin/fetchPaymentsLedger",
  async (params?: { type?: string; date?: string }) => {
    const response = await adminAPI.getPaymentsLedger(params);
    return response.data;
  }
);

export const fetchBlogCategories = createAsyncThunk("admin/fetchBlogCategories", async () => {
  const response = await adminAPI.getBlogCategories();
  return response.data;
});

export const fetchBlogPosts = createAsyncThunk("admin/fetchBlogPosts", async (search?: string) => {
  const response = await adminAPI.getBlogPosts(search);
  return response.data;
});

export const createBlogCategory = createAsyncThunk("admin/createBlogCategory", async (data: any) => {
  const response = await adminAPI.createBlogCategory(data);
  return response.data;
});

export const createBlogPost = createAsyncThunk("admin/createBlogPost", async (data: any) => {
  const response = await adminAPI.createBlogPost(data);
  return response.data;
});

export const toggleBlogPostStatus = createAsyncThunk("admin/toggleBlogPostStatus", async (post: any) => {
  const response = await adminAPI.updateBlogPost(post.id, { isPublished: !post.isPublished });
  return response.data;
});

export const deleteBlogPost = createAsyncThunk("admin/deleteBlogPost", async (id: string) => {
  await adminAPI.deleteBlogPost(id);
  return id;
});

export const fetchAdminClinics = createAsyncThunk("admin/fetchAdminClinics", async () => {
  const response = await adminAPI.getClinics();
  return response.data.clinics;
});

export const createAdminClinic = createAsyncThunk("admin/createAdminClinic", async (data: any) => {
  const response = await adminAPI.createClinic(data);
  return response.data;
});

export const updateAdminClinic = createAsyncThunk("admin/updateAdminClinic", async (updateData: { id: string, data: any }) => {
  const response = await adminAPI.updateClinic(updateData.id, updateData.data);
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
      .addCase(createNewUser.fulfilled, (state, action) => {
        state.users.unshift(action.payload.user || action.payload);
      })
      .addCase(updateUserDetails.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
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
      })
      .addCase(fetchWalletSummary.fulfilled, (state, action) => {
        state.walletSummary = action.payload;
      })
      .addCase(fetchRecentTransactions.fulfilled, (state, action) => {
        state.recentTransactions = action.payload;
      })
      .addCase(fetchGiftCardsSummary.fulfilled, (state, action) => {
        state.giftCardsSummary = action.payload;
      })
      .addCase(fetchGiftCards.fulfilled, (state, action) => {
        state.giftCards = action.payload;
      })
      .addCase(generateGiftCard.fulfilled, (state, action) => {
        state.giftCards.unshift(action.payload);
        state.giftCardsSummary.activeCards += 1;
        state.giftCardsSummary.totalLiability += Number(action.payload.balance);
      })
      .addCase(redeemGiftCardThunk.fulfilled, (state, action) => {
        const payload = action.payload;
        const index = state.giftCards.findIndex((c) => c.code === payload.code);
        if (index !== -1) {
          state.giftCards[index].balance = payload.remainingBalance;
          if (payload.remainingBalance <= 0) {
            state.giftCards[index].isActive = false;
            state.giftCardsSummary.activeCards -= 1;
          }
        }
        state.giftCardsSummary.totalLiability -= payload.redeemedAmount;
        (state.giftCardsSummary as any).totalRedeemed = ((state.giftCardsSummary as any).totalRedeemed || 0) + payload.redeemedAmount;
      })
      .addCase(fetchPaymentsLedger.fulfilled, (state, action) => {
        state.paymentsLedger = action.payload; // I'll keep the whole object in state or just items based on existing usage
      })
      .addCase(fetchBlogCategories.fulfilled, (state, action) => {
        state.blogCategories = action.payload;
      })
      .addCase(fetchBlogPosts.fulfilled, (state, action) => {
        state.blogPosts = action.payload;
      })
      .addCase(createBlogCategory.fulfilled, (state, action) => {
        state.blogCategories.push(action.payload);
      })
      .addCase(createBlogPost.fulfilled, (state, action) => {
        state.blogPosts.unshift(action.payload);
      })
      .addCase(toggleBlogPostStatus.fulfilled, (state, action) => {
        const index = state.blogPosts.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.blogPosts[index] = action.payload;
        }
      })
      .addCase(deleteBlogPost.fulfilled, (state, action) => {
        state.blogPosts = state.blogPosts.filter((p) => p.id !== action.payload);
      })
      .addCase(fetchAdminClinics.fulfilled, (state, action) => {
        state.clinics = action.payload;
      })
      .addCase(createAdminClinic.fulfilled, (state, action) => {
        state.clinics.unshift(action.payload);
      })
      .addCase(updateAdminClinic.fulfilled, (state, action) => {
        const index = state.clinics.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.clinics[index] = action.payload;
        }
      });
  },
});

export const { clearError } = adminSlice.actions;
const adminReducer: Reducer<AdminState> = adminSlice.reducer;
export default adminReducer;
