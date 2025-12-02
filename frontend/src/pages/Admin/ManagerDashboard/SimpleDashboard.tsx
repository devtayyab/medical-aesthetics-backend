import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAgentKpis, fetchServiceStats, fetchClinicReturnRates, fetchServicePerformance, fetchAdvertisementStats } from '../../../services/managerAnalytics.service';
import { TrendingUp, TrendingDown, Users, DollarSign, Calendar, Target, Activity, BarChart3, PieChart, Zap } from 'lucide-react';

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

export const SimpleDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = React.useState('30');
  const [activeTab, setActiveTab] = React.useState('overview');

  // Use TanStack Query for data fetching
  const { data: agentKpis = [], isLoading: agentsLoading, error: agentsError } = useQuery({
    queryKey: ['agentKpis', selectedPeriod],
    queryFn: () => fetchAgentKpis(),
  });

  const { data: serviceStats = [], isLoading: servicesLoading, error: servicesError } = useQuery({
    queryKey: ['serviceStats', selectedPeriod],
    queryFn: () => fetchServiceStats(),
  });

  const { data: clinicReturnRates = [], isLoading: clinicsLoading, error: clinicsError } = useQuery({
    queryKey: ['clinicReturnRates', selectedPeriod],
    queryFn: () => fetchClinicReturnRates(),
  });

  const { data: advertisementStats = [], isLoading: adsLoading, error: adsError } = useQuery({
    queryKey: ['advertisementStats', selectedPeriod],
    queryFn: () => fetchAdvertisementStats(),
  });

  const isLoading = agentsLoading || servicesLoading || clinicsLoading || adsLoading;
  const error = agentsError || servicesError || clinicsError || adsError;

  // Calculate summary metrics
  const totalRevenue = agentKpis.reduce((sum, agent) => sum + agent.totalRevenue, 0);
  const totalAppointments = agentKpis.reduce((sum, agent) => sum + agent.totalAppointments, 0);
  const avgConversionRate = agentKpis.length > 0 
    ? agentKpis.reduce((sum, agent) => sum + agent.conversionRate, 0) / agentKpis.length 
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span>{error.message || 'Failed to load dashboard data. Please try again later.'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Manager Dashboard
          </h1>
          <p className="text-gray-600">Monitor your clinic's performance and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-medium text-white/90">Total Revenue</h3>
              <DollarSign className="h-4 w-4 text-white/80" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">{formatCurrency(totalRevenue)}</div>
            <div className="flex items-center text-xs text-white/70">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>+12.5% from last period</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-medium text-white/90">Total Appointments</h3>
              <Calendar className="h-4 w-4 text-white/80" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">{totalAppointments}</div>
            <div className="flex items-center text-xs text-white/70">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>+8.2% from last period</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-medium text-white/90">Avg. Conversion</h3>
              <Target className="h-4 w-4 text-white/80" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">{(avgConversionRate * 100).toFixed(1)}%</div>
            <div className="flex items-center text-xs text-white/70">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>+3.1% from last period</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-medium text-white/90">Active Agents</h3>
              <Users className="h-4 w-4 text-white/80" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">{agentKpis.length}</div>
            <div className="flex items-center text-xs text-white/70">
              <Activity className="h-3 w-3 mr-1" />
              <span>All agents active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for different sections */}
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'agents'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-4 w-4" />
              Agents
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'services'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Zap className="h-4 w-4" />
              Services
            </button>
            <button
              onClick={() => setActiveTab('marketing')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'marketing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PieChart className="h-4 w-4" />
              Marketing
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Quick Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Top Performing Agent
                </h3>
                {agentKpis.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-semibold text-lg">{agentKpis[0].agentName}</div>
                    <div className="text-sm text-gray-600">{formatCurrency(agentKpis[0].totalRevenue)} revenue</div>
                    <span className="inline-block px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                      {(agentKpis[0].conversionRate * 100).toFixed(1)}% conversion
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-500" />
                  Most Popular Service
                </h3>
                {serviceStats.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-semibold text-lg">{serviceStats[0].serviceName}</div>
                    <div className="text-sm text-gray-600">{serviceStats[0].totalAppointments} appointments</div>
                    <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
                      {formatCurrency(serviceStats[0].totalRevenue)} revenue
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  Clinic Performance
                </h3>
                <div className="space-y-2">
                  <div className="font-semibold text-lg">Excellent</div>
                  <div className="text-sm text-gray-600">Overall health score</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Agent Performance</h2>
                <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
                  Export Report
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointments</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {agentKpis.map((agent) => (
                      <tr key={agent.agentName}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{agent.agentName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agent.totalAppointments}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(agent.totalRevenue)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(agent.conversionRate * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Service Performance</h2>
                <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
                  Export Report
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointments</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {serviceStats.map((service) => (
                      <tr key={service.serviceName}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.serviceName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.totalAppointments}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(service.totalRevenue)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(service.totalRevenue / service.totalAppointments)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'marketing' && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Clinic Return Rates</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {clinicReturnRates.slice(0, 5).map((clinic) => (
                    <div key={clinic.clinicId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{clinic.clinicName}</div>
                        <div className="text-sm text-gray-600">{clinic.last30Days} returns in 30 days</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg">{(clinic.returnRate * 100).toFixed(1)}%</div>
                        <div className="text-xs text-gray-600">return rate</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Advertisement Performance</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {advertisementStats.slice(0, 5).map((ad) => (
                    <div key={ad.adId} className="p-3 bg-gray-50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{ad.campaignName}</div>
                        <span className="inline-block px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 rounded-full">
                          {ad.channel}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Spent:</span>
                          <span className="ml-1 font-medium">{formatCurrency(ad.spent)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Patients:</span>
                          <span className="ml-1 font-medium">{ad.patientsCame}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Revenue:</span>
                          <span className="ml-1 font-medium">{formatCurrency(ad.totalRevenue)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">ROI:</span>
                          <span className="ml-1 font-medium text-green-600">
                            {ad.spent > 0 ? ((ad.totalRevenue / ad.spent - 1) * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleDashboard;
