import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { clinicsAPI } from '@/services/api';
import type { Clinic, Service, SearchFilters, NewClinics } from '@/types';

interface ClinicsState {
  clinics: Clinic[];
  clinic:NewClinics[];
  featuredClinics: Clinic[];
  selectedClinic: Clinic | null;
  services: Service[];
  isLoading: boolean;
  error: string | null;
  searchFilters: SearchFilters;
  hasMore: boolean;
  total: number;
}

const initialState: ClinicsState = {
  clinics: [],
   clinic: [{ id: "1", name: "Botox Treatment", location: "Lahore, Pakistan", amount: 1, },
  { id: "2", name: "Hyalouronic Acid", location: "Lahore, Pakistan", amount: 1, }, ],
  featuredClinics: [],
  selectedClinic: null,
  services: [],
  isLoading: false,
  error: null,
  searchFilters: {},
  hasMore: true,
  total: 0,
};

export const searchClinics = createAsyncThunk(
  'clinics/search',
  async (params: {
    location?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await clinicsAPI.search(params);
    return response.data;
  }
);

export const fetchFeaturedClinics = createAsyncThunk(
  'clinics/fetchFeatured',
  async () => {
    const response = await clinicsAPI.getFeatured();
    return response.data;
  }
);
// export const fetchClinics = createAsyncThunk(
//   'clinics/fetchFeatured',
//   async () => {
//     const response = await clinicsAPI.getFeatured();
//     return response.data;
//   }
// );

export const fetchClinicById = createAsyncThunk(
  'clinics/fetchById',
  async (id: string) => {
    const response = await clinicsAPI.getById(id);
    return response.data;
  }
);

export const fetchClinicServices = createAsyncThunk(
  'clinics/fetchServices',
  async (clinicId: string) => {
    const response = await clinicsAPI.getServices(clinicId);
    return response.data;
  }
);

const clinicsSlice = createSlice({
  name: 'clinics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSearchFilters: (state, action) => {
      state.searchFilters = { ...state.searchFilters, ...action.payload };
    },
    clearSearchResults: (state) => {
      state.clinics = [];
      state.hasMore = true;
      state.total = 0;
    },
    clearSelectedClinic: (state) => {
      state.selectedClinic = null;
      state.services = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Search clinics
      .addCase(searchClinics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchClinics.fulfilled, (state, action) => {
        state.isLoading = false;
        const { clinics, total, offset } = action.payload;
        
        if (offset === 0) {
          state.clinics = clinics;
        } else {
          state.clinics = [...state.clinics, ...clinics];
        }
        
        state.total = total;
        state.hasMore = state.clinics.length < total;
      })
      .addCase(searchClinics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to search clinics';
      })
      // Featured clinics
      .addCase(fetchFeaturedClinics.fulfilled, (state, action) => {
        state.featuredClinics = action.payload;
      })
      // Clinic by ID
      .addCase(fetchClinicById.fulfilled, (state, action) => {
        state.selectedClinic = action.payload;
      })
      // Clinic services
      .addCase(fetchClinicServices.fulfilled, (state, action) => {
        state.services = action.payload;
      });
  },
});

export const { clearError, setSearchFilters, clearSearchResults, clearSelectedClinic } = clinicsSlice.actions;
export default clinicsSlice.reducer;