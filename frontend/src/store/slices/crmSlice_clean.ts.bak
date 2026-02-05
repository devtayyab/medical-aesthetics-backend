import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { crmAPI } from '@/services/api';
import type { CrmFilters, CrmAnalytics } from '@/types';
import type { Lead, CustomerRecord, CommunicationLog, CrmAction, CustomerTag, CustomerSummary, DuplicateCheckResult, TaskAutomationRule, ValidationResult, RequiredFields, FacebookLeadData, ParsedFacebookLead, User, Task } from '@/types';

interface CrmState {
  // Lead Management
  leads: Lead[];
  selectedLead: Lead | null;
  leadFilters: CrmFilters;

  // Customer Management
  customer: User | null;
  customerRecord: CustomerRecord | null;
  customerFilters: CrmFilters;

  // Actions/Activity Log
  actions: CrmAction[];
  pendingActions: CrmAction[];
  overdueActions: CrmAction[];
  communications: CommunicationLog[];
  communicationFilters: {
    type?: string;
    startDate?: string;
    endDate?: string;
  };

  // Repeat Customer Management
  repeatCustomers: CustomerSummary[];
  followUpCustomers: CustomerSummary[];
  recurringSchedule: any;

  // Task Automation
  automationRules: TaskAutomationRule[];

  // Analytics
  analytics: CrmAnalytics | null;

  // Validation
  fieldValidation: ValidationResult | null;
  duplicateCheck: DuplicateCheckResult | null;

