import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { bookingAPI } from '@/services/api';
import type { BookingFlow, Service, TimeSlot, Appointment } from '@/types';

interface BookingState extends BookingFlow {
  availableSlots: TimeSlot[];
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  holdId?: string;
}

const initialState: BookingState = {
  selectedServices: [],
  totalAmount: 0,
  step: 'services',
  availableSlots: [],
  appointments: [],
  isLoading: false,
  error: null,
};

export const fetchAvailability = createAsyncThunk(
  'booking/fetchAvailability',
  async (params: {
    clinicId: string;
    serviceId: string;
    providerId: string;
    date: string;
  }) => {
    const response = await bookingAPI.getAvailability(params);
    return response.data;
  }
);

export const holdTimeSlot = createAsyncThunk(
  'booking/holdSlot',
  async (data: {
    clinicId: string;
    serviceId: string;
    providerId: string;
    startTime: string;
    endTime: string;
  }) => {
    const response = await bookingAPI.holdSlot(data);
    return response.data;
  }
);

export const createAppointment = createAsyncThunk(
  'booking/createAppointment',
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
  }) => {
    const response = await bookingAPI.createAppointment(data);
    return response.data;
  }
);

export const fetchUserAppointments = createAsyncThunk(
  'booking/fetchUserAppointments',
  async () => {
    const response = await bookingAPI.getUserAppointments();
    return response.data;
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    addService: (state, action: PayloadAction<Service>) => {
      const service = action.payload;
      const existingIndex = state.selectedServices.findIndex(s => s.id === service.id);
      
      if (existingIndex === -1) {
        state.selectedServices.push(service);
        state.totalAmount += service.price;
      }
    },
    removeService: (state, action: PayloadAction<string>) => {
      const serviceId = action.payload;
      const serviceIndex = state.selectedServices.findIndex(s => s.id === serviceId);
      
      if (serviceIndex !== -1) {
        const service = state.selectedServices[serviceIndex];
        state.selectedServices.splice(serviceIndex, 1);
        state.totalAmount -= service.price;
      }
    },
    setSelectedClinic: (state, action) => {
      state.selectedClinic = action.payload;
    },
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
    setSelectedTimeSlot: (state, action: PayloadAction<TimeSlot>) => {
      state.selectedTimeSlot = action.payload;
    },
    setStep: (state, action: PayloadAction<BookingFlow['step']>) => {
      state.step = action.payload;
    },
    clearBooking: (state) => {
      state.selectedClinic = undefined;
      state.selectedServices = [];
      state.selectedDate = undefined;
      state.selectedTimeSlot = undefined;
      state.totalAmount = 0;
      state.step = 'services';
      state.availableSlots = [];
      state.holdId = undefined;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch availability
      .addCase(fetchAvailability.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAvailability.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableSlots = action.payload;
      })
      .addCase(fetchAvailability.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch availability';
      })
      // Hold slot
      .addCase(holdTimeSlot.fulfilled, (state, action) => {
        state.holdId = action.payload.id;
      })
      // Create appointment
      .addCase(createAppointment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.appointments.push(action.payload);
        // Clear booking after successful creation
        state.selectedClinic = undefined;
        state.selectedServices = [];
        state.selectedDate = undefined;
        state.selectedTimeSlot = undefined;
        state.totalAmount = 0;
        state.step = 'services';
        state.availableSlots = [];
        state.holdId = undefined;
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create appointment';
      })
      // Fetch user appointments
      .addCase(fetchUserAppointments.fulfilled, (state, action) => {
        state.appointments = action.payload;
      });
  },
});

export const {
  addService,
  removeService,
  setSelectedClinic,
  setSelectedDate,
  setSelectedTimeSlot,
  setStep,
  clearBooking,
  clearError,
} = bookingSlice.actions;

export default bookingSlice.reducer;