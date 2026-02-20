import { Button } from '@/components/atoms/Button/Button';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/molecules/Tabs';
import { cn } from '@/lib/utils';
import {
  Activity,
  AlertCircle,
  BarChart3,
  BookOpen,
  Calendar,
  DollarSign,
  Loader2,
  TrendingUp,
  Users,
  UserPlus,
  ArrowLeft,

  Phone,
  Building2,
  MessageSquare,
  Briefcase
} from 'lucide-react';
import React, { useEffect, useState, cloneElement, ReactNode, ReactElement } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SalesDiary } from '@/components/organisms/SalesDiary/SalesDiary';
import { fetchServices, fetchAvailability, fetchClinicProviders } from '@/store/slices/clinicSlice';
import { RootState } from '@/store';
import { StaffDiary } from '@/components/organisms/StaffDiary/StaffDiary';
import { DataTable } from '../../../components/ui/DataTable';
import { fetchAgentKpis, fetchServiceStats, fetchClinicAnalytics, ClinicAnalytics } from '../../../services/managerAnalytics.service';
import { Input } from '@/components/atoms/Input/Input';
import { LeadsPage } from '../../CRM/Leads';
import { userAPI } from '../../../services/api';
import { setLeadFilters } from '@/store/slices/crmSlice';
import { columns as agentColumns } from './columns/agentColumns';
import { columns as serviceColumns } from './columns/serviceColumns';

