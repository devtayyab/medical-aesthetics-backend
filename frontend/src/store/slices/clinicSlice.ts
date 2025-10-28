import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import clinicApi from '../../services/api/clinicApi';
import {
  ClinicProfile,
  Service,
  Appointment,
  AppointmentFilters,
  CompleteAppointmentDto,
  RecordPaymentDto,
  Client,
  Review,
  ReviewStatistics,
  AvailabilitySettings,
  AppointmentStatus,
} from '../../types/clinic.types';

export interface ClinicState {
  profile: ClinicProfile | null;
  services: Service[];
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  clients: Client[];
  reviews: Review[];
  reviewStats: ReviewStatistics | null;
  availability: AvailabilitySettings | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ClinicState = {
  profile: null,
  services: [],
  appointments: [],
  selectedAppointment: null,
  clients: [],
  reviews: [],
  reviewStats: null,
  availability: null,
  isLoading: false,
  error: null,
};

// Async Thunks
export const fetchClinicProfile = createAsyncThunk(
  'clinic/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await clinicApi.clinicProfile.getProfile();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const updateClinicProfile = createAsyncThunk(
  'clinic/updateProfile',
  async (data: Partial<ClinicProfile>, { rejectWithValue }) => {
    try {
      return await clinicApi.clinicProfile.updateProfile(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const fetchServices = createAsyncThunk(
  'clinic/fetchServices',
  async (_, { rejectWithValue }) => {
    try {
      return await clinicApi.services.getAll();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch services');
    }
  }
);

export const fetchAppointments = createAsyncThunk(
  'clinic/fetchAppointments',
  async (filters: AppointmentFilters | undefined, { rejectWithValue }) => {
    try {
      return await clinicApi.appointments.getAll(filters);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch appointments');
    }
  }
);

export const fetchAppointmentById = createAsyncThunk(
  'clinic/fetchAppointmentById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await clinicApi.appointments.getById(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch appointment');
    }
  }
);

export const updateAppointmentStatus = createAsyncThunk(
  'clinic/updateAppointmentStatus',
  async (
    { id, status, notes, treatmentDetails }: {
      id: string;
      status: AppointmentStatus;
      notes?: string;
      treatmentDetails?: any;
    },
    { rejectWithValue }
  ) => {
    try {
      return await clinicApi.appointments.updateStatus(id, status, notes, treatmentDetails);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update status');
    }
  }
);

export const completeAppointment = createAsyncThunk(
  'clinic/completeAppointment',
  async ({ id, data }: { id: string; data: CompleteAppointmentDto }, { rejectWithValue }) => {
    try {
      return await clinicApi.appointments.complete(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to complete appointment');
    }
  }
);

export const rescheduleAppointment = createAsyncThunk(
  'clinic/rescheduleAppointment',
  async (
    { id, startTime, endTime, reason }: {
      id: string;
      startTime: string;
      endTime: string;
      reason?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      return await clinicApi.appointments.reschedule(id, startTime, endTime, reason);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reschedule');
    }
  }
);

export const fetchClients = createAsyncThunk(
  'clinic/fetchClients',
  async (params: { limit?: number; offset?: number } | undefined = undefined, { rejectWithValue }) => {
    try {
      const response = await clinicApi.clients.getAll(params);
      // Map raw response to Client type
      const mappedClients: Client[] = response.clients.map((client: any) => ({
        id: client.appointment_clientId,
        name: client.clientname,
        email: client.clientemail,
        phone: client.clientphone,
        totalVisits: parseInt(client.totalvisits, 10),
        totalSpent: parseFloat(client.totalspent || '0') || 0,
        lastVisit: client.lastvisit,
      }));
      return mappedClients;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch clients');
    }
  }
);

export const fetchReviews = createAsyncThunk(
  'clinic/fetchReviews',
  async (params: { limit?: number; offset?: number } | undefined = undefined, { rejectWithValue }) => {
    try {
      const data = await clinicApi.reviews.getAll(params);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reviews');
    }
  }
);

export const fetchReviewStatistics = createAsyncThunk(
  'clinic/fetchReviewStatistics',
  async (_, { rejectWithValue }) => {
    try {
      return await clinicApi.reviews.getStatistics();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch statistics');
    }
  }
);

export const fetchAvailability = createAsyncThunk(
  'clinic/fetchAvailability',
  async (_, { rejectWithValue }) => {
    try {
      return await clinicApi.availability.get();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch availability');
    }
  }
);

export const updateAvailability = createAsyncThunk(
  'clinic/updateAvailability',
  async (data: AvailabilitySettings, { rejectWithValue }) => {
    try {
      return await clinicApi.availability.update(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update availability');
    }
  }
);

const clinicSlice = createSlice({
  name: 'clinic',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedAppointment: (state) => {
      state.selectedAppointment = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Clients
      .addCase(fetchClients.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clients = action.payload;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Profile
      .addCase(fetchClinicProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClinicProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchClinicProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update Profile
      .addCase(updateClinicProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      // Services
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.services = action.payload;
      })
      // Appointments
      .addCase(fetchAppointments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.appointments = action.payload;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Appointment by ID
      .addCase(fetchAppointmentById.fulfilled, (state, action) => {
        state.selectedAppointment = action.payload;
      })
      // Update Status
      .addCase(updateAppointmentStatus.fulfilled, (state, action) => {
        const index = state.appointments.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
        if (state.selectedAppointment?.id === action.payload.id) {
          state.selectedAppointment = action.payload;
        }
      })
      // Complete Appointment
      .addCase(completeAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
        if (state.selectedAppointment?.id === action.payload.id) {
          state.selectedAppointment = action.payload;
        }
      })
      // Reschedule
      .addCase(rescheduleAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
      })
      // Reviews
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.reviews = action.payload.reviews;
      })
      .addCase(fetchReviewStatistics.fulfilled, (state, action) => {
        state.reviewStats = action.payload;
      })
      // Availability
      .addCase(fetchAvailability.fulfilled, (state, action) => {
        state.availability = action.payload;
      })
      .addCase(updateAvailability.fulfilled, (state, action) => {
        state.availability = action.payload;
      });
  },
});

export const { clearError, clearSelectedAppointment } = clinicSlice.actions;
export default clinicSlice.reducer;
