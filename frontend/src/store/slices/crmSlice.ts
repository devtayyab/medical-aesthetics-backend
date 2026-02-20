import { createSlice, createAsyncThunk, PayloadAction, Action } from "@reduxjs/toolkit";
import { crmAPI } from "@/services/api";
import type { Lead } from "@/types/crm.types";
import type {
  CustomerRecord,
  CommunicationLog,
  CrmAction,
  CustomerTag,
  CustomerSummary,
  DuplicateCheckResult,
  TaskAutomationRule,
  ValidationResult,
  CrmFilters,
  CrmAnalytics,
  User
} from "@/types";
import type { Customer } from "@/types/crm.types";
interface CrmState {
  // Lead Management
  leads: Lead[];
  selectedLead: Lead | null;
  leadFilters: CrmFilters;
  customer: Customer | null;
  // Customer Management
  customerRecord: CustomerSummary | null;
  customerFilters: CrmFilters;

  // Actions/Activity Log
  actions: CrmAction[];


  // Repeat Customer Management
  repeatCustomers: CustomerSummary[];
  followUpCustomers: CustomerSummary[];
  recurringSchedule: any;

  // Communication Management
  communications: CommunicationLog[];
  communicationFilters: {
    type?: string;
    startDate?: string;
    endDate?: string;
  };

  // Action/Task Management
  tasks: CrmAction[];
  selectedTask: CrmAction | null;
  overdueTasks: CrmAction[];
  pendingTasks: CrmAction[];
  automationRules: TaskAutomationRule[];

  // Tag Management
  customerTags: CustomerTag[];

  // Duplicate Management
  duplicateCheck: DuplicateCheckResult | null;
  duplicateSuggestions: DuplicateCheckResult[];

  // Validation
  fieldValidation: ValidationResult | null;
  requiredFields: any;