// Define types
export interface AgentKpi {
  agentId: string;
  agentName: string;
  totalAppointments: number;
  completedAppointments: number;
  servicesSold: number;
  noShows: number;
  cancellations: number;
  conversionRate: number;
  totalRevenue: number;
  avgAppointmentValue: number;
  callsMade: number;
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
  const dispatch = useDispatch();
  const { services: clinicServices, availability: clinicAvailability, staff: clinicStaff } = useSelector((state: RootState) => state.clinic);
  const [agentKpis, setAgentKpis] = useState<AgentKpi[]>([]);
  const [serviceStats, setServiceStats] = useState<ServiceStat[]>([]);
  const [clinicStats, setClinicStats] = useState<ClinicAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchParams] = useSearchParams();

  // Agent Management State
  const [selectedAgent, setSelectedAgent] = useState<AgentKpi | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<ClinicAnalytics | null>(null);
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [newAgentData, setNewAgentData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'salesperson',
  });

  // Cleanup filters when unmounting
  useEffect(() => {
    return () => {
      dispatch(setLeadFilters({}));
    };
  }, [dispatch]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [agents, services, clinics] = await Promise.all([
          fetchAgentKpis(),
          fetchServiceStats(),
          fetchClinicAnalytics(),
        ]);
        setAgentKpis(agents);
        setServiceStats(services);
        setClinicStats(clinics);

        // Handle deep-linking to an agent
        const paramAgentId = searchParams.get('agentId');
        if (paramAgentId) {
          const agent = agents.find((a: any) => a.agentId === paramAgentId);
          if (agent) {
            setSelectedAgent(agent);
            dispatch(setLeadFilters({ assignedSalesId: agent.agentId }));
          }
        }

        // Handle deep-linking to a clinic
        const paramClinicId = searchParams.get('clinicId');
        if (paramClinicId) {
          const clinic = clinics.find((c: any) => c.clinicId === paramClinicId);
          if (clinic) {
            setSelectedClinic(clinic);
            setActiveTab('clinics');
            // Populate clinic data
            dispatch(fetchClinicProviders(clinic.clinicId) as any);
            dispatch(fetchServices(clinic.clinicId) as any);
            dispatch(fetchAvailability(clinic.clinicId) as any);
          }
        }

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

  // Handle viewing agent details
  const handleViewAgent = (agent: AgentKpi) => {
    setSelectedAgent(agent);
    // Filter leads for this agent
    dispatch(setLeadFilters({ assignedSalesId: agent.agentId }));
  };

  const handleViewClinic = (clinic: ClinicAnalytics) => {
    setSelectedClinic(clinic);
    // Fetch specific data for this clinic
    dispatch(fetchServices(clinic.clinicId) as any);
    dispatch(fetchAvailability(clinic.clinicId) as any);
    dispatch(fetchClinicProviders(clinic.clinicId) as any);
  };

  const handleCreateAgent = async () => {
    try {
      await userAPI.createUser(newAgentData);
      setShowAddAgentModal(false);
      setNewAgentData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        role: 'salesperson',
      });
      // Refresh KPIs
      const agents = await fetchAgentKpis();
      setAgentKpis(agents);
      alert('Agent created successfully!');
    } catch (error) {
      console.error('Failed to create agent:', error);
      alert('Failed to create agent. Check console for details.');
    }
  };

  // Custom columns for Agents table to include click handler
  const dashboardAgentColumns = [
    {
      accessorKey: 'agentName',
      header: 'Agent',
      cell: ({ row }: any) => (
        <div
          className="font-medium text-blue-600 cursor-pointer hover:underline flex items-center gap-2"
          onClick={() => handleViewAgent(row.original)}
        >
          <Users className="w-4 h-4" />
          {row.getValue('agentName')}
        </div>
      ),
    },
    ...agentColumns.filter((c) => 'accessorKey' in c && c.accessorKey !== 'agentName')
  ];

  const dashboardClinicColumns = [
    {
      accessorKey: 'clinicName',
      header: 'Clinic',
      cell: ({ row }: any) => (
        <div
          className="font-medium text-blue-600 cursor-pointer hover:underline flex items-center gap-2"
          onClick={() => handleViewClinic(row.original)}
        >
          <Building2 className="w-4 h-4" />
          {row.getValue('clinicName')}
        </div>
      ),
    },
    {
      accessorKey: 'totalAppointments',
      header: 'Total Appts',
    },
    {
      accessorKey: 'totalRevenue',
      header: 'Revenue',
      cell: ({ row }: any) => formatCurrency(row.getValue('totalRevenue')),
    },
    {
      accessorKey: 'completed',
      header: 'Completed',
    },
    {
      accessorKey: 'cancelled',
      header: 'Cancelled',
      cell: ({ row }: any) => (
        <span className="text-rose-600">{row.getValue('cancelled')}</span>
      ),
    },
    {
      accessorKey: 'noShow',
      header: 'No Shows',
      cell: ({ row }: any) => (
        <span className="text-amber-600">{row.getValue('noShow')}</span>
      ),
    },
  ];

  // Calculate summary metrics
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



  // Render Clinic Detail View
  if (selectedClinic) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedClinic(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to dashboard
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-gray-400" />
            {selectedClinic.clinicName}
          </h1>
          <div className="ml-auto flex gap-2">
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
              Rev: {formatCurrency(selectedClinic.totalRevenue)}
            </div>
          </div>
        </div>

        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="h-[calc(100vh-200px)]">
            <StaffDiary clinicId={selectedClinic.clinicId} />
          </TabsContent>

          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Clinic Services</CardTitle>
                <CardDescription>All available treatments at {selectedClinic.clinicName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  {clinicServices && clinicServices.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Service Name</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Duration</th>
                          <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clinicServices.map((service, index) => (
                          <tr key={service.id || index} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <td className="p-4 align-middle font-medium">{service.name}</td>
                            <td className="p-4 align-middle text-muted-foreground">{service.category || 'General'}</td>
                            <td className="p-4 align-middle">{service.durationMinutes} min</td>
                            <td className="p-4 align-middle text-right">${service.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No services found for this clinic.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability">
            <Card>
              <CardHeader>
                <CardTitle>Opening Hours & Availability</CardTitle>
                <CardDescription>Standard operating hours for {selectedClinic.clinicName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Weekly Schedule</h3>
                    <div className="rounded-md border p-4 space-y-3">
                      {clinicAvailability?.businessHours ? Object.entries(clinicAvailability.businessHours).map(([day, hours], index) => (
                        <div key={day} className="flex justify-between items-center text-sm">
                          <span className="font-medium w-24 capitalize">{day}</span>
                          <span className="text-muted-foreground flex-1 text-center">
                            {hours.isOpen ? `${hours.open} - ${hours.close}` : 'Closed'}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium w-24 text-center",
                            hours.isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}>
                            {hours.isOpen ? 'Open' : 'Closed'}
                          </span>
                        </div>
                      )) : (
                        <div className="text-center p-4 text-muted-foreground">No availability schedule set.</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Clinic Information</h3>
                    <div className="grid gap-4">
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border">
                        <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Contact Number</p>
                          <p className="text-sm text-muted-foreground">{selectedClinic.phone || 'No phone provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border">
                        <Building2 className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Location</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedClinic.address ? (
                              <>
                                {selectedClinic.address.street}<br />
                                {selectedClinic.address.city}, {selectedClinic.address.state} {selectedClinic.address.zipCode}<br />
                                {selectedClinic.address.country}
                              </>
                            ) : (
                              'No address provided'
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border">
                        <Users className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Staff Capacity</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedClinic.treatmentRooms || 1} Treatment Rooms<br />
                            {clinicStaff.length || 0} Active Staff Members
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Revenue"
                value={formatCurrency(selectedClinic.totalRevenue)}
                change={0}
                icon={<DollarSign className="h-4 w-4" />}
                iconBg="bg-green-100 text-green-600"
              />
              <StatCard
                title="Appointments"
                value={selectedClinic.totalAppointments.toString()}
                change={0}
                icon={<Calendar className="h-4 w-4" />}
                iconBg="bg-blue-100 text-blue-600"
              />
              <StatCard
                title="Completed"
                value={selectedClinic.completed.toString()}
                change={0}
                icon={<Activity className="h-4 w-4" />}
                iconBg="bg-purple-100 text-purple-600"
              />
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Clinic Messages & Communications</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Render Agent Detail View
  if (selectedAgent) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => {
            setSelectedAgent(null);
            dispatch(setLeadFilters({})); // Reset filters
          }}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Agents
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-gray-400" />
            {selectedAgent.agentName}
          </h1>
          <div className="ml-auto flex gap-2">
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
              Rev: {formatCurrency(selectedAgent.totalRevenue)}
            </div>
          </div>
        </div>

        <Tabs defaultValue="diary" className="space-y-4">
          <TabsList>
            <TabsTrigger value="diary">Sales Diary</TabsTrigger>
            <TabsTrigger value="leads">Assigned Leads</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="diary">
            <SalesDiary salespersonId={selectedAgent.agentId} />
          </TabsContent>

          <TabsContent value="leads">
            <Card>
              <CardContent className="p-0">
                <LeadsPage forceShowCreateForm={false} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <StatCard
                title="Appointments Booked"
                value={selectedAgent.totalAppointments.toString()}
                change={0}
                icon={<Calendar className="h-4 w-4" />}
                iconBg="bg-blue-100 text-blue-600"
              />
              <StatCard
                title="Revenue"
                value={formatCurrency(selectedAgent.totalRevenue)}
                change={0}
                icon={<DollarSign className="h-4 w-4" />}
                iconBg="bg-green-100 text-green-600"
              />
              <StatCard
                title="Services Sold"
                value={(selectedAgent.servicesSold || selectedAgent.completedAppointments).toString()}
                change={0}
                icon={<Activity className="h-4 w-4" />}
                iconBg="bg-purple-100 text-purple-600"
              />
              <StatCard
                title="Non-shows"
                value={selectedAgent.noShows.toString()}
                change={0}
                icon={<AlertCircle className="h-4 w-4" />}
                iconBg="bg-red-100 text-red-600"
              />
              <StatCard
                title="Calls Made"
                value={(selectedAgent.callsMade || 0).toString()}
                change={0}
                icon={<Phone className="h-4 w-4" />}
                iconBg="bg-amber-100 text-amber-600"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#CBFF38] rounded-2xl shadow-xl shadow-[#CBFF38]/20 group hover:rotate-6 transition-transform">
            <BarChart3 className="h-8 w-8 text-gray-900" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Manager Dashboard</h1>
            <p className="text-muted-foreground font-medium mt-1">Real-time performance analytics across your clinic network</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 bg-white hover:bg-gray-50 border-gray-200 shadow-sm h-10 px-4">
            <Calendar className="h-4 w-4 text-[#CBFF38]" />
            <span className="font-semibold">Last {selectedPeriod} days</span>
          </Button>
          <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50 border-gray-200 shadow-sm h-10 px-4">
            Export Report
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-100/50 p-1.5 rounded-xl border border-gray-200/50 w-full max-w-[500px]">
          <TabsTrigger value="overview" className="flex items-center gap-2 rounded-lg py-2 px-6 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md font-bold transition-all">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="clinics" className="flex items-center gap-2 rounded-lg py-2 px-6 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md font-bold transition-all">
            <Building2 className="h-4 w-4" />
            Clinics
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2 rounded-lg py-2 px-6 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md font-bold transition-all">
            <Users className="h-4 w-4" />
            Agents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clinics">
          <Card>
            <CardHeader>
              <CardTitle>Clinic Performance</CardTitle>
              <CardDescription>Overview of performance by clinic location</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={dashboardClinicColumns}
                data={clinicStats}
                searchKey="clinicName"
              />
            </CardContent>
          </Card>
        </TabsContent>

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
          <Card className="border-none shadow-lg overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50 px-6 py-4">
              <div>
                <CardTitle className="text-xl">Agent Performance</CardTitle>
                <CardDescription>Detailed breakdown of agent KPIs and metrics</CardDescription>
              </div>
              <Button onClick={() => setShowAddAgentModal(true)} className="bg-[#CBFF38] text-gray-900 hover:bg-[#B8EA32] shadow-sm font-bold">
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Agent
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={dashboardAgentColumns}
                data={agentKpis}
                searchKey="agentName"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Agent Modal */}
      {showAddAgentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader>
              <CardTitle>Add New Agent</CardTitle>
              <CardDescription>Create a new salesperson account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={newAgentData.firstName}
                  onChange={(e) => setNewAgentData({ ...newAgentData, firstName: e.target.value })}
                />
                <Input
                  label="Last Name"
                  value={newAgentData.lastName}
                  onChange={(e) => setNewAgentData({ ...newAgentData, lastName: e.target.value })}
                />
              </div>
              <Input
                label="Email"
                type="email"
                value={newAgentData.email}
                onChange={(e) => setNewAgentData({ ...newAgentData, email: e.target.value })}
              />
              <Input
                label="Password"
                type="password"
                value={newAgentData.password}
                onChange={(e) => setNewAgentData({ ...newAgentData, password: e.target.value })}
              />
              <Input
                label="Phone"
                value={newAgentData.phone}
                onChange={(e) => setNewAgentData({ ...newAgentData, phone: e.target.value })}
              />
            </CardContent>
            <div className="p-6 pt-0 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddAgentModal(false)}>Cancel</Button>
              <Button onClick={handleCreateAgent}>Create Agent</Button>
            </div>
          </Card>
        </div>
      )}
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
  icon: ReactNode;
  iconBg: string;
  description?: string;
}) => {
  const isPositive = change >= 0;

  return (
    <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-none shadow-md bg-white">
      <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-gray-50 to-transparent -mr-8 -mt-8 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500" />
      <div className={cn(
        "absolute right-4 top-4 h-12 w-12 rounded-xl flex items-center justify-center shadow-sm",
        iconBg
      )}>
        {cloneElement(icon as ReactElement, { className: "h-6 w-6" })}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-extrabold tracking-tight text-gray-900 mt-1">{value}</div>
        <div className="flex items-center text-xs mt-3 font-semibold">
          <span className={cn(
            "flex items-center px-2 py-1 rounded-full",
            isPositive ? "bg-green-100 text-green-700 font-bold" : "bg-red-100 text-red-700 font-bold"
          )}>
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1 rotate-180" />}
            {Math.abs(change)}%
          </span>
          <span className="ml-2 text-muted-foreground font-normal">vs last period</span>
        </div>
        {description && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-muted-foreground font-medium italic">
            <Activity className="h-3 w-3 text-blue-500" />
            {description}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ManagerDashboard;
