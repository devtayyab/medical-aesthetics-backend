import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { clinicsAPI, bookingAPI, loyaltyAPI } from "@/services/api";
import type { Clinic, Appointment, TimeSlot, LoyaltyBalance } from "@/types";

interface ClinicState {
  profile: Clinic | null;
  appointments: Appointment[];
  availability: TimeSlot[];
  reports: any; // Loyalty reports
  isLoading: boolean;
  error: string | null;
}

const initialState: ClinicState = {
  profile: null,
  appointments: [],
  availability: [],
  reports: null,
  isLoading: false,
  error: null,
};

export const fetchClinicProfile = createAsyncThunk(
  "clinic/fetchProfile",
  async () => {
    const response = await clinicsAPI.getById("me"); // Assume /clinics/me for own profile
    return response.data;
  }
);

export const updateClinicProfile = createAsyncThunk(
  "clinic/updateProfile",
  async (data: Partial<Clinic>) => {
    const response = api.patch("/clinics/me", data); // Assume /clinics/me for update
    return response.data;
  }
);

export const fetchClinicAppointments = createAsyncThunk(
  "clinic/fetchAppointments",
  async () => {
    const response = await bookingAPI.getUserAppointments(); // Reuse or add /clinics/me/appointments
    return response.data;
  }
);

export const updateAvailability = createAsyncThunk(
  "clinic/updateAvailability",
  async (data: { date: string; slots: TimeSlot[] }) => {
    const response = await clinicsAPI.updateAvailability(data);
    return response.data;
  }
);

export const recordExecution = createAsyncThunk(
  "clinic/recordExecution",
  async (data: {
    appointmentId: string;
    paymentMethod: string;
    finalAmount: number;
  }) => {
    const response = await bookingAPI.recordExecution(data);
    return response.data;
  }
);

export const fetchLoyaltyReports = createAsyncThunk(
  "clinic/fetchLoyaltyReports",
  async (clinicId: string) => {
    const response = await loyaltyAPI.getReports(clinicId);
    return response.data;
  }
);

const clinicSlice = createSlice({
  name: "clinic",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClinicProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(updateClinicProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(fetchClinicAppointments.fulfilled, (state, action) => {
        state.appointments = action.payload;
      })
      .addCase(updateAvailability.fulfilled, (state, action) => {
        state.availability = action.payload;
      })
      .addCase(recordExecution.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(
          (a) => a.id === action.payload.id
        );
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
      })
      .addCase(fetchLoyaltyReports.fulfilled, (state, action) => {
        state.reports = action.payload;
      });
  },
});

export const { clearError } = clinicSlice.actions;
export default clinicSlice.reducer;
