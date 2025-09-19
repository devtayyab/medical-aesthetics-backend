import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { clinicsAPI, bookingAPI, loyaltyAPI } from "@/services/api";
import type {
  Clinic,
  Service,
  Appointment,
  TimeSlot,
  LoyaltyBalance,
  SearchFilters,
} from "@/types";

interface ClientState {
  clinics: Clinic[];
  featuredClinics: Clinic[];
  selectedClinic: Clinic | null;
  services: Service[];
  availableSlots: TimeSlot[];
  appointments: Appointment[];
  loyaltyBalance: LoyaltyBalance | null;
  isLoading: boolean;
  error: string | null;
  searchFilters: SearchFilters;
  hasMore: boolean;
  total: number;
  holdId?: string; // Added to store hold ID
}

const initialState: ClientState = {
  clinics: [
    {
      id: "1",
      name: "Aesthetic Clinic A",
      description: "Premium aesthetic services",
      address: { street: "123 Main St", city: "New York", state: "NY", zipCode: "10001", country: "USA" },
      phone: "+1-234-567-8901",
      email: "info@clinicA.com",
      services: [{ id: "1", name: "Botox", price: 500, durationMinutes: 30, category: "Aesthetics" }],
      rating: 4.8,
      reviewCount: 120,
      isActive: true,
      ownerId: "owner1",
    },
  ],
  featuredClinics: [
    {
      id: "2",
      name: "Featured Clinic B",
      description: "Top-rated dermatology",
      address: { street: "456 Oak Ave", city: "Los Angeles", state: "CA", zipCode: "90210", country: "USA" },
      phone: "+1-234-567-8902",
      email: "info@clinicB.com",
      services: [{ id: "2", name: "Laser Treatment", price: 800, durationMinutes: 60, category: "Dermatology" }],
      rating: 4.9,
      reviewCount: 200,
      isActive: true,
      ownerId: "owner2",
    },
  ],
  selectedClinic: null,
  services: [],
  availableSlots: [],
  appointments: [
    {
      id: "1",
      clinicId: "1",
      serviceId: "1",
      providerId: "provider1",
      clientId: "client1",
      startTime: "2025-09-15T10:00:00.000Z",
      endTime: "2025-09-15T10:30:00.000Z",
      status: "confirmed",
      notes: "First session",
      paymentMethod: "credit_card",
      totalAmount: 500,
      clinic: { name: "Aesthetic Clinic A" },
      service: { name: "Botox" },
      provider: { firstName: "Dr. Smith" },
      client: { firstName: "John" },
    },
  ],
  loyaltyBalance: null,
  isLoading: false,
  error: null,
  searchFilters: {},
  hasMore: true,
  total: 0,
  holdId: undefined,
};

export const searchClinics = createAsyncThunk(
  "client/searchClinics",
  async (params: SearchFilters, { rejectWithValue }) => {
    try {
      const response = await clinicsAPI.search(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to search clinics");
    }
  }
);

export const fetchFeaturedClinics = createAsyncThunk(
  "client/fetchFeaturedClinics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await clinicsAPI.getFeatured();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch featured clinics");
    }
  }
);

export const fetchClinicById = createAsyncThunk(
  "client/fetchClinicById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await clinicsAPI.getById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch clinic");
    }
  }
);

