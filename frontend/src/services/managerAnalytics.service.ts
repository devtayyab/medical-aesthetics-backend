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
  
  try {
    const response = await api.get('/crm/analytics/manager/agents', { params });
    
    // Transform the data to match the frontend's AgentKpi interface
    return response.data.map(agent => ({
      agentId: agent.agentId || '',
      agentName: agent.agentName || 'Unknown',
      totalAppointments: parseInt(agent.totalAppointments) || 0,
      completedAppointments: parseInt(agent.completedAppointments) || 0,
      noShows: parseInt(agent.noShows) || 0,
      cancellations: parseInt(agent.cancellations) || 0,
      totalRevenue: parseFloat(agent.totalRevenue) || 0,
      avgAppointmentValue: agent.completedAppointments > 0 
        ? (parseFloat(agent.totalRevenue) / parseInt(agent.completedAppointments)) 
        : 0,
      conversionRate: agent.totalAppointments > 0 
        ? (parseInt(agent.completedAppointments) / parseInt(agent.totalAppointments)) * 100 
        : 0
    }));
  } catch (error: any) {
    console.error('Error fetching agent KPIs:', error);
    
    // If it's a 401 or 403 error, it's likely a permissions issue
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. You need admin or super admin permissions to view this data.');
    } else if (error.response?.status === 404) {
      throw new Error('Analytics endpoint not found. Please check if the backend service is running.');
    } else {
      throw new Error('Failed to fetch agent analytics. Please try again later.');
    }
  }
};

export const fetchServiceStats = async (startDate?: string, endDate?: string): Promise<ServiceStat[]> => {
  const params: { startDate?: string; endDate?: string } = {};
  if (startDate && endDate) {
    params.startDate = startDate;
    params.endDate = endDate;
  }
  
  try {
    const response = await api.get('/crm/analytics/manager/services', { params });
    
    // Transform the data to match the ServiceStat interface
    return response.data.map(service => ({
      serviceId: service.serviceId || '',
      serviceName: service.serviceName || 'Unknown',
      totalAppointments: parseInt(service.totalAppointments) || 0,
      totalRevenue: parseFloat(service.totalRevenue) || 0,
      avgRevenuePerAppointment: service.totalAppointments > 0 
        ? parseFloat(service.totalRevenue) / parseInt(service.totalAppointments) 
        : 0
    }));
  } catch (error: any) {
    console.error('Error fetching service stats:', error);
    
    // If it's a 401 or 403 error, it's likely a permissions issue
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. You need admin or super admin permissions to view this data.');
    } else if (error.response?.status === 404) {
      throw new Error('Analytics endpoint not found. Please check if the backend service is running.');
    } else {
      throw new Error('Failed to fetch service analytics. Please try again later.');
    }
  }
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
