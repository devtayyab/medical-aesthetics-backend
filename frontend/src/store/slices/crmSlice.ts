import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { crmAPI } from "@/services/api";
import type { Lead, Task, ActionLog } from "@/types";

export interface CrmState {
  leads: Lead[];
  selectedLead: Lead | null;
  tasks: Task[];
  actions: ActionLog[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CrmState = {
  leads: [],
  selectedLead: null,
  tasks: [],
  actions: [],
  isLoading: false,
  error: null,
};

export const createLead = createAsyncThunk(
  "crm/createLead",
  async (data: {
    name: string;
    email: string;
    phone?: string;
    tags?: string[];
    status: string;
  }) => {
    const response = await crmAPI.createLead(data);
    return response.data;
  }
);

export const fetchLeads = createAsyncThunk("crm/fetchLeads", async () => {
  const response = await crmAPI.getLeads();
  return response.data;
});

export const fetchLead = createAsyncThunk(
  "crm/fetchLead",
  async (id: string) => {
    const response = await crmAPI.getLead(id);
    return response.data;
  }
);

export const updateLead = createAsyncThunk(
  "crm/updateLead",
  async (data: { id: string; updates: Partial<Lead> }) => {
    const response = await crmAPI.updateLead(data.id, data.updates);
    return response.data;
  }
);

export const logAction = createAsyncThunk(
  "crm/logAction",
  async (data: { customerId: string; type: string; notes: string }) => {
    const response = await crmAPI.logAction(data.customerId, data);
    return response.data;
  }
);

export const createTask = createAsyncThunk(
  "crm/createTask",
  async (data: {
    customerId: string;
    description: string;
    type: string;
    dueDate: string;
    assignedTo: string;
  }) => {
    const response = await crmAPI.createTask(data);
    return response.data;
  }
);

export const fetchTasks = createAsyncThunk(
  "crm/fetchTasks",
  async (salespersonId: string) => {
    const response = await crmAPI.getTasks(salespersonId);
    return response.data;
  }
);

export const updateTask = createAsyncThunk(
  "crm/updateTask",
  async (data: { id: string; updates: Partial<Task> }) => {
    const response = await crmAPI.updateTask(data.id, data.updates);
    return response.data;
  }
);

export const scheduleRecurring = createAsyncThunk(
  "crm/scheduleRecurring",
  async (data: {
    customerId: string;
    serviceId: string;
    frequency: string;
    startDate: string;
  }) => {
    const response = await crmAPI.scheduleRecurring(data);
    return response.data;
  }
);

const crmSlice = createSlice({
  name: "crm",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createLead.fulfilled, (state, action) => {
        state.leads.push(action.payload);
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.leads = action.payload;
      })
      .addCase(fetchLead.fulfilled, (state, action) => {
        state.selectedLead = action.payload;
      })
      .addCase(updateLead.fulfilled, (state, action) => {
        const index = state.leads.findIndex((l) => l.id === action.payload.id);
        if (index !== -1) {
          state.leads[index] = action.payload;
        }
        if (state.selectedLead?.id === action.payload.id) {
          state.selectedLead = action.payload;
        }
      })
      .addCase(logAction.fulfilled, (state, action) => {
        state.actions.push(action.payload);
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.tasks = action.payload;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      });
  },
});

export const { clearError } = crmSlice.actions;
export default crmSlice.reducer;
