import { api } from './api';


export interface AgentKpi {
  agentId: string;
  agentName: string;
  totalAppointments: number;
  completedAppointments: number; // Services sold (1 appointment = 1 service usually)
  servicesSold: number; // Aliased for clarity
  noShows: number;
  cancellations: number;
  totalRevenue: number;
  avgAppointmentValue: number;
  conversionRate: number;
  callsMade: number;
}

export interface ServiceStat {
  serviceId: string;
  serviceName: string;
  totalAppointments: number;
  totalRevenue: number;
  avgRevenuePerAppointment?: number;
  revenueShare?: number;
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
    return response.data.map((agent: any) => ({
      agentId: agent.agentId || '',
      agentName: agent.agentName || 'Unknown',
      totalAppointments: parseInt(agent.totalAppointments) || 0,
      completedAppointments: parseInt(agent.completedAppointments) || 0,
      servicesSold: parseInt(agent.completedAppointments) || 0, // Mapping completed appointments to services sold
      noShows: parseInt(agent.noShows) || 0,
      cancellations: parseInt(agent.cancellations) || 0,
      totalRevenue: parseFloat(agent.totalRevenue) || 0,
      avgAppointmentValue: parseInt(agent.completedAppointments) > 0
        ? (parseFloat(agent.totalRevenue) / parseInt(agent.completedAppointments))
        : 0,
      conversionRate: parseInt(agent.totalAppointments) > 0
        ? (parseInt(agent.completedAppointments) / parseInt(agent.totalAppointments)) * 100
        : 0,
      callsMade: parseInt(agent.totalCalls) || 0
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

export interface ClinicAnalytics {
  clinicId: string;
  clinicName: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  treatmentRooms?: number;
  totalAppointments: number;
  uniqueClients: number;
  completed: number;
  cancelled: number;
  noShow: number;
  totalRevenue: number;
}

export const fetchClinicAnalytics = async (startDate?: string, endDate?: string): Promise<ClinicAnalytics[]> => {
  const params: { startDate?: string; endDate?: string } = {};
  if (startDate && endDate) {
    params.startDate = startDate;
    params.endDate = endDate;
  }
  const response = await api.get('/crm/analytics/manager/clinics', { params });

  return response.data.map((clinic: any) => ({
    clinicId: clinic.clinicId || '',
    clinicName: clinic.clinicName || 'Unknown',
    phone: clinic.phone,
    address: clinic.address,
    treatmentRooms: parseInt(clinic.treatmentRooms) || 0,
    totalAppointments: parseInt(clinic.totalAppointments) || 0,
    uniqueClients: parseInt(clinic.uniqueClients) || 0,
    completed: parseInt(clinic.completed) || 0,
    cancelled: parseInt(clinic.cancelled) || 0,
    noShow: parseInt(clinic.noShow) || 0,
    totalRevenue: parseFloat(clinic.totalRevenue) || 0
  }));
};
