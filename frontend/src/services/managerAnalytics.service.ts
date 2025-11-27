import { api } from './api';


export interface AgentKpi {
  agentId: string;
  agentName: string;
  totalAppointments: number;
  completedAppointments: number;
  noShows: number;
  cancellations: number;
  totalRevenue: number;
  avgAppointmentValue: number;
  conversionRate: number;
}

export interface ServiceStat {
  serviceId: string;
  serviceName: string;
  totalAppointments: number;
  totalRevenue: number;
}

export const fetchAgentKpis = async (startDate?: string, endDate?: string): Promise<AgentKpi[]> => {
  const params: { startDate?: string; endDate?: string } = {};
  if (startDate && endDate) {
    params.startDate = startDate;
    params.endDate = endDate;
  }
  const response = await api.get('/crm/analytics/manager/agents', { params });
  return response.data;
};

export const fetchServiceStats = async (startDate?: string, endDate?: string): Promise<ServiceStat[]> => {
  const params: { startDate?: string; endDate?: string } = {};
  if (startDate && endDate) {
    params.startDate = startDate;
    params.endDate = endDate;
  }
  const response = await api.get('/crm/analytics/manager/services', { params });
  return response.data;
};

export const fetchAdCampaigns = async (startDate?: string, endDate?: string): Promise<any[]> => {
  const params: { startDate?: string; endDate?: string } = {};
  if (startDate && endDate) {
    params.startDate = startDate;
    params.endDate = endDate;
  }
  const response = await api.get('/crm/analytics/campaigns', { params });
  return response.data;
};

export const fetchClinicAnalytics = async (startDate?: string, endDate?: string): Promise<any[]> => {
  const params: { startDate?: string; endDate?: string } = {};
  if (startDate && endDate) {
    params.startDate = startDate;
    params.endDate = endDate;
  }
  const response = await api.get('/crm/analytics/manager/clinics', { params });
  return response.data;
};
