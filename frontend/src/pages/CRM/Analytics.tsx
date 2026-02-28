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
  BarChart3,
  Target,
  CheckCircle,
  Zap,
  Lightbulb
} from "lucide-react";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/Card/Card";
import { Button } from "@/components/atoms/Button/Button";
import { Select } from "@/components/atoms/Select/Select";
import { Input } from "@/components/atoms/Input/Input";
import { fetchSalespersonAnalytics, fetchCrmMetrics, fetchSalespersons } from "@/store/slices/crmSlice";
import type { RootState, AppDispatch } from "@/store";

// Utility for formatting percentage
const formatPercent = (val?: number) => val ? `${(val * 100).toFixed(1)}%` : '0%';

interface AnalyticsProps {
  initialSalespersonId?: string;
}

export const Analytics: React.FC<AnalyticsProps> = ({ initialSalespersonId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { analytics, isLoading, salespersons } = useSelector((state: RootState) => state.crm);
  const { user } = useSelector((state: RootState) => state.auth);
  const [salespersonId, setSalespersonId] = useState<string>(initialSalespersonId || "all");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const turnoverChartData = React.useMemo(() => {
    if (!analytics?.turnoverTimeSeries) return [];
    let cumulative = 0;
    return analytics.turnoverTimeSeries.map(d => {
      cumulative += d.amount;
      return {
        ...d,
        cumulative,
        displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    });
  }, [analytics?.turnoverTimeSeries]);

  const appointmentDonutData = React.useMemo(() => {
    if (!analytics?.appointmentStats) return [];
    const stats = analytics.appointmentStats;
    return [
      { name: 'Completed', value: stats.completed || 0, color: '#10b981' },
      { name: 'Booked/Pending', value: Math.max(0, (stats.total || 0) - (stats.completed || 0) - (stats.cancelled || 0) - (stats.noShow || 0)), color: '#3b82f6' },
      { name: 'Canceled', value: stats.cancelled || 0, color: '#ef4444' },
      { name: 'No-show', value: stats.noShow || 0, color: '#f97316' },
    ].filter(d => d.value > 0);
  }, [analytics?.appointmentStats]);

  const appointmentReturnData = React.useMemo(() => {
    if (!analytics?.appointmentStats) return [];
    const stats = analytics.appointmentStats;
    const isNew = Math.max(0, (stats.total || 0) - (stats.returned || 0));
    return [
      { name: 'New Clients', value: isNew, color: '#8b5cf6' },
      { name: 'Returned', value: stats.returned || 0, color: '#0ea5e9' },
    ].filter(d => d.value > 0);
  }, [analytics?.appointmentStats]);

  useEffect(() => {
    if (user?.role === 'salesperson' && user?.id) {
      setSalespersonId(user.id);
    } else if (user?.id && (salespersonId === "all" || !salespersonId)) {
      // For managers/admins, default to "all" or specific initial ID
      // but ensure state is initialized
    }
  }, [user]);

  useEffect(() => {
    dispatch(fetchSalespersons());
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
    dispatch(fetchSalespersons());
    loadSalespersonData();
  };

  return (
    <div className="p-3 md:p-4 max-w-7xl mx-auto space-y-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">CRM Analytics</h1>
          <p className="text-[10px] text-gray-400">Monitor performance metrics and activities.</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-1.5 h-8 text-xs py-1"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          Sync
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row items-end md:items-center gap-3">
        {user?.role !== 'salesperson' && (
          <div className="flex-1 w-full relative">
            <label className="text-[9px] font-bold text-gray-400 uppercase mb-0.5 block">Salesperson</label>
            <Select
              options={[
                { label: 'All Salespeople', value: 'all' },
                ...(salespersons || []).map(s => ({
                  label: `${s.firstName} ${s.lastName}`,
                  value: s.id
                }))
              ]}
              value={salespersonId}
              onChange={(val) => setSalespersonId(val)}
              className="h-8 text-xs"
            />
          </div>
        )}

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:w-36">
            <label className="text-[10px] font-medium text-gray-500 mb-1 block flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Start
            </label>
            <Input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="bg-gray-50 border-gray-200 h-9 text-xs"
            />
          </div>
          <div className="flex-1 md:w-36">
            <label className="text-[10px] font-medium text-gray-500 mb-1 block flex items-center gap-1">
              <Calendar className="w-3 h-3" /> End
            </label>
            <Input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="bg-gray-50 border-gray-200 h-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Turnover KPI Section (MTD) */}
      <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Turnover MTD</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-2">
        <MetricCard
          title="Monthly Target"
          value={analytics?.turnoverStats?.targetIsSet ? `€${analytics?.turnoverStats?.monthlyTarget.toLocaleString()}` : 'Not set'}
          icon={<Target className="w-5 h-5 text-gray-600" />}
          trend={!analytics?.turnoverStats?.targetIsSet ? "Missing target" : "Current monthly goal"}
          color={analytics?.turnoverStats?.targetIsSet ? "bg-gray-50 text-gray-700" : "bg-red-50 text-red-700"}
        />
        <MetricCard
          title="Turnover MTD"
          value={`€${(analytics?.turnoverStats?.achieved || 0).toLocaleString()}`}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          trend="Euros achieved up to today"
          color="bg-emerald-50 text-emerald-700"
        />
        <MetricCard
          title="Target Progress"
          value={analytics?.turnoverStats?.targetIsSet ? formatPercent(analytics?.turnoverStats?.progress) : '—'}
          icon={<CheckCircle className="w-5 h-5 text-blue-600" />}
          trend={analytics?.turnoverStats?.targetIsSet ? "Progress towards goal" : "No target set"}
          color="bg-blue-50 text-blue-700"
        />
        <MetricCard
          title="Pacing vs Target"
          value={analytics?.turnoverStats?.targetIsSet ? analytics?.turnoverStats?.pacingStatus : '—'}
          icon={<Clock className="w-5 h-5 text-purple-600" />}
          trend={analytics?.turnoverStats?.targetIsSet ? `Expected: ${formatPercent(analytics?.turnoverStats?.expectedProgress)}` : "No target set"}
          color={
            analytics?.turnoverStats?.pacingStatus === 'Ahead' ? "bg-emerald-50 text-emerald-700" :
              analytics?.turnoverStats?.pacingStatus === 'Behind' ? "bg-red-50 text-red-700" :
                "bg-blue-50 text-blue-700"
          }
        />
      </div>

      {/* Quick Insights Section */}
      <div className="grid grid-cols-1 gap-4 mb-4">
        <QuickInsights analytics={analytics} />
      </div>

      {/* Key Metrics Grid */}
      <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Activity Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Salesperson Performance Panel */}
        <Card className="lg:col-span-2 border-none shadow-md overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 py-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
              <CardTitle className="text-sm font-bold">Agent Performance</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            {salespersonId && analytics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Appointments Performance */}
                <div className="md:col-span-2 bg-slate-50 rounded-lg p-2 border border-slate-100 mb-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Appointments</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    <div className="bg-white px-1.5 py-1 rounded border border-slate-100 text-center">
                      <p className="text-[8px] uppercase font-bold text-slate-400">Booked</p>
                      <p className="text-sm font-black text-slate-800">{analytics.appointmentStats?.total || 0}</p>
                    </div>
                    <div className="bg-white px-1.5 py-1 rounded border border-slate-100 text-center">
                      <p className="text-[8px] uppercase font-bold text-emerald-500">Done</p>
                      <p className="text-sm font-black text-emerald-700">{analytics.appointmentStats?.completed || 0}</p>
                    </div>
                    <div className="bg-white px-1.5 py-1 rounded border border-slate-100 text-center">
                      <p className="text-[8px] uppercase font-bold text-red-400">Can</p>
                      <p className="text-sm font-black text-red-600">{analytics.appointmentStats?.cancelled || 0}</p>
                    </div>
                    <div className="bg-white px-1.5 py-1 rounded border border-slate-100 text-center">
                      <p className="text-[8px] uppercase font-bold text-orange-400">N-S</p>
                      <p className="text-sm font-black text-orange-600">{analytics.appointmentStats?.noShow || 0}</p>
                    </div>
                    <div className="bg-white px-1.5 py-1 rounded border border-slate-100 text-center">
                      <p className="text-[8px] uppercase font-bold text-blue-500">Ret</p>
                      <p className="text-sm font-black text-blue-700">{analytics.appointmentStats?.returned || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Turnover Chart Panel */}
                <div className="md:col-span-2 mt-1 space-y-2">
                  <h3 className="font-bold text-gray-500 text-[9px] uppercase tracking-wider">Turnover Trend (MTD)</h3>
                  <div className="h-48 w-full bg-white border border-gray-100 rounded-lg p-2 shadow-sm overflow-hidden" style={{ minWidth: 0 }}>
                    {turnoverChartData.length > 0 ? (
                      <ResponsiveContainer width="99%" height="100%" debounce={50}>
                        <ComposedChart data={turnoverChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                          <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF' }} dy={5} />
                          <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF' }} tickFormatter={(val) => `€${val}`} />
                          <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF' }} tickFormatter={(val) => `€${val}`} />
                          <Tooltip
                            contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 2px 4px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                            formatter={(value: number) => [`€${value.toLocaleString()}`, undefined]}
                          />
                          <Bar yAxisId="left" dataKey="amount" name="Daily" fill="#10b981" radius={[2, 2, 0, 0]} maxBarSize={30} />
                          <Line yAxisId="right" type="monotone" dataKey="cumulative" name="Total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">No data</div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <StatRow
                    label="Assigned"
                    value={analytics.leadsAssigned || 0}
                    icon={<Users className="w-3 h-3 text-gray-400" />}
                  />
                  <StatRow
                    label="Contacted"
                    value={analytics.leadsContacted || 0}
                    icon={<Users className="w-3 h-3 text-gray-400" />}
                  />
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Conversion Efficiency</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-gray-900">
                        {formatPercent(analytics.salespersonConversionRate)}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 h-1 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${(analytics.salespersonConversionRate || 0) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-100 shadow-sm">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Total Calls</p>
                    <p className="text-sm font-black text-gray-900">{analytics.communicationStats?.calls || 0}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-emerald-50/50 rounded text-center">
                      <p className="text-[8px] font-bold text-emerald-600 uppercase">Ans</p>
                      <p className="text-xs font-black text-emerald-700">{analytics.communicationStats?.answeredCalls || 0}</p>
                    </div>
                    <div className="p-2 bg-red-50/50 rounded text-center">
                      <p className="text-[8px] font-bold text-red-600 uppercase">Miss</p>
                      <p className="text-xs font-black text-red-700">{analytics.communicationStats?.missedCalls || 0}</p>
                    </div>
                  </div>

                  <div className="p-2 bg-indigo-50/50 rounded flex justify-between items-center">
                    <p className="text-[8px] font-bold text-indigo-600 uppercase">Talk Time</p>
                    <p className="text-xs font-black text-indigo-700">
                      {analytics.communicationStats?.totalDurationSeconds ? Math.floor(analytics.communicationStats.totalDurationSeconds / 60) : 0}m
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-center text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <Search className="w-8 h-8 mb-2 opacity-20" />
                <p className="font-medium text-sm">No Data Available</p>
                <p className="text-xs opacity-60 max-w-[200px] mt-1">
                  {!salespersonId ? 'Select a Salesperson above to view performance metrics.' : 'No records found for this period.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Breakdown Panel */}
        <Card className="border-none shadow-md">
          <CardHeader className="border-b border-gray-100 py-3">
            <CardTitle className="text-base">Activity Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {analytics ? (
                <>
                  <BreakdownItem label="Pending Tasks" value={analytics.actionStats?.pending || 0} total={analytics.actionStats?.total || 1} color="bg-orange-500" />
                  <BreakdownItem label="Completed Tasks" value={analytics.actionStats?.completed || 0} total={analytics.actionStats?.total || 1} color="bg-emerald-500" />
                  <BreakdownItem label="Missed Tasks" value={analytics.actionStats?.missed || 0} total={analytics.actionStats?.total || 1} color="bg-red-500" />

                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <h4 className="font-medium text-xs text-gray-700 mb-3">Customer Base</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2.5 bg-gray-50 rounded-lg">
                        <p className="text-[10px] text-gray-500">Total</p>
                        <p className="text-lg font-bold">{analytics.customerStats?.totalCustomers || 0}</p>
                      </div>
                      <div className="p-2.5 bg-gray-50 rounded-lg">
                        <p className="text-[10px] text-gray-500">Repeat</p>
                        <p className="text-lg font-bold text-blue-600">{analytics.customerStats?.repeatCustomers || 0}</p>
                      </div>
                    </div>
                    <div className="mt-3 p-2.5 bg-emerald-50 rounded-lg">
                      <p className="text-[10px] text-emerald-700 font-medium whitespace-nowrap">Lifetime Revenue</p>
                      <p className="text-lg font-black text-emerald-900 mt-0.5">
                        €{(analytics.customerStats?.totalRevenue || 0).toLocaleString()}
                      </p>
                    </div>

                    {/* Funnel Donut Charts */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="font-medium text-xs text-gray-700 mb-1">Appointments Overview</h4>
                      <div className="h-40 w-full" style={{ minWidth: 0 }}>
                        {appointmentDonutData.length > 0 ? (
                          <ResponsiveContainer width="99%" height="100%" debounce={50}>
                            <PieChart>
                              <Pie
                                data={appointmentDonutData}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={50}
                                paddingAngle={2}
                                dataKey="value"
                              >
                                {appointmentDonutData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value, name) => [value, name]}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                              />
                              <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '10px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No appointments recorded</div>
                        )}
                      </div>

                      <div className="h-32 w-full mt-1" style={{ minWidth: 0 }}>
                        {appointmentReturnData.length > 0 ? (
                          <ResponsiveContainer width="99%" height="100%" debounce={50}>
                            <PieChart>
                              <Pie
                                data={appointmentReturnData}
                                cx="50%"
                                cy="50%"
                                innerRadius={25}
                                outerRadius={40}
                                paddingAngle={2}
                                dataKey="value"
                              >
                                {appointmentReturnData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '10px' }} />
                              <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-xs text-gray-500 text-center py-6">Loading stats...</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div >
  );
};

// UI Components
const MetricCard = ({ title, value, icon, trend, color }: any) => (
  <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-3">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg flex-shrink-0 ${color}`}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-3.5 h-3.5' })}
        </div>
        <div className="min-w-0">
          <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-wider truncate">{title}</h3>
          <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
        </div>
      </div>
      <p className="text-[9px] text-gray-400 mt-1 truncate">{trend}</p>
    </CardContent>
  </Card>
);

const StatRow = ({ label, value, icon }: any) => (
  <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
    <div className="flex items-center gap-2">
      <div className="p-1 bg-gray-100 rounded-full">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-3 h-3' })}
      </div>
      <span className="text-[11px] font-medium text-gray-600">{label}</span>
    </div>
    <span className="text-xs font-semibold text-gray-900">{value}</span>
  </div>
);

const BreakdownItem = ({ label, value, total, color }: any) => {
  const percent = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-0.5">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{value}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1">
        <div
          className={`h-1 rounded-full ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

const QuickInsights = ({ analytics }: { analytics: any }) => {
  if (!analytics) return null;

  const insights = [];
  const stats = analytics.appointmentStats || {};
  const turnover = analytics.turnoverStats || {};

  // 1. No-show Insight
  const noShowRate = (stats.noShow || 0) / (stats.total || 1);
  if (noShowRate > 0.1) {
    insights.push({
      type: 'warning',
      text: `No-show rate: ${(noShowRate * 100).toFixed(0)}%. Add reminders.`,
      icon: <Clock className="w-4 h-4" />
    });
  }

  // 2. Conversion Insight
  const conversionRate = (stats.completed || 0) / (stats.total || 1);
  if (conversionRate < 0.7 && stats.total > 5) {
    insights.push({
      type: 'info',
      text: `Conversion: ${(conversionRate * 100).toFixed(0)}%. Review reasons.`,
      icon: <Activity className="w-4 h-4" />
    });
  }

  // 3. Pacing Insight
  if (turnover.targetIsSet) {
    const isBehind = turnover.pacingStatus === 'Behind';
    insights.push({
      type: isBehind ? 'warning' : 'success',
      text: `${isBehind ? 'Behind' : 'On Track'}: ${(turnover.progress * 100).toFixed(0)}% of goal reached.`,
      icon: isBehind ? <Zap className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: 'success',
      text: "Metrics optimal. Keep up the consistency!",
      icon: <Lightbulb className="w-4 h-4" />
    });
  }

  return (
    <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50/50 to-white">
      <CardHeader className="py-2 px-4 border-b border-gray-50/50">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-indigo-600" />
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-600">Quick Insights</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {insights.map((insight, idx) => (
            <div key={idx} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${insight.type === 'warning' ? 'bg-orange-50 border-orange-100 text-orange-800' :
              insight.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                'bg-blue-50 border-blue-100 text-blue-800'
              }`}>
              <div className="flex-shrink-0">{React.cloneElement(insight.icon as React.ReactElement, { className: 'w-3.5 h-3.5' })}</div>
              <p className="text-[10px] font-semibold leading-tight">{insight.text}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
