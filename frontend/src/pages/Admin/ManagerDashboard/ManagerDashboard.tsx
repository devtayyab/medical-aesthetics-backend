import { Button } from '@/components/atoms/Button/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/molecules/Tabs';
import { cn } from '@/lib/utils';
import {
  Activity,
  AlertCircle,
  BarChart3, Calendar,
  DollarSign,
  Loader2,
  TrendingUp, Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { DataTable } from '../../../components/ui/DataTable';
import { fetchAgentKpis, fetchServiceStats } from '../../../services/managerAnalytics.service';
import { fetchAdvertisementStats, fetchClinicReturnRates } from '../../../services/managerCrm.service';
import { columns as agentColumns } from './columns/agentColumns';
import { columns as serviceColumns } from './columns/serviceColumns';

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
  agentBudgetOwner?: string;
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


  // Calculate percentage change (mock data - replace with actual comparison logic)
  const revenueChange = 12.5; // Example: 12.5% increase
  const appointmentsChange = 8.2; // Example: 8.2% increase
  const conversionChange = 3.7; // Example: 3.7% increase
    const totalRevenue = agentKpis.reduce((sum, agent) => sum + agent.totalRevenue, 0);
  const totalAppointments = agentKpis.reduce((sum, agent) => sum + agent.totalAppointments, 0);
  const completedAppointments = agentKpis.reduce((sum, agent) => sum + agent.completedAppointments, 0);
  const avgConversionRate = agentKpis.length > 0 
    ? agentKpis.reduce((sum, agent) => sum + agent.conversionRate, 0) / agentKpis.length 
    : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start" role="alert">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <strong className="font-bold">Error loading data: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
          <p className="text-muted-foreground">Overview of your business performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span>Last {selectedPeriod} days</span>
          </Button>
          <Button variant="outline" size="sm">
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          change={revenueChange}
          icon={<DollarSign className="h-4 w-4" />}
          iconBg="bg-green-100 text-green-600"
        />
        <StatCard
          title="Appointments"
          value={totalAppointments.toString()}
          change={appointmentsChange}
          icon={<Calendar className="h-4 w-4" />}
          iconBg="bg-blue-100 text-blue-600"
          description={`${completedAppointments} completed`}
        />
        <StatCard
          title="Conversion Rate"
          value={`${(avgConversionRate * 100).toFixed(1)}%`}
          change={conversionChange}
          icon={<TrendingUp className="h-4 w-4" />}
          iconBg="bg-purple-100 text-purple-600"
        />
        <StatCard
          title="Active Agents"
          value={agentKpis.length.toString()}
          change={2.3}
          icon={<Users className="h-4 w-4" />}
          iconBg="bg-amber-100 text-amber-600"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 max-w-md">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="advertising" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Advertising
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Revenue trends over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Revenue chart will be displayed here
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Top Performing Services</CardTitle>
                <CardDescription>By revenue and appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {serviceStats.slice(0, 5).map((service) => (
                    <div key={service.serviceName} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{service.serviceName}</span>
                        <span className="text-sm font-medium">{formatCurrency(service.totalRevenue)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ 
                            width: `${(service.totalRevenue / totalRevenue) * 100}%` 
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
              <CardDescription>Detailed breakdown of agent KPIs and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={agentColumns}
                data={agentKpis}
                searchKey="agentName"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Service Performance</CardTitle>
              <CardDescription>Metrics and analytics by service</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={serviceColumns}
                data={serviceStats}
                searchKey="serviceName"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advertising">
          <Card>
            <CardHeader>
              <CardTitle>Advertising Performance</CardTitle>
              <CardDescription>ROI and metrics by campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Advertising performance metrics will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// StatCard component for reusable metric cards
const StatCard = ({ 
  title, 
  value, 
  change, 
  icon, 
  iconBg,
  description 
}: {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  iconBg: string;
  description?: string;
}) => {
  const isPositive = change >= 0;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute right-4 top-4 h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: iconBg.split(' ')[0] }}>
        {icon}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs mt-1">
          <span className={cn(
            "flex items-center",
            isPositive ? "text-green-600" : "text-red-600"
          )}>
            {isPositive ? '↑' : '↓'} {Math.abs(change)}%
            <span className="ml-1 text-muted-foreground">vs last period</span>
          </span>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ManagerDashboard;
