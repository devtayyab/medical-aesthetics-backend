import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Users,
  UserCheck,
  TrendingUp,
  Activity,
  Calendar,
  Search,
  RefreshCw,
  Clock,
  BarChart3
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { fetchSalespersonAnalytics, fetchCrmMetrics } from "@/store/slices/crmSlice";
import type { RootState, AppDispatch } from "@/store";

// Utility for formatting percentage
const formatPercent = (val?: number) => val ? `${(val * 100).toFixed(1)}%` : '0%';

export const Analytics: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { analytics, isLoading } = useSelector((state: RootState) => state.crm);
  const { user } = useSelector((state: RootState) => state.auth);
  const [salespersonId, setSalespersonId] = useState<string>("");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (user?.id && !salespersonId) {
      setSalespersonId(user.id);
    }
  }, [user]);

  useEffect(() => {
    dispatch(fetchCrmMetrics());
  }, [dispatch]);

  const loadSalespersonData = () => {
    if (salespersonId) {
      dispatch(fetchSalespersonAnalytics({
        salespersonId,
        dateRange
      }));
    }
  };

  useEffect(() => {
    loadSalespersonData();
  }, [dispatch, salespersonId, dateRange]);

  const handleRefresh = () => {
    dispatch(fetchCrmMetrics());
    loadSalespersonData();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">CRM Analytics</h1>
          <p className="text-gray-500 mt-1">Monitor performance metrics and salesperson activities.</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Sync Data
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-end md:items-center gap-4">
        <div className="flex-1 w-full relative">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Salesperson ID</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by Salesperson ID..."
              value={salespersonId}
              onChange={(e) => setSalespersonId(e.target.value)}
              className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:w-40">
            <label className="text-xs font-medium text-gray-500 mb-1 block flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Start Date
            </label>
            <Input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="bg-gray-50 border-gray-200"
            />
          </div>
          <div className="flex-1 md:w-40">
            <label className="text-xs font-medium text-gray-500 mb-1 block flex items-center gap-1">
              <Calendar className="w-3 h-3" /> End Date
            </label>
            <Input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="bg-gray-50 border-gray-200"
            />
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Leads"
          value={analytics?.totalLeads || 0}
          icon={<Users className="w-5 h-5 text-blue-600" />}
          trend="Total accumulated"
          color="bg-blue-50 text-blue-700"
        />
        <MetricCard
          title="Converted Leads"
          value={analytics?.convertedLeads || 0}
          icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
          trend="Successful conversions"
          color="bg-emerald-50 text-emerald-700"
        />
        <MetricCard
          title="Conversion Rate"
          value={formatPercent(analytics?.conversionRate)}
          icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
          trend="Overall performance"
          color="bg-indigo-50 text-indigo-700"
        />
        <MetricCard
          title="Total Actions"
          value={analytics?.totalActions || 0}
          icon={<Activity className="w-5 h-5 text-purple-600" />}
          trend={`${analytics?.completedActions || 0} Completed`}
          color="bg-purple-50 text-purple-700"
        />
      </div>

      {/* Detailed Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Salesperson Performance Panel */}
        <Card className="lg:col-span-2 border-none shadow-md overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Agent Performance</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {salespersonId && analytics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <StatRow
                    label="Assigned Leads"
                    value={analytics.leadsAssigned || 0}
                    icon={<Users className="w-4 h-4 text-gray-400" />}
                  />
                  <StatRow
                    label="Leads Contacted"
                    value={analytics.leadsContacted || 0}
                    icon={<Users className="w-4 h-4 text-gray-400" />}
                  />
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-500 mb-2">Conversion Efficiency</p>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold text-gray-900">
                        {formatPercent(analytics.salespersonConversionRate)}
                      </span>
                      <span className="text-sm text-green-600 font-medium mb-1">
                        success rate
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${(analytics.salespersonConversionRate || 0) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <div className="flex items-start gap-4 p-3 bg-white rounded-lg shadow-sm">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Calls</p>
                      <p className="text-lg font-bold text-gray-900">{analytics.communicationStats?.calls || 0}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Answered</p>
                      <p className="text-lg font-bold">{analytics.communicationStats?.answeredCalls || 0}</p>
                    </div>
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg">
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Missed</p>
                      <p className="text-lg font-bold">{analytics.communicationStats?.missedCalls || 0}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Talk Time</p>
                        <p className="text-lg font-bold">{analytics.communicationStats?.totalDurationSeconds ? Math.floor(analytics.communicationStats.totalDurationSeconds / 60) : 0}m {analytics.communicationStats?.totalDurationSeconds ? analytics.communicationStats.totalDurationSeconds % 60 : 0}s</p>
                      </div>
                      <Clock className="w-5 h-5 opacity-40" />
                    </div>
                    <p className="text-[10px] mt-1">Avg: {analytics.communicationStats?.avgDurationMinutes || 0} min/call</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <Search className="w-10 h-10 mb-3 opacity-20" />
                <p className="font-medium">No Data Available</p>
                <p className="text-sm opacity-60 max-w-xs mt-1">
                  {!salespersonId ? 'Enter a valid Salesperson ID above to view detailed performance metrics.' : 'No records found for this period.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Breakdown Panel */}
        <Card className="border-none shadow-md">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg">Activity Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {analytics ? (
                <>
                  <BreakdownItem label="Pending Tasks" value={analytics.actionStats?.pending || 0} total={analytics.actionStats?.total || 1} color="bg-orange-500" />
                  <BreakdownItem label="Completed Tasks" value={analytics.actionStats?.completed || 0} total={analytics.actionStats?.total || 1} color="bg-emerald-500" />
                  <BreakdownItem label="Missed Tasks" value={analytics.actionStats?.missed || 0} total={analytics.actionStats?.total || 1} color="bg-red-500" />

                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <h4 className="font-medium text-sm text-gray-700 mb-4">Customer Base</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="text-xl font-bold">{analytics.customerStats?.totalCustomers || 0}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Repeat</p>
                        <p className="text-xl font-bold text-blue-600">{analytics.customerStats?.repeatCustomers || 0}</p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                      <p className="text-xs text-emerald-700 font-medium">Lifetime Revenue</p>
                      <p className="text-xl font-black text-emerald-900 mt-1">
                        £{(analytics.customerStats?.totalRevenue || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500 text-center py-8">Loading stats...</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// UI Components
const MetricCard = ({ title, value, icon, trend, color }: any) => (
  <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
        {/* <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">+2.5%</span> */}
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{trend}</p>
      </div>
    </CardContent>
  </Card>
);

const StatRow = ({ label, value, icon }: any) => (
  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-gray-100 rounded-full">
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-600">{label}</span>
    </div>
    <span className="font-semibold text-gray-900">{value}</span>
  </div>
);

const BreakdownItem = ({ label, value, total, color }: any) => {
  const percent = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{value}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