export const fetchClinicServices = createAsyncThunk(
  "client/fetchClinicServices",
  async (clinicId: string, { rejectWithValue }) => {
    try {
      const response = await clinicsAPI.getServices(clinicId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch services");
    }
  }
);

export const fetchAvailability = createAsyncThunk(
  "client/fetchAvailability",
  async (params: {
    clinicId: string;
    serviceId: string;
    providerId: string;
    date: string;
  }, { rejectWithValue }) => {
    try {
      const response = await bookingAPI.getAvailability(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch availability");
    }
  }
);

export const holdSlot = createAsyncThunk(
  "client/holdSlot",
  async (data: {
    clinicId: string;
    serviceId: string;
    providerId: string;
    startTime: string;
    endTime: string;
  }, { rejectWithValue }) => {
    try {
      const response = await bookingAPI.holdSlot(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to hold slot");
    }
  }
);

export const createAppointment = createAsyncThunk(
  "client/createAppointment",
  async (data: {
    clinicId: string;
    serviceId: string;
    providerId: string;
    clientId: string;
    startTime: string;
    endTime: string;
    notes?: string;
    paymentMethod?: string;
    advancePaymentAmount?: number;
    holdId?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await bookingAPI.createAppointment(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to create appointment");
    }
  }
);

export const fetchUserAppointments = createAsyncThunk(
  "client/fetchUserAppointments",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      console.log('fetchUserAppointments: Using accessToken:', state.auth.accessToken ? `${state.auth.accessToken.substring(0, 20)}...` : 'missing');
      const response = await bookingAPI.getUserAppointments();
      console.log('fetchUserAppointments: Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('fetchUserAppointments: Error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || "Failed to fetch appointments");
    }
  }
);

export const cancel = createAsyncThunk(
  "client/cancelAppointment",
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      const response = await bookingAPI.cancel(appointmentId);
      return { id: appointmentId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to cancel appointment"
      );
    }
  }
);

export const reschedule = createAsyncThunk(
  "client/rescheduleAppointment",
  async (
    {
      appointmentId,
      newStartTime,
      newEndTime,
    }: { appointmentId: string; newStartTime: string; newEndTime: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await bookingAPI.reschedule(appointmentId, newStartTime, newEndTime);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reschedule appointment"
      );
    }
  }
);

export const fetchLoyaltyBalance = createAsyncThunk(
  "client/fetchLoyaltyBalance",
  async (clientId: string, { rejectWithValue }) => {
    try {
      const response = await loyaltyAPI.getBalance(clientId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch loyalty balance");
    }
  }
);

export const fetchLoyaltyHistory = createAsyncThunk(
  "client/fetchLoyaltyHistory",
  async (clientId: string, { rejectWithValue }) => {
    try {
      const response = await loyaltyAPI.getHistory(clientId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch loyalty history");
    }
  }
);

export const redeemPoints = createAsyncThunk(
  "client/redeemPoints",
  async (data: {
    clientId: string;
    clinicId: string;
    points: number;
    description: string;
  }, { rejectWithValue }) => {
    try {
      const response = await loyaltyAPI.redeemPoints(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to redeem points");
    }
  }
);

const clientSlice = createSlice({
  name: "client",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSearchFilters: (state, action: PayloadAction<SearchFilters>) => {
      state.searchFilters = action.payload;
    },
    clearSelectedClinic: (state) => {
      state.selectedClinic = null;
      state.services = [];
      state.availableSlots = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchClinics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchClinics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clinics = action.payload.clinics;
        state.total = action.payload.total;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(searchClinics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchFeaturedClinics.fulfilled, (state, action) => {
        state.featuredClinics = action.payload;
      })
      .addCase(fetchClinicById.fulfilled, (state, action) => {
        state.selectedClinic = action.payload;
      })
      .addCase(fetchClinicServices.fulfilled, (state, action) => {
        state.services = action.payload;
      })
      .addCase(fetchAvailability.fulfilled, (state, action) => {
        state.availableSlots = action.payload;
      })
      .addCase(holdSlot.fulfilled, (state, action) => {
        state.holdId = action.payload.id;
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.appointments.push(action.payload);
        state.holdId = undefined;
      })
      .addCase(fetchUserAppointments.fulfilled, (state, action) => {
        state.appointments = action.payload;
      })
      .addCase(fetchLoyaltyBalance.fulfilled, (state, action) => {
        state.loyaltyBalance = action.payload;
      })
      .addCase(cancel.fulfilled, (state, action) => {
        state.appointments = state.appointments.map((appointment) =>
          appointment.id === action.payload.id
            ? { ...appointment, status: "cancelled" }
            : appointment
        );
      })
      .addCase(cancel.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(reschedule.fulfilled, (state, action) => {
        state.appointments = state.appointments.map((appointment) =>
          appointment.id === action.payload.id
            ? {
                ...appointment,
                startTime: action.payload.startTime,
                endTime: action.payload.endTime,
              }
            : appointment
        );
      })
      .addCase(reschedule.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setSearchFilters, clearSelectedClinic } =
  clientSlice.actions;
export default clientSlice.reducer;