  // UI State
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: CrmState = {
  // Lead Management
  leads: [],
  selectedLead: null,
  leadFilters: {},

  // Customer Management
  customer: null,
  customerRecord: null,
  customerFilters: {},

  // Actions/Activity Log
  actions: [],
  pendingActions: [],
  overdueActions: [],
  communications: [],
  communicationFilters: {},

  // Repeat Customer Management
  repeatCustomers: [],
  followUpCustomers: [],
  recurringSchedule: {},

  // Task Automation
  automationRules: [],

  // Analytics
  analytics: null,

  // Validation
  fieldValidation: null,
  duplicateCheck: null,

  // UI State
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Lead Management
export const createLead = createAsyncThunk(
  "crm/createLead",
  async (data: {
    source: string;
    facebookAdId?: string;
    facebookLeadData?: any;
    status: string;
    metadata?: any;
  }) => {
    const response = await crmAPI.createLead(data);
    return response.data;
  }
);

export const fetchLeads = createAsyncThunk(
  "crm/fetchLeads",
  async (filters?: CrmFilters) => {
    const response = await crmAPI.getLeads(filters);
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

export const updateLead = createAsyncThunk(
  "crm/updateLead",
  async (data: { id: string; updates: Partial<Lead> }) => {
    const response = await crmAPI.updateLead(data.id, data.updates);
    return response.data;
  }
);

export const deleteLead = createAsyncThunk(
  "crm/deleteLead",
  async (id: string) => {
    await crmAPI.deleteLead(id);
    return id;
  }
);

// Customer Record Management
export const getCustomerRecord = createAsyncThunk(
  "crm/getCustomerRecord",
  async (customerId: string) => {
    const response = await crmAPI.getCustomerRecord(customerId);
    return response.data;
  }
);

export const updateCustomerRecord = createAsyncThunk(
  "crm/updateCustomerRecord",
  async (data: { customerId: string; updateData: any }) => {
    const response = await crmAPI.updateCustomerRecord(data.customerId, data.updateData);
    return response.data;
  }
);

export const getCustomer = createAsyncThunk(
  "crm/getCustomer",
  async (customerId: string) => {
    const response = await crmAPI.getCustomer(customerId);
    return response.data;
  }
);

// Communication Management
export const logCommunication = createAsyncThunk(
  "crm/logCommunication",
  async (data: any) => {
    const response = await crmAPI.logCommunication(data);
    return response.data;
  }
);

export const getCommunicationHistory = createAsyncThunk(
  "crm/getCommunicationHistory",
  async (data: { customerId: string; filters?: any }) => {
    const response = await crmAPI.getCommunicationHistory(data.customerId, data.filters);
    return response.data;
  }
);

// Action/Task Management
export const createAction = createAsyncThunk(
  "crm/createAction",
  async (data: Partial<CrmAction>) => {
    const response = await crmAPI.createAction(data);
    return response.data;
  }
);

export const updateAction = createAsyncThunk(
  "crm/updateAction",
  async (data: { id: string; updates: Partial<CrmAction> }) => {
    const response = await crmAPI.updateAction(data.id, data.updates);
    return response.data;
  }
);

export const deleteAction = createAsyncThunk(
  "crm/deleteAction",
  async (id: string) => {
    await crmAPI.deleteAction(id);
    return id;
  }
);

export const fetchActions = createAsyncThunk(
  "crm/fetchActions",
  async (data: { salespersonId?: string; filters?: any }) => {
    const response = await crmAPI.getActions(data.salespersonId, data.filters);
    return response.data;
  }
);

export const fetchPendingActions = createAsyncThunk(
  "crm/fetchPendingActions",
  async (salespersonId?: string) => {
    const response = await crmAPI.getPendingActions(salespersonId);
    return response.data;
  }
);

export const fetchOverdueTasks = createAsyncThunk(
  "crm/fetchOverdueTasks",
  async (salespersonId?: string) => {
    const response = await crmAPI.getOverdueTasks(salespersonId);
    return response.data;
  }
);

// Customer Tag Management
export const addCustomerTag = createAsyncThunk(
  "crm/addCustomerTag",
  async (data: { customerId: string; tagId: string; addedBy: string; notes?: string }) => {
    const response = await crmAPI.addCustomerTag(data);
    return response.data;
  }
);

export const removeCustomerTag = createAsyncThunk(
  "crm/removeCustomerTag",
  async (id: string) => {
    await crmAPI.removeCustomerTag(id);
    return id;
  }
);

export const fetchCustomersByTag = createAsyncThunk(
  "crm/fetchCustomersByTag",
  async (data: { tagId: string; salespersonId?: string }) => {
    const response = await crmAPI.getCustomersByTag(data.tagId, data.salespersonId);
    return response.data;
  }
);

// Task Automation
export const fetchAutomationRules = createAsyncThunk(
  "crm/fetchAutomationRules",
  async () => {
    const response = await crmAPI.getAutomationRules();
    return response.data;
  }
);

export const runTaskAutomationCheck = createAsyncThunk(
  "crm/runTaskAutomationCheck",
  async () => {
    const response = await crmAPI.runTaskAutomationCheck();
    return response.data;
  }
);

// Field Validation
export const getRequiredFieldsForCall = createAsyncThunk(
  "crm/getRequiredFieldsForCall",
  async () => {
    const response = await crmAPI.getRequiredFieldsForCall();
    return response.data;
  }
);

export const getRequiredFieldsForAction = createAsyncThunk(
  "crm/getRequiredFieldsForAction",
  async (actionType: string) => {
    const response = await crmAPI.getRequiredFieldsForAction(actionType);
    return response.data;
  }
);

export const validateCommunication = createAsyncThunk(
  "crm/validateCommunication",
  async (data: { customerId: string; communicationData: Partial<CommunicationLog> }) => {
    const response = await crmAPI.validateCommunication(data);
    return response.data;
  }
);

export const validateAction = createAsyncThunk(
  "crm/validateAction",
  async (data: { customerId: string; actionData: Partial<CrmAction> }) => {
    const response = await crmAPI.validateAction(data);
    return response.data;
  }
);

// Facebook Integration
export const handleFacebookWebhook = createAsyncThunk(
  "crm/handleFacebookWebhook",
  async (data: any) => {
    const response = await crmAPI.handleFacebookWebhook(data);
    return response.data;
  }
);

export const importFacebookLeads = createAsyncThunk(
  "crm/importFacebookLeads",
  async (data: { formId: string; limit?: number }) => {
    const response = await crmAPI.importFacebookLeads(data.formId, data.limit);
    return response.data;
  }
);

export const testFacebookConnection = createAsyncThunk(
  "crm/testFacebookConnection",
  async () => {
    const response = await crmAPI.testFacebookConnection();
    return response.data;
  }
);

// Analytics
export const fetchSalespersonAnalytics = createAsyncThunk(
  "crm/fetchSalespersonAnalytics",
  async (data: { salespersonId: string; dateRange?: { startDate: string; endDate: string } }) => {
    const response = await crmAPI.getSalespersonAnalytics(data.salespersonId, data.dateRange);
    return response.data;
  }
);

export const fetchCrmMetrics = createAsyncThunk(
  "crm/fetchCrmMetrics",
  async () => {
    const response = await crmAPI.getCrmMetrics();
    return response.data;
  }
);

// Repeat Customer Management
export const fetchRepeatCustomers = createAsyncThunk(
  "crm/fetchRepeatCustomers",
  async (salespersonId?: string) => {
    const response = await crmAPI.identifyRepeatCustomers(salespersonId);
    return response.data;
  }
);

export const fetchCustomersDueForFollowUp = createAsyncThunk(
  "crm/fetchCustomersDueForFollowUp",
  async (data: { salespersonId?: string; daysThreshold?: number }) => {
    const response = await crmAPI.getCustomersDueForFollowUp(data.salespersonId, data.daysThreshold);
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

// Duplicate Management
export const checkForDuplicates = createAsyncThunk(
  "crm/checkForDuplicates",
  async (data: { email?: string; phone?: string; firstName?: string; lastName?: string }) => {
    const response = await crmAPI.checkForDuplicates(data);
    return response.data;
  }
);

export const getDuplicateSuggestions = createAsyncThunk(
  "crm/getDuplicateSuggestions",
  async (data: { email?: string; phone?: string; firstName?: string; lastName?: string }) => {
    const response = await crmAPI.getDuplicateSuggestions(data);
    return response.data;
  }
);

export const mergeDuplicates = createAsyncThunk(
  "crm/mergeDuplicates",
  async (data: { targetId: string; sourceId: string }) => {
    const response = await crmAPI.mergeDuplicates(data.targetId, data.sourceId);
    return response.data;
  }
);

// State cleanup actions
export const clearError = (state) => {
  state.error = null;
};

export const clearSelectedLead = (state) => {
  state.selectedLead = null;
};

export const clearCustomerRecord = (state) => {
  state.customerRecord = null;
};

export const clearDuplicateCheck = (state) => {
  state.duplicateCheck = null;
};

export const clearFieldValidation = (state) => {
  state.fieldValidation = null;
};

export const setLeadFilters = (state, action) => {
  state.leadFilters = action.payload;
};

export const setCustomerFilters = (state, action) => {
  state.customerFilters = action.payload;
};

export const setCommunicationFilters = (state, action) => {
  state.communicationFilters = action.payload;
};

export const clearAllFilters = (state) => {
  state.leadFilters = {};
  state.customerFilters = {};
  state.communicationFilters = {};
};

export const resetState = () => initialState;

const crmSlice = createSlice({
  name: "crm",
  initialState,
  reducers: {
    // State cleanup actions
    clearError,
    clearSelectedLead,
    clearCustomerRecord,
    clearDuplicateCheck,
    clearFieldValidation,
    setLeadFilters,
    setCustomerFilters,
    setCommunicationFilters,
    clearAllFilters,
    resetState,
  },
  extraReducers: (builder) => {
    // Lead Management
    builder
      .addCase(createLead.fulfilled, (state, action) => {
        state.leads.unshift(action.payload);
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.leads = action.payload;
      })
      .addCase(fetchCustomer.fulfilled, (state, action) => {
        state.customer = action.payload;
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
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.leads = state.leads.filter((l) => l.id !== action.payload);
        if (state.selectedLead?.id === action.payload) {
          state.selectedLead = null;
        }
      })

      // Customer Management
      .addCase(fetchCustomerRecord.fulfilled, (state, action) => {
        state.customerRecord = action.payload;
      })
      .addCase(updateCustomerRecord.fulfilled, (state, action) => {
        if (state.customerRecord?.record.customerId === action.payload.customerId) {
          state.customerRecord.record = action.payload;
        }
      })
      .addCase(getCustomer.fulfilled, (state, action) => {
        state.customer = action.payload;
      })

      // Communication Management
      .addCase(logCommunication.fulfilled, (state, action) => {
        state.communications.unshift(action.payload);
        if (state.customerRecord) {
          state.customerRecord.communications?.unshift(action.payload);
        }
      })
      .addCase(fetchCommunicationHistory.fulfilled, (state, action) => {
        state.communications = action.payload;
      })

      // Action/Task Management
      .addCase(createAction.fulfilled, (state, action) => {
        state.actions.unshift(action.payload);
        if (state.customerRecord) {
          state.customerRecord.actions.unshift(action.payload);
        }
      })
      .addCase(updateAction.fulfilled, (state, action) => {
        const taskIndex = state.actions.findIndex((t) => t.id === action.payload.id);
        if (taskIndex !== -1) {
          state.actions[taskIndex] = action.payload;
        }
      })
      .addCase(deleteAction.fulfilled, (state, action) => {
        state.actions = state.actions.filter((t) => t.id !== action.payload);
      })
      .addCase(fetchActions.fulfilled, (state, action) => {
        state.actions = action.payload;
      })
      .addCase(fetchPendingActions.fulfilled, (state, action) => {
        state.pendingActions = action.payload;
      })
      .addCase(fetchOverdueTasks.fulfilled, (state, action) => {
        state.overdueActions = action.payload;
      })

      // Customer Tag Management
      .addCase(addCustomerTag.fulfilled, (state, action) => {
        if (state.customerRecord) {
          state.customerRecord.tags?.unshift(action.payload);
        }
      })
      .addCase(removeCustomerTag.fulfilled, (state, action) => {
        if (state.customerRecord) {
          state.customerRecord.tags = state.customerRecord.tags?.filter((t) => t.id !== action.payload);
        }
      })
      .addCase(fetchCustomersByTag.fulfilled, (state, action) => {
        // Handle tag-based customer list
      })

      // Task Automation
      .addCase(fetchAutomationRules.fulfilled, (state, action) => {
        state.automationRules = action.payload;
      })
      .addCase(runTaskAutomationCheck.fulfilled, (state, action) => {
        // Handle automation check results
      })

      // Field Validation
      .addCase(getRequiredFieldsForCall.fulfilled, (state, action) => {
        state.fieldValidation = action.payload;
      })
      .addCase(getRequiredFieldsForAction.fulfilled, (state, action) => {
        state.fieldValidation = action.payload;
      })
      .addCase(validateCommunication.fulfilled, (state, action) => {
        state.fieldValidation = action.payload;
      })
      .addCase(validateAction.fulfilled, (state, action) => {
        state.fieldValidation = action.payload;
      })

      // Facebook Integration
      .addCase(handleFacebookWebhook.fulfilled, (state, action) => {
        // Handle webhook response if needed
      })
      .addCase(importFacebookLeads.fulfilled, (state, action) => {
        state.leads.unshift(...action.payload);
      })
      .addCase(testFacebookConnection.fulfilled, (state, action) => {
        // Store connection status if needed
      })

      // Analytics
      .addCase(fetchSalespersonAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      })
      .addCase(fetchCrmMetrics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      })

      // Repeat Customer Management
      .addCase(fetchRepeatCustomers.fulfilled, (state, action) => {
        state.repeatCustomers = action.payload;
      })
      .addCase(fetchCustomersDueForFollowUp.fulfilled, (state, action) => {
        state.followUpCustomers = action.payload;
      })
      .addCase(scheduleRecurring.fulfilled, (state, action) => {
        state.recurringSchedule = action.payload;
      })

      // Duplicate Management
      .addCase(checkForDuplicates.fulfilled, (state, action) => {
        state.duplicateCheck = action.payload;
      })
      .addCase(getDuplicateSuggestions.fulfilled, (state, action) => {
        state.duplicateCheck = action.payload;
      })
      .addCase(mergeDuplicates.fulfilled, (state, action) => {
        // Handle merge result
      })

      // Loading states
      .addMatcher(
        (action) => action.type.startsWith('crm/') && action.type.endsWith('/pending'),
        (state) => {
          state.isLoading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith('crm/') && action.type.endsWith('/rejected'),
        (state, action: PayloadAction & { error: { message: string } }) => {
          state.isLoading = false;
          state.error = action.error?.message || 'An error occurred';
        }
      )
      .addMatcher(
        (action) => action.type.startsWith('crm/') && action.type.endsWith('/fulfilled'),
        (state) => {
          state.isLoading = false;
          state.error = null;
          state.lastUpdated = new Date().toISOString();
        }
      );
  },
});

export const {
  clearError,
  clearSelectedLead,
  clearCustomerRecord,
  clearDuplicateCheck,
  clearFieldValidation,
  setLeadFilters,
  setCustomerFilters,
  setCommunicationFilters,
  clearAllFilters,
  resetState,
} = crmSlice.actions;

export default crmSlice.reducer;
