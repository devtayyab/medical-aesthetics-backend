import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { crmAPI } from "@/services/api";
import type { Lead, Task, ActionsLog, FormSubmission, Communication } from "@/types";

export interface CrmState {
  leads: Lead[];
  selectedLead: Lead | null;
  tasks: Task[];
  actions: ActionsLog[];
  formSubmissions: FormSubmission[];
  communications: Communication[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CrmState = {
  leads: [],
  selectedLead: null,
  tasks: [],
  actions: [],
  formSubmissions: [],
  communications: [],
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

export const fetchLead = createAsyncThunk(
  "crm/fetchLead",
  async (id: string) => {
    const response = await crmAPI.getLead(id);
    return response.data;
  }
);

export const fetchLeads = createAsyncThunk(
  "crm/fetchLead",
  async () => {
    const response = await crmAPI.getLeads();
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
  async (data: {
    customerId: string;
    salespersonId: string;
    actionType: string;
    title: string;
    description?: string;
  }) => {
    const response = await crmAPI.logAction(data);
    return response.data;
  }
);


export const fetchActions = createAsyncThunk(
  "crm/fetchActions",
  async () => {
    const response = await crmAPI.getActions();
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
export const fetchCustomerRecord = createAsyncThunk(
  "crm/fetchCustomerRecord",
  async (customerId: string) => {
    const response = await crmAPI.getCustomerRecord(customerId);
    return response.data;
  }
);

export const updateCustomerRecord = createAsyncThunk(
  "crm/updateCustomerRecord",
  async ({ customerId, data }: { customerId: string; data: any }) => {
    const response = await crmAPI.updateCustomerRecord(customerId, data);
    return response.data;
  }
);

// ---- Communications ----
export const logCommunication = createAsyncThunk(
  "crm/logCommunication",
  async (data: { customerId: string; salespersonId: string; type: string; title: string; description?: string }) => {
    const response = await crmAPI.logCommunication(data);
    return response.data;
  }
);

export const fetchCustomerCommunications = createAsyncThunk(
  "crm/fetchCustomerCommunications",
  async (customerId: string) => {
    const response = await crmAPI.getCustomerCommunications(customerId);
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
    builder.addCase(fetchCustomerRecord.fulfilled, (state, action) => {
      state.selectedLead = action.payload.lead;
      state.actions = action.payload.actions;
      state.formSubmissions = action.payload.forms;
    });

    builder.addCase(fetchCustomerCommunications.fulfilled, (state, action) => {
      state.communications = action.payload;
    });

  },
});

export const { clearError } = crmSlice.actions;
export default crmSlice.reducer;
