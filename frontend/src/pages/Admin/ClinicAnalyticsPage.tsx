import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  Building2, Users, Calendar, CheckCircle2, XCircle, AlertCircle,
  TrendingUp, RefreshCw, Euro, Database, MapPin, Sparkles,
  ArrowUpRight, Activity, Percent, Search, ShieldCheck
} from 'lucide-react';
import { crmAPI, adminAPI } from '@/services/api';
import { toast } from 'react-hot-toast';

const PALETTE = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#64748b'];

export const ClinicAnalyticsPage = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');
  const [tableSearch, setTableSearch] = useState<string>('');
  const [activePreset, setActivePreset] = useState<'thisMonth' | 'lastMonth' | 'ytd' | 'custom'>('thisMonth');
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  const fetchClinics = async () => {
    try {
      const res = await crmAPI.getAccessibleClinics();
      setClinics(res.data || []);
    } catch (e) {
      console.error('Failed to fetch clinics', e);
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await crmAPI.getClinicAnalytics({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        clinicId: selectedClinicId || undefined,
      });
      setData(res.data || []);
    } catch (e) {
      console.error('Failed to fetch clinic analytics', e);
      toast.error('Failed to load clinic intelligence analytics');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, selectedClinicId]);

  const handlePreset = (preset: 'thisMonth' | 'lastMonth' | 'ytd') => {
    setActivePreset(preset);
    const now = new Date();
    if (preset === 'thisMonth') {
      setDateRange({
        startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
      });
    } else if (preset === 'lastMonth') {
      const prev = subMonths(now, 1);
      setDateRange({
        startDate: format(startOfMonth(prev), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(prev), 'yyyy-MM-dd'),
      });
    } else if (preset === 'ytd') {
      setDateRange({
        startDate: format(startOfYear(now), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
      });
    }
  };

  const handleSeedData = async () => {
    if (!confirm('This will generate mock appointments, revenue, and clients for testing. Continue?')) return;
    setIsLoading(true);
    try {
      await (adminAPI as any).axiosInstance.get('/crm/manager-crm/seed-mock-data');
      await fetchData();
      toast.success('Mock analytics data generated successfully!');
    } catch (e) {
      console.error('Failed to seed data', e);
      toast.error('Failed to seed data. Verify backend seeder availability.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Aggregated totals
  const totals = useMemo(() => {
    return data.reduce((acc, c) => ({
      totalRevenue: acc.totalRevenue + (c.totalRevenue || 0),
      totalAppointments: acc.totalAppointments + (c.totalAppointments || 0),
      completed: acc.completed + (c.completed || 0),
      cancelled: acc.cancelled + (c.cancelled || 0),
      noShow: acc.noShow + (c.noShow || 0),
      uniqueClients: acc.uniqueClients + (c.uniqueClients || 0),
    }), { totalRevenue: 0, totalAppointments: 0, completed: 0, cancelled: 0, noShow: 0, uniqueClients: 0 });
  }, [data]);

  const completionRate = totals.totalAppointments > 0
    ? ((totals.completed / totals.totalAppointments) * 100).toFixed(1)
    : '0.0';

  const avgTicket = totals.completed > 0
    ? (totals.totalRevenue / totals.completed).toFixed(0)
    : '0';

  const avgSpendPerPatient = totals.uniqueClients > 0
    ? (totals.totalRevenue / totals.uniqueClients).toFixed(0)
    : '0';

  const revenueChartData = useMemo(() =>
    [...data]
      .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
      .slice(0, 7)
      .map(c => ({
        name: c.clinicName || 'Unknown Clinic',
        displayName: (c.clinicName || 'Unknown').length > 14 ? (c.clinicName || 'Unknown').slice(0, 14) + '…' : (c.clinicName || 'Unknown'),
        revenue: parseFloat((c.totalRevenue || 0).toFixed(0)),
        completed: c.completed || 0,
      })), [data]);

  const pieData = useMemo(() => {
    const items = [
      { name: 'Completed', value: totals.completed, color: '#10b981', desc: 'Successfully delivered' },
      { name: 'Cancelled', value: totals.cancelled, color: '#ef4444', desc: 'Patient / Clinic cancelled' },
      { name: 'No-Show', value: totals.noShow, color: '#f59e0b', desc: 'Missed without notice' },
    ];
    const other = Math.max(0, totals.totalAppointments - totals.completed - totals.cancelled - totals.noShow);
    if (other > 0) {
      items.push({ name: 'Pending / In-Progress', value: other, color: '#3b82f6', desc: 'Upcoming or active' });
    }
    return items.filter(d => d.value > 0);
  }, [totals]);

  const filteredClinics = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    const sorted = [...data].sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0));
    if (!q) return sorted;
    return sorted.filter(c =>
      (c.clinicName || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  }, [data, tableSearch]);

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-[#0B1120] text-white p-3 rounded-xl shadow-2xl border border-white/10 text-xs">
          <p className="font-bold text-[#CBFF38] mb-1">{p.name}</p>
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Gross Revenue:</span>
            <span className="font-bold text-white">€{p.revenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-400 mt-0.5 text-[11px]">
            <span>Completed Appointments:</span>
            <span className="text-emerald-400 font-semibold">{p.completed}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0];
      const percent = totals.totalAppointments > 0 ? ((p.value / totals.totalAppointments) * 100).toFixed(1) : 0;
      return (
        <div className="bg-[#0B1120] text-white p-3 rounded-xl shadow-2xl border border-white/10 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.payload.color }} />
            <p className="font-bold text-white">{p.name}</p>
          </div>
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Count:</span>
            <span className="font-bold text-white">{p.value} ({percent}%)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">

      {/* ── Header & Global Filters ─────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Left: Brand Badge & Title */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0B1120] flex items-center justify-center shadow-xl shadow-black/10 flex-shrink-0 ring-1 ring-white/10">
            <Building2 className="text-[#CBFF38]" size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Clinic Intelligence</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold ring-1 ring-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-sm text-gray-400 font-medium mt-0.5">
              Platform Distribution, Clinical Throughput &amp; Revenue Analytics
            </p>
          </div>
        </div>

        {/* Right: Controls & Presets */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Quick Date Presets */}
          <div className="inline-flex bg-gray-100 p-1 rounded-xl ring-1 ring-gray-200/50">
            <button
              onClick={() => handlePreset('thisMonth')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activePreset === 'thisMonth'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => handlePreset('lastMonth')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activePreset === 'lastMonth'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => handlePreset('ytd')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activePreset === 'ytd'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              YTD
            </button>
          </div>

          {/* Clinic Selector */}
          <div className="relative">
            <select
              value={selectedClinicId}
              onChange={(e) => setSelectedClinicId(e.target.value)}
              className="appearance-none bg-white pl-4 pr-9 py-2 rounded-xl text-xs font-bold text-gray-800 border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#CBFF38] focus:border-transparent transition-all cursor-pointer h-10"
            >
              <option value="">All Clinics ({clinics.length})</option>
              {clinics.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <Building2 size={13} />
            </div>
          </div>

          {/* Date Picker Range */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm h-10">
            <Calendar size={14} className="text-gray-400 shrink-0" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => {
                setActivePreset('custom');
                setDateRange(prev => ({ ...prev, startDate: e.target.value }));
              }}
              className="bg-transparent text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer w-28"
            />
            <span className="text-[10px] text-gray-300 font-bold">TO</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => {
                setActivePreset('custom');
                setDateRange(prev => ({ ...prev, endDate: e.target.value }));
              }}
              className="bg-transparent text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer w-28"
            />
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchData}
            title="Refresh Data"
            className="h-10 px-4 inline-flex items-center justify-center gap-2 bg-[#0B1120] text-white hover:bg-black font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          {/* Admin Seeder */}
          {(user?.role === 'admin' || user?.role === 'SUPER_ADMIN' || user?.role === 'manager') && (
            <button
              onClick={handleSeedData}
              title="Seed Mock Data for Demonstration"
              className="h-10 px-3.5 inline-flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all"
            >
              <Database size={13} />
              <span>Seed Mock</span>
            </button>
          )}

        </div>

      </div>

      {/* ── Main Dashboard Body ────────────────────────────────────────── */}
      {isLoading ? (
        /* Shimmer Skeleton */
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-36 bg-gray-100 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-100 rounded-3xl" />
            <div className="h-80 bg-gray-100 rounded-3xl" />
          </div>
          <div className="h-96 bg-gray-100 rounded-3xl" />
        </div>
      ) : (
        <div className="space-y-8">

          {/* ── KPI Metric Cards ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* Card 1: Estimated Revenue (Luxury Dark Theme) */}
            <div className="relative bg-[#0B1120] text-white rounded-2xl p-6 shadow-xl shadow-black/10 overflow-hidden ring-1 ring-white/10 flex flex-col justify-between group hover:shadow-2xl transition-all">
              <div className="absolute -right-4 -top-4 w-28 h-28 bg-[#CBFF38]/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />
              <div className="absolute right-3 bottom-2 opacity-5 text-white pointer-events-none">
                <Euro size={80} />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Gross Revenue
                  </span>
                  <div className="p-1.5 rounded-lg bg-white/10 text-[#CBFF38]">
                    <Euro size={15} />
                  </div>
                </div>
                <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-2">
                  €{totals.totalRevenue.toLocaleString()}
                </h3>
              </div>

              <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#CBFF38] animate-ping" />
                  Live Collection
                </span>
                <span className="text-[#CBFF38] font-bold text-[11px]">
                  Avg €{avgTicket}/apt
                </span>
              </div>
            </div>

            {/* Card 2: Active Appointments */}
            <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-gray-100 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                    Total Volume
                  </span>
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                    <Calendar size={15} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
                    {totals.totalAppointments}
                  </h3>
                  <span className="text-xs text-gray-400 font-semibold">Bookings</span>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-gray-50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-emerald-600 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md">
                  <CheckCircle2 size={12} />
                  <span>{totals.completed} Done</span>
                </div>
                <div className="flex items-center gap-1 text-red-500 font-bold text-[11px] bg-red-50 px-2 py-0.5 rounded-md">
                  <XCircle size={12} />
                  <span>{totals.cancelled} Cancel</span>
                </div>
              </div>
            </div>

            {/* Card 3: Retention & Completion Efficiency */}
            <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-gray-100 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                    Retention Health
                  </span>
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <Percent size={15} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-600">
                    {completionRate}%
                  </h3>
                  <span className="text-xs font-semibold text-gray-400">Completion</span>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-gray-50 space-y-1.5">
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.max(0, parseFloat(completionRate)))}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase">
                  <span>Throughput Rate</span>
                  <span className={parseFloat(completionRate) > 70 ? 'text-emerald-600' : 'text-amber-500'}>
                    {parseFloat(completionRate) > 70 ? 'Optimal' : 'Needs Attention'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Unique Patient Database */}
            <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-gray-100 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                    Unique Patients
                  </span>
                  <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600">
                    <Users size={15} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
                    {totals.uniqueClients}
                  </h3>
                  <span className="text-xs font-semibold text-gray-400">Active Records</span>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-gray-50 flex items-center justify-between text-xs">
                <span className="text-gray-400 text-[11px] font-medium">Avg Value/Patient</span>
                <span className="font-extrabold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md text-[11px]">
                  €{avgSpendPerPatient}
                </span>
              </div>
            </div>

          </div>

          {/* ── Visual Analytics: 2 Columns ────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Column 1: Top Revenue Centers (Bar Chart) */}
            <div className="bg-white rounded-3xl p-6 shadow-sm ring-1 ring-gray-100 flex flex-col">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-900 text-[#CBFF38]">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Top Revenue Centers</h3>
                    <p className="text-xs text-gray-400">Ranking clinics by gross performance</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
                  {revenueChartData.length} Locations
                </span>
              </div>

              <div className="h-72 w-full">
                {revenueChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueChartData} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="displayName"
                        tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `€${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      />
                      <RechartsTooltip content={<CustomBarTooltip />} />
                      <Bar
                        dataKey="revenue"
                        fill="#0B1120"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={45}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                    <Database size={32} />
                    <p className="text-xs font-semibold text-gray-400">No revenue data available for period</p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Appointment Status Integrity (Donut Chart) */}
            <div className="bg-white rounded-3xl p-6 shadow-sm ring-1 ring-gray-100 flex flex-col">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Appointment Status Integrity</h3>
                    <p className="text-xs text-gray-400">Fulfillment vs Attrition Breakdown</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
                  {totals.totalAppointments} Total
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center h-72">
                {pieData.length > 0 ? (
                  <>
                    <div className="h-64 relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={95}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                          >
                            {pieData.map((entry, i) => (
                              <Cell key={`cell-${i}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip content={<CustomPieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-black text-gray-900">{totals.totalAppointments}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Bookings</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {pieData.map((p) => {
                        const pct = totals.totalAppointments > 0 ? ((p.value / totals.totalAppointments) * 100).toFixed(0) : 0;
                        return (
                          <div key={p.name} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-2.5">
                              <span className="w-3 h-3 rounded-md shrink-0" style={{ backgroundColor: p.color }} />
                              <div>
                                <p className="text-xs font-bold text-gray-800">{p.name}</p>
                                <p className="text-[10px] text-gray-400">{p.desc}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-extrabold text-gray-900">{p.value}</span>
                              <span className="text-[10px] text-gray-400 ml-1">({pct}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="col-span-2 w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                    <Database size={32} />
                    <p className="text-xs font-semibold text-gray-400">No appointment records found</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── Detailed Performance Matrix Table ────────────────────────── */}
          <div className="bg-white rounded-3xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
            
            {/* Table Header Controls */}
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
                  <MapPin size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Geographic Performance Matrix</h3>
                  <p className="text-xs text-gray-400">Per-clinic breakdown of volume, revenue, and retention efficiency</p>
                </div>
              </div>

              {/* Table Search */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search clinic or phone..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CBFF38] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Clinic Location</th>
                    <th className="px-6 py-4">Total Vol.</th>
                    <th className="px-6 py-4">Completed</th>
                    <th className="px-6 py-4">Attrition</th>
                    <th className="px-6 py-4">Unique Patients</th>
                    <th className="px-6 py-4">Gross Revenue</th>
                    <th className="px-6 py-4 min-w-[150px]">Efficiency Yield</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {filteredClinics.length > 0 ? (
                    filteredClinics.map((clinic, idx) => {
                      const yieldRate = clinic.totalAppointments > 0
                        ? ((clinic.completed / clinic.totalAppointments) * 100).toFixed(0)
                        : '0';
                      const numYield = parseFloat(yieldRate);
                      const rankColor = PALETTE[idx % PALETTE.length];

                      return (
                        <tr key={clinic.clinicId || idx} className="hover:bg-gray-50/70 transition-colors group">
                          
                          {/* Clinic Name & Rank */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-sm shrink-0"
                                style={{ backgroundColor: rankColor }}
                              >
                                #{idx + 1}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {clinic.clinicName || 'Unknown Location'}
                                </p>
                                <p className="text-[11px] text-gray-400 font-medium">
                                  {clinic.phone || 'No direct phone record'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Total Volume */}
                          <td className="px-6 py-4 font-bold text-gray-800">
                            {clinic.totalAppointments}
                          </td>

                          {/* Completed */}
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200">
                              <CheckCircle2 size={12} />
                              {clinic.completed}
                            </span>
                          </td>

                          {/* Attrition (Cancelled / No-Show) */}
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {clinic.cancelled > 0 && (
                                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                                  {clinic.cancelled} Cnl
                                </span>
                              )}
                              {clinic.noShow > 0 && (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                                  {clinic.noShow} No-Show
                                </span>
                              )}
                              {clinic.cancelled === 0 && clinic.noShow === 0 && (
                                <span className="text-xs text-gray-400 font-medium">0</span>
                              )}
                            </div>
                          </td>

                          {/* Unique Patients */}
                          <td className="px-6 py-4 font-semibold text-gray-700">
                            {clinic.uniqueClients}
                          </td>

                          {/* Gross Revenue */}
                          <td className="px-6 py-4 font-extrabold text-gray-900">
                            €{(clinic.totalRevenue || 0).toLocaleString()}
                          </td>

                          {/* Efficiency Yield Bar */}
                          <td className="px-6 py-4">
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs font-bold">
                                <span className="text-gray-400">Yield</span>
                                <span className={numYield >= 70 ? 'text-emerald-600' : numYield >= 40 ? 'text-amber-600' : 'text-red-500'}>
                                  {yieldRate}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-700 ${
                                    numYield >= 70 ? 'bg-emerald-500' : numYield >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(100, Math.max(0, numYield))}%` }}
                                />
                              </div>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Building2 size={36} className="text-gray-200" />
                          <p className="text-sm font-bold text-gray-400">No clinics matching criteria</p>
                          <p className="text-xs text-gray-300">Try changing date range or search keyword</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            {filteredClinics.length > 0 && (
              <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-medium">
                <span>Showing <strong className="text-gray-700">{filteredClinics.length}</strong> clinic performance records</span>
                <span>Total Aggregated Gross: <strong className="text-gray-900 font-bold">€{totals.totalRevenue.toLocaleString()}</strong></span>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

export default ClinicAnalyticsPage;