  // Analytics
  analytics: CrmAnalytics | null;
  salespersons: User[];
  diaryActivities: any[];
  // UI State
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: CrmState = {
  leads: [],
  selectedLead: null,
  leadFilters: {},
  actions: [],
  isLoading: false,
  error: null,
  customerRecord: null,
  customerFilters: {},

  // Repeat Customer Management
  repeatCustomers: [],
  followUpCustomers: [],
  recurringSchedule: null,
  customer: null,
  communications: [],
  communicationFilters: {},
  tasks: [],
  selectedTask: null,
  overdueTasks: [],
  pendingTasks: [],
  automationRules: [],
  customerTags: [],
  duplicateCheck: null,
  duplicateSuggestions: [],
  fieldValidation: null,
  requiredFields: null,
  analytics: null,
  salespersons: [],
  diaryActivities: [],
  lastUpdated: null,
};

// Lead Management
export const createLead = createAsyncThunk(
  "crm/createLead",
  async (data: {
    source: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    facebookLeadId?: string;
    facebookFormId?: string;
    facebookCampaignId?: string;
    facebookAdSetId?: string;
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
interface UpdateLeadPayload {
  id: string;
  updates: Partial<Lead>;
}
export const updateLead = createAsyncThunk(
  "crm/updateLead",
  async (data: UpdateLeadPayload) => {
    if (data.updates.status) {
      data.updates.status = data.updates.status as Lead["status"];
    }
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
  async (arg: string | { customerId: string; salespersonId?: string }) => {
    const customerId = typeof arg === 'string' ? arg : arg.customerId;
    const salespersonId = typeof arg === 'string' ? undefined : arg.salespersonId;
    const response = await crmAPI.getCustomerRecord(customerId, salespersonId);
    return response.data;
  }
);

// Backward compatibility
export const fetchCustomerRecord = getCustomerRecord;

export const fetchCustomer = createAsyncThunk(
  "crm/fetchCustomer",
  async (data: { id: string }) => {
    const response = await crmAPI.getCustomer(data.id);
    return response.data;
  }
);


export const updateCustomerRecord = createAsyncThunk(
  "crm/updateCustomerRecord",
  async (data: { customerId: string; updates: Partial<CustomerRecord> }) => {
    const response = await crmAPI.updateCustomerRecord(data.customerId, data.updates);
    return response.data;
  }
);

// Communication Management
export const logCommunication = createAsyncThunk(
  "crm/logCommunication",
  async (data: Partial<CommunicationLog>) => {
    const response = await crmAPI.logCommunication(data);
    return response.data;
  }
);

export const fetchCommunicationHistory = createAsyncThunk(
  "crm/fetchCommunicationHistory",
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
  async (salespersonId: string) => {
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

export const fetchTasks = createAsyncThunk(
  "crm/fetchTasks",
  async (salespersonId?: string) => {
    const response = await crmAPI.getTasks(salespersonId);
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

// Tag Management
export const addCustomerTag = createAsyncThunk(
  "crm/addCustomerTag",
  async (data: { customerId: string; tagId: string; notes?: string }) => {
    const response = await crmAPI.addCustomerTag(data.customerId, data.tagId, data.notes);
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

// getCustomerRecord moved to line 164



export const getCustomer = createAsyncThunk(
  "crm/getCustomer",
  async (customerId: string) => {
    const response = await crmAPI.getCustomer(customerId);
    return response.data;
  }
);

// Communication Management
export const getCommunicationHistory = createAsyncThunk(
  "crm/getCommunicationHistory",
  async (data: { customerId: string; filters?: any }) => {
    const response = await crmAPI.getCommunicationHistory(data.customerId, data.filters);
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

export const getFacebookForms = createAsyncThunk(
  "crm/getFacebookForms",
  async () => {
    const response = await crmAPI.getFacebookForms();
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

export const fetchSalespersons = createAsyncThunk(
  "crm/fetchSalespersons",
  async () => {
    const response = await crmAPI.getSalespersons();
    return response.data;
  }
);

export const fetchSalesActivities = createAsyncThunk(
  "crm/fetchSalesActivities",
  async (date?: string) => {
    const response = await crmAPI.getSalesActivities(date);
    return response.data;
  }
);

const crmSlice = createSlice({
  name: "crm",
  initialState,
  reducers: {
    // State cleanup actions
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedLead: (state) => {
      state.selectedLead = null;
    },
    clearCustomerRecord: (state) => {
      state.customerRecord = null;
    },
    clearDuplicateCheck: (state) => {
      state.duplicateCheck = null;
    },
    clearFieldValidation: (state) => {
      state.fieldValidation = null;
    },

    // Filter management
    setLeadFilters: (state, action: PayloadAction<CrmFilters>) => {
      state.leadFilters = action.payload;
    },
    setCustomerFilters: (state, action: PayloadAction<CrmFilters>) => {
      state.customerFilters = action.payload;
    },
    setCommunicationFilters: (state, action: PayloadAction<{
      type?: string;
      startDate?: string;
      endDate?: string;
    }>) => {
      state.communicationFilters = action.payload;
    },

    // Batch operations
    clearAllFilters: (state) => {
      state.leadFilters = {};
      state.customerFilters = {};
      state.communicationFilters = {};
    },
    resetState: () => initialState,
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
      .addCase(getCustomerRecord.fulfilled, (state, action) => {
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
          state.customerRecord.communications.unshift(action.payload);
        }
      })
      .addCase(fetchCommunicationHistory.fulfilled, (state, action) => {
        state.communications = action.payload;
      })

      // Facebook Integration
      .addCase(handleFacebookWebhook.fulfilled, (_state, _action) => {
        // Handle webhook response if needed
      })
      .addCase(importFacebookLeads.fulfilled, (state, action) => {
        state.leads.unshift(...action.payload);
      })
      .addCase(testFacebookConnection.fulfilled, (_state, _action) => {
        // Store connection status if needed
      })
      .addCase(getFacebookForms.fulfilled, (_state, _action) => {
        // Store Facebook forms if needed
      })

      // Action/Task Management
      .addCase(createAction.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload);
        if (state.customerRecord) {
          state.customerRecord.actions.unshift(action.payload);
        }
      })
      .addCase(updateAction.fulfilled, (state, action) => {
        const taskIndex = state.tasks.findIndex((t) => t.id === action.payload.id);
        if (taskIndex !== -1) {
          state.tasks[taskIndex] = action.payload;
        }

        if (state.customerRecord) {
          const actionIndex = state.customerRecord.actions.findIndex(
            (a) => a.id === action.payload.id
          );
          if (actionIndex !== -1) {
            state.customerRecord.actions[actionIndex] = action.payload;
          }
        }

        // Update pending/overdue task lists
        const pendingIndex = state.pendingTasks.findIndex((t) => t.id === action.payload.id);
        if (pendingIndex !== -1) {
          state.pendingTasks[pendingIndex] = action.payload;
        }

        const overdueIndex = state.overdueTasks.findIndex((t) => t.id === action.payload.id);
        if (overdueIndex !== -1) {
          state.overdueTasks[overdueIndex] = action.payload;
        }
      })
      .addCase(deleteAction.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t.id !== action.payload);
        state.pendingTasks = state.pendingTasks.filter((t) => t.id !== action.payload);
        state.overdueTasks = state.overdueTasks.filter((t) => t.id !== action.payload);

        if (state.customerRecord) {
          state.customerRecord.actions = state.customerRecord.actions.filter(
            (a) => a.id !== action.payload
          );
        }
      })
      .addCase(fetchActions.fulfilled, (state, action) => {
        state.actions = action.payload;
      })
      .addCase(fetchPendingActions.fulfilled, (state, action) => {
        state.pendingTasks = action.payload;
      })
      .addCase(fetchOverdueTasks.fulfilled, (state, action) => {
        state.overdueTasks = action.payload;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.tasks = action.payload;
      })

      // Duplicate Management
      .addCase(checkForDuplicates.fulfilled, (state, action) => {
        state.duplicateCheck = action.payload;
      })
      .addCase(getDuplicateSuggestions.fulfilled, (state, action) => {
        state.duplicateSuggestions = action.payload;
      })

      // Tag Management
      .addCase(addCustomerTag.fulfilled, (state, action) => {
        state.customerTags.unshift(action.payload);
        if (state.customerRecord) {
          state.customerRecord.tags.unshift(action.payload);
        }
      })
      .addCase(removeCustomerTag.fulfilled, (state, action) => {
        state.customerTags = state.customerTags.filter((t) => t.id !== action.payload);
        if (state.customerRecord) {
          state.customerRecord.tags = state.customerRecord.tags.filter(
            (t) => t.id !== action.payload
          );
        }
      })
      .addCase(fetchCustomersByTag.fulfilled, (state, action) => {
        state.customerTags = action.payload;
      })

      // Task Automation
      .addCase(fetchAutomationRules.fulfilled, (state, action) => {
        state.automationRules = action.payload;
      })

      // Field Validation
      .addCase(getRequiredFieldsForCall.fulfilled, (state, action) => {
        state.requiredFields = action.payload;
      })
      .addCase(validateCommunication.fulfilled, (state, action) => {
        state.fieldValidation = action.payload;
      })
      .addCase(validateAction.fulfilled, (state, action) => {
        state.fieldValidation = action.payload;
      })

      // Analytics
      .addCase(fetchSalespersonAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      })
      .addCase(fetchCrmMetrics.fulfilled, (state, action) => {
        state.analytics = { ...state.analytics, ...action.payload };
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
      .addCase(fetchSalespersons.fulfilled, (state, action) => {
        state.salespersons = action.payload;
      })
      .addCase(fetchSalesActivities.fulfilled, (state, action) => {
        state.diaryActivities = action.payload;
      })

      // Generic loading state handlers
      .addMatcher(
        (action) => action.type.startsWith('crm/') && action.type.endsWith('/pending'),
        (state) => {
          state.isLoading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith('crm/') && action.type.endsWith('/rejected'),
        (state, action: Action & { error: { message: string } }) => {
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
