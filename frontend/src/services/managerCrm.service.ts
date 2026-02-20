import { format } from "date-fns";
import { api } from './api';


// NOTE: These are mock implementations to unblock the frontend.
// Replace with real API calls using axios instance from `src/services/api.ts`.

export interface CallLog {
  id: string;
  agentId: string;
  agentName: string;
  customerName: string;
  customerPhone: string;
  clinicName?: string;
  outcome: "answered" | "no_answer" | "voicemail" | "busy" | "scheduled";
  durationSec?: number;
  timestamp: string;
}

export interface AgentEmail {
  agentId: string;
  agentName: string;
  email: string;
}

export interface AgentFormStats {
  agentId: string;
  agentName: string;
  formsReceived: number;
}

export interface AgentCommunicationStats {
  agentId: string;
  agentName: string;
  totalContacts: number;
  realCommunications: number; // excludes no_answer
}

export interface AgentAppointmentStats {
  agentId: string;
  agentName: string;
  booked: number;
  attended: number;
  treatmentsCompleted: number;
  cancelled: number;
  noShows: number;
}

export interface AgentCashflow {
  agentId: string;
  agentName: string;
  revenue: number;
  refunds: number;
  net: number;
}

export interface ServicePerformance {
  serviceId: string;
  serviceName: string;
  totalAppointments: number;
  totalRevenue: number;
  cancellations: number;
}

export interface AdvertisementStat {
  adId: string;
  channel: string;
  campaignName: string;
  spent: number;
  patientsCame: number;
  cancelled: number;
  totalRevenue: number;
  agentBudgetOwner?: string;
}

export interface AccessMatrixRow {
  agentId: string;
  agentName: string;
  clinics: Array<{ clinicId: string; clinicName: string; hasAccess: boolean; isPrivateToOwner?: boolean }>;
}

export interface ClientBenefit {
  customerId: string;
  customerName: string;
  clinicName: string;
  discount?: string;
  gift?: string;
  membership?: "Gold" | "Silver" | "Bronze" | null;
  lastUpdated: string;
}

export interface NoShowAlert {
  appointmentId: string;
  patientName: string;
  agentName: string;
  clinicName: string;
  date: string;
  daysAgo: number;
  actionRecommended: string;
}

export interface ClinicReturnRate {
  clinicId: string;
  clinicName: string;
  returnRate: number; // 0-1
  last30Days: number;
  last90Days: number;
}

export const fetchCallLogs = async (): Promise<CallLog[]> => {
  const now = new Date();
  return [
    {
      id: "c1",
      agentId: "a1",
      agentName: "Alice",
      customerName: "John Doe",
      customerPhone: "+1 555-1234",
      clinicName: "Downtown Clinic",
      outcome: "answered",
      durationSec: 284,
      timestamp: format(now, "yyyy-MM-dd HH:mm:ss"),
    },
    {
      id: "c2",
      agentId: "a2",
      agentName: "Bob",
      customerName: "Mary Sue",
      customerPhone: "+1 555-9876",
      clinicName: "Westside Clinic",
      outcome: "no_answer",
      timestamp: format(new Date(now.getTime() - 86400000), "yyyy-MM-dd HH:mm:ss"),
    },
  ];
};

export const initiateCall = async (phone: string): Promise<{ ok: boolean; providerHint: string }> => {
  // Placeholder: integrate Twilio/Plivo/Vonage later
  return {
    ok: false,
    providerHint: "Integrate a telephony provider (Twilio/Plivo/Vonage) via backend to place calls from the CRM UI.",
  };
};

// Helper function to format dates for API
const formatDateParam = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

