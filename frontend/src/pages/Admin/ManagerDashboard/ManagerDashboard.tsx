import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchAgentKpis, fetchServiceStats, fetchClinicReturnRates, fetchServicePerformance, fetchAdvertisementStats } from '../../../services/managerAnalytics.service';
import { DataTable } from '../../../components/ui/DataTable';
import { columns as agentColumns } from './columns/agentColumns';
import { columns as serviceColumns } from './columns/serviceColumns';
import { TrendingUp, TrendingDown, Users, DollarSign, Calendar, Target, Activity, BarChart3, PieChart, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';

// Define types
export interface AgentKpi {
  agentName: string;
  totalAppointments: number;
  completedAppointments: number;
  noShows: number;
  cancellations: number;
  conversionRate: number;
  totalRevenue: number;
  avgAppointmentValue: number;
}

export interface ServiceStat {
  serviceName: string;
  totalAppointments: number;
  totalRevenue: number;
  avgRevenuePerAppointment?: number;
  revenueShare?: number;
}

export interface ClinicReturnRate {
  clinicId: string;
  clinicName: string;
  returnRate: number;
  last30Days: number;
  last90Days: number;
}

export interface AdvertisementStat {
  adId: string;
  channel: string;
  campaignName: string;
  spent: number;
  patientsCame: number;
  cancelled: number;
  totalRevenue: number;
  agentBudgetOwner: string;
}

// Format currency utility function
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const ManagerDashboard = () => {
  const [agentKpis, setAgentKpis] = useState<AgentKpi[]>([]);
  const [serviceStats, setServiceStats] = useState<ServiceStat[]>([]);
  const [clinicReturnRates, setClinicReturnRates] = useState<ClinicReturnRate[]>([]);
  const [advertisementStats, setAdvertisementStats] = useState<AdvertisementStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [agents, services, clinics, ads] = await Promise.all([
          fetchAgentKpis(),
          fetchServiceStats(),
          fetchClinicReturnRates(),
          fetchAdvertisementStats(),
        ]);
        setAgentKpis(agents);
        setServiceStats(services);
        setClinicReturnRates(clinics);
        setAdvertisementStats(ads);
        setError(null);
      } catch (err) {
        console.error('Failed to load manager dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedPeriod]);

  // Calculate summary metrics
  const totalRevenue = agentKpis.reduce((sum, agent) => sum + agent.totalRevenue, 0);
  const totalAppointments = agentKpis.reduce((sum, agent) => sum + agent.totalAppointments, 0);
  const avgConversionRate = agentKpis.length > 0 
    ? agentKpis.reduce((sum, agent) => sum + agent.conversionRate, 0) / agentKpis.length 
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAppointments}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Conversion</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(avgConversionRate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Appointment to completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent KPIs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={agentColumns} 
            data={agentKpis} 
            searchKey="agentName"
            placeholder="Filter agents..."
          />
        </CardContent>
      </Card>

      {/* Service Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={serviceColumns} 
            data={serviceStats} 
            searchKey="serviceName"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerDashboard;
