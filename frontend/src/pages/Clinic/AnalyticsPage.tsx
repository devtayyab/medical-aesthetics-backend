import React, { useEffect, useState } from 'react';
import clinicApi from '../../services/api/clinicApi';
import { TrendingUp, DollarSign, Calendar, Users, Award, Repeat } from 'lucide-react';

const AnalyticsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const [appointmentAnalytics, setAppointmentAnalytics] = useState<any>(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState<any>(null);
  const [loyaltyAnalytics, setLoyaltyAnalytics] = useState<any>(null);
  const [repeatForecast, setRepeatForecast] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const [appointments, revenue, loyalty, repeat] = await Promise.all([
        clinicApi.analytics.getAppointmentAnalytics(dateRange),
        clinicApi.analytics.getRevenueAnalytics(dateRange),
        clinicApi.analytics.getLoyaltyAnalytics(dateRange),
        clinicApi.analytics.getRepeatForecast(dateRange),
      ]);

      setAppointmentAnalytics(appointments);
      setRevenueAnalytics(revenue);
      setLoyaltyAnalytics(loyalty);
      setRepeatForecast(repeat);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="text-gray-600 mt-2">Track your clinic's performance and insights</p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Date Range:</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Appointments"
          value={appointmentAnalytics?.totalAppointments || 0}
          icon={<Calendar className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Completed"
          value={appointmentAnalytics?.completedAppointments || 0}
          icon={<Calendar className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Total Revenue"
          value={`$${(revenueAnalytics?.totalRevenue || 0).toFixed(2)}`}
          icon={<DollarSign className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="Avg Per Appointment"
          value={`$${(revenueAnalytics?.averageAppointmentValue || 0).toFixed(2)}`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="yellow"
        />
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Service */}
        {revenueAnalytics?.revenueByService && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue by Service</h2>
            <div className="space-y-3">
              {revenueAnalytics.revenueByService.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.serviceName}</p>
                    <p className="text-sm text-gray-600">{item.count} appointments</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">${item.revenue.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loyalty Analytics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Loyalty Program
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total Points Issued</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loyaltyAnalytics?.totalPoints || 0}
                </p>
              </div>
              <Award className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Active Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loyaltyAnalytics?.uniqueClients || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Avg Points Per Transaction</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(loyaltyAnalytics?.avgPointsPerTransaction || 0).toFixed(0)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Repeat Customer Forecast */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Repeat className="w-5 h-5 text-purple-500" />
            Repeat Customer Forecast
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600 mb-1">Expected Next Month</p>
              <p className="text-3xl font-bold text-purple-900">
                {repeatForecast?.customersExpectedNextMonth || 0}
              </p>
              <p className="text-sm text-purple-600 mt-1">customers</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 mb-1">Estimated Revenue</p>
              <p className="text-3xl font-bold text-green-900">
                ${(repeatForecast?.estimatedRevenue || 0).toFixed(2)}
              </p>
              <p className="text-sm text-green-600 mt-1">projected</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">Repeat Rate</p>
              <p className="text-3xl font-bold text-blue-900">
                {(repeatForecast?.repeatRate || 0).toFixed(1)}%
              </p>
              <p className="text-sm text-blue-600 mt-1">of clients</p>
            </div>
          </div>

          {/* Upcoming Repeat Customers */}
          {repeatForecast?.customers && repeatForecast.customers.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Customers Due for Next Visit</h3>
              <div className="space-y-2">
                {repeatForecast.customers.slice(0, 5).map((customer: any) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      <p className="text-sm text-gray-600">
                        Last visit: {new Date(customer.lastVisit).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Expected</p>
                      <p className="font-medium text-gray-900">
                        {new Date(customer.expectedNextVisit).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'yellow' | 'green' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