// Manager Analytics
export const fetchAgentKpis = async (params?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<any[]> => {
  const queryParams: Record<string, string> = {};
  if (params?.startDate) queryParams.startDate = formatDateParam(params.startDate);
  if (params?.endDate) queryParams.endDate = formatDateParam(params.endDate);

  const response = await api.get('/crm/analytics/manager/agents', { params: queryParams });
  return response.data;
};

export const fetchServiceStats = async (params?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<ServicePerformance[]> => {
  const queryParams: Record<string, string> = {};
  if (params?.startDate) queryParams.startDate = formatDateParam(params.startDate);
  if (params?.endDate) queryParams.endDate = formatDateParam(params.endDate);

  const response = await api.get('/crm/analytics/manager/services', { params: queryParams });
  return response.data;
};

export const fetchClinicAnalytics = async (params?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<any> => {
  const queryParams: Record<string, string> = {};
  if (params?.startDate) queryParams.startDate = formatDateParam(params.startDate);
  if (params?.endDate) queryParams.endDate = formatDateParam(params.endDate);

  const response = await api.get('/crm/analytics/manager/clinics', { params: queryParams });
  return response.data;
};

export const fetchCampaignPerformance = async (params?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<AdvertisementStat[]> => {
  const queryParams: Record<string, string> = {};
  if (params?.startDate) queryParams.startDate = formatDateParam(params.startDate);
  if (params?.endDate) queryParams.endDate = formatDateParam(params.endDate);

  const response = await api.get('/crm/analytics/campaigns', { params: queryParams });
  return response.data;
};

// Agent Management
export const fetchAgentEmails = async (): Promise<AgentEmail[]> => {
  const response = await api.get('/crm/agents/emails');
  return response.data;
};

export const fetchAgentFormStats = async (params?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<AgentFormStats[]> => {
  const queryParams: Record<string, string> = {};
  if (params?.startDate) queryParams.startDate = formatDateParam(params.startDate);
  if (params?.endDate) queryParams.endDate = formatDateParam(params.endDate);

  const response = await api.get('/crm/analytics/agent-forms', { params: queryParams });
  return response.data;
};


export const fetchAgentCommunicationStats = async (params?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<AgentCommunicationStats[]> => {
  const queryParams: Record<string, string> = {};
  if (params?.startDate) queryParams.startDate = formatDateParam(params.startDate);
  if (params?.endDate) queryParams.endDate = formatDateParam(params.endDate);

  const response = await api.get('/crm/analytics/agent-communications', { params: queryParams });
  return response.data;
};

export const fetchAgentAppointmentStats = async (params?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<AgentAppointmentStats[]> => {
  const queryParams: Record<string, string> = {};
  if (params?.startDate) queryParams.startDate = formatDateParam(params.startDate);
  if (params?.endDate) queryParams.endDate = formatDateParam(params.endDate);

  const response = await api.get('/crm/analytics/agent-appointments', { params: queryParams });
  return response.data;
};

// Customer Management
export const fetchCustomerRecord = async (customerId: string): Promise<any> => {
  const response = await api.get(`/crm/customers/${customerId}/record`);
  return response.data;
};

export const updateCustomerRecord = async (customerId: string, data: any): Promise<void> => {
  await api.put(`/crm/customers/${customerId}/record`, data);
};

export const fetchCommunicationHistory = async (customerId: string, filters?: any): Promise<any> => {
  const response = await api.get(`/crm/customers/${customerId}/communications`, { params: filters });
  return response.data;
};

export const logCommunication = async (data: {
  customerId: string;
  type: string;
  notes?: string;
  outcome?: string;
  durationSec?: number;
}): Promise<void> => {
  await api.post('/crm/communications', data);
};

// Task/Action Management
export const fetchActions = async (filters?: any): Promise<any> => {
  const response = await api.get('/crm/actions', { params: filters });
  return response.data;
};

export const createAction = async (data: any): Promise<any> => {
  const response = await api.post('/crm/actions', data);
  return response.data;
};

export const updateAction = async (actionId: string, data: any): Promise<void> => {
  await api.put(`/crm/actions/${actionId}`, data);
};

export const fetchPendingActions = async (): Promise<any> => {
  const response = await api.get('/crm/actions/pending');
  return response.data;
};

export const fetchOverdueTasks = async (salespersonId?: string): Promise<any> => {
  const params = salespersonId ? { salespersonId } : {};
  const response = await api.get('/crm/tasks/overdue', { params });
  return response.data;
};

// Access Control
export const fetchAccessMatrix = async (): Promise<AccessMatrixRow[]> => {
  const response = await api.get('/crm/access-matrix');
  return response.data;
};

export const updateAgentAccess = async (agentId: string, clinicAccess: {
  clinicId: string;
  hasAccess: boolean;
}[]): Promise<void> => {
  await api.put(`/crm/access-matrix/${agentId}`, { clinicAccess });
};

// Client Benefits
export const fetchClientBenefits = async (params?: {
  search?: string;
  clinicId?: string;
}): Promise<ClientBenefit[]> => {
  const response = await api.get('/crm/client-benefits', { params });
  return response.data;
};

export const updateClientBenefit = async (customerId: string, data: Partial<ClientBenefit>): Promise<void> => {
  await api.put(`/crm/client-benefits/${customerId}`, data);
};

// No-Show Management
export const fetchNoShowAlerts = async (params?: {
  daysAgo?: number;
  status?: 'pending' | 'resolved';
}): Promise<NoShowAlert[]> => {
  const response = await api.get('/crm/no-show-alerts', { params });
  return response.data;
};

export const resolveNoShowAlert = async (appointmentId: string, actionTaken: string): Promise<void> => {
  await api.post(`/crm/no-show-alerts/${appointmentId}/resolve`, { actionTaken });
};

// Reporting
export const generateWeeklyReports = async (): Promise<void> => {
  await api.post('/crm/reports/weekly/agents');
};

// Helper function to get date range for the last N days
export const getDateRange = (days: number): { startDate: Date; endDate: Date } => {
  const endDate = new Date();
  // Set end date to end of current day
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  // Set start date to beginning of that day
  startDate.setHours(0, 0, 0, 0);

  return { startDate, endDate };
};

export const fetchAgentCashflow = async (params?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<AgentCashflow[]> => {
  const queryParams: Record<string, string> = {};
  if (params?.startDate) queryParams.startDate = formatDateParam(params.startDate);
  if (params?.endDate) queryParams.endDate = formatDateParam(params.endDate);

  const response = await api.get('/crm/analytics/agent-cashflow', { params: queryParams });
  return response.data;
};



export const fetchClinicReturnRates = async (): Promise<ClinicReturnRate[]> => {
  const response = await api.get('/crm/analytics/clinic-return-rates');
  return response.data;
};

export const fetchServicePerformance = async (params?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<ServicePerformance[]> => {
  const queryParams: Record<string, string> = {};
  if (params?.startDate) queryParams.startDate = formatDateParam(params.startDate);
  if (params?.endDate) queryParams.endDate = formatDateParam(params.endDate);

  const response = await api.get('/crm/analytics/service-performance', { params: queryParams });
  return response.data;
};

export const fetchAdvertisementStats = async (params?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<AdvertisementStat[]> => {
  const queryParams: Record<string, string> = {};
  if (params?.startDate) queryParams.startDate = formatDateParam(params.startDate);
  if (params?.endDate) queryParams.endDate = formatDateParam(params.endDate);

  const response = await api.get('/crm/analytics/advertisement-stats', { params: queryParams });
  return response.data;
};




