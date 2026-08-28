import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  Lightbulb,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  User,
  ShieldCheck,
  Euro,
  Percent,
  Sparkles,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';

import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
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

import { fetchSalespersonAnalytics, fetchSalespersons } from '@/store/slices/crmSlice';
import type { RootState, AppDispatch } from '@/store';
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from 'date-fns';

const formatPercent = (val?: number) => (val !== undefined && val !== null ? `${(val * 100).toFixed(1)}%` : '0.0%');

interface AnalyticsProps {
  initialSalespersonId?: string;
}

export const Analytics: React.FC<AnalyticsProps> = ({ initialSalespersonId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { analytics, isLoading, salespersons, lastUpdated } = useSelector((state: RootState) => state.crm);
  const { user } = useSelector((state: RootState) => state.auth);
  const [salespersonId, setSalespersonId] = useState<string>(initialSalespersonId || 'all');
  const [activePreset, setActivePreset] = useState<'30d' | 'thisMonth' | 'lastMonth' | 'ytd' | 'custom'>('30d');
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const canSeeFinancials = ['admin', 'SUPER_ADMIN', 'doctor', 'ADMIN', 'DOCTOR', 'manager'].includes(user?.role);

  const handlePreset = (preset: '30d' | 'thisMonth' | 'lastMonth' | 'ytd') => {
    setActivePreset(preset);
    const now = new Date();
    if (preset === '30d') {
      setDateRange({
        startDate: format(subDays(now, 30), 'yyyy-MM-dd'),
        endDate: format(now, 'yyyy-MM-dd'),
      });
    } else if (preset === 'thisMonth') {
      setDateRange({
        startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
      });
    } else if (preset === 'lastMonth') {
      const prev = subDays(startOfMonth(now), 1);
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

  const turnoverChartData = useMemo(() => {
    if (!analytics?.turnoverTimeSeries) return [];
    let cumulative = 0;
    return analytics.turnoverTimeSeries.map((d: any) => {
      cumulative += d.amount || 0;
      return {
        ...d,
        cumulative,
        displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
    });
  }, [analytics?.turnoverTimeSeries]);

  const appointmentDonutData = useMemo(() => {
    if (!analytics?.appointmentStats) return [];
    const stats = analytics.appointmentStats;
    const bookedPending = Math.max(0, (stats.total || 0) - (stats.completed || 0) - (stats.cancelled || 0) - (stats.noShow || 0));
    return [
      { name: 'Completed', value: stats.completed || 0, color: '#10b981' },
      { name: 'Booked / Pending', value: bookedPending, color: '#3b82f6' },
      { name: 'Cancelled', value: stats.cancelled || 0, color: '#ef4444' },
      { name: 'No-Show', value: stats.noShow || 0, color: '#f59e0b' },
    ].filter(d => d.value > 0);
  }, [analytics?.appointmentStats]);

  const appointmentReturnData = useMemo(() => {
    if (!analytics?.appointmentStats) return [];
    const stats = analytics.appointmentStats;
    const isNew = Math.max(0, (stats.total || 0) - (stats.returned || 0));
    return [
      { name: 'New Clients', value: isNew, color: '#8b5cf6' },
      { name: 'Repeat Patients', value: stats.returned || 0, color: '#06b6d4' },
    ].filter(d => d.value > 0);
  }, [analytics?.appointmentStats]);

  useEffect(() => {
    if (user?.role === 'salesperson' && user?.id) {
      setSalespersonId(user.id);
    }
  }, [user]);

  useEffect(() => {
    dispatch(fetchSalespersons());
  }, [dispatch]);

  const loadSalespersonData = () => {
    if (salespersonId) {
      dispatch(fetchSalespersonAnalytics({
        salespersonId,
        dateRange,
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

  const activeSalespersonObj = salespersons?.find((s: any) => s.id === salespersonId);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">

      {/* ── Header Section ─────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Left Title & Status */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0B1120] flex items-center justify-center shadow-xl shadow-black/10 flex-shrink-0 ring-1 ring-white/10">
            <BarChart3 className="text-[#CBFF38]" size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">CRM &amp; Sales Analytics</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold ring-1 ring-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Feed
              </span>
            </div>
            <p className="text-sm text-gray-400 font-medium mt-0.5">
              Sales pipeline, conversion throughput &amp; agent velocity metrics
            </p>
          </div>
        </div>

        {/* Right Sync & Timestamps */}
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last Synced</p>
              <p className="text-xs font-mono font-semibold text-gray-700">
                {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </p>
            </div>
          )}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-10 px-4 inline-flex items-center justify-center gap-2 bg-[#0B1120] text-white hover:bg-black font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Sync Data</span>
          </button>
        </div>

      </div>

      {/* ── Filter Toolbar ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm ring-1 ring-gray-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Salesperson Selector */}
        {user?.role !== 'salesperson' ? (
          <div className="flex-1 min-w-[240px]">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5 block">
              Filter by Agent
            </label>
            <div className="relative">
              <select
                value={salespersonId}
                onChange={(e) => setSalespersonId(e.target.value)}
                className="w-full appearance-none bg-gray-50 pl-4 pr-10 py-2.5 rounded-xl text-xs font-bold text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#CBFF38] focus:border-transparent transition-all cursor-pointer"
              >
                <option value="all">All Salespeople &amp; Agents (Combined)</option>
                {(salespersons || [])
                  .filter((s: any) => ['salesperson', 'SUPER_ADMIN', 'manager', 'admin'].includes(s.role))
                  .map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.role.replace('_', ' ')})
                    </option>
                  ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <User size={14} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 bg-blue-50/70 px-4 py-3 rounded-xl border border-blue-100 text-blue-900">
            <User size={16} className="text-blue-600" />
            <span className="text-xs font-bold">
              Active Agent View: {user?.firstName} {user?.lastName}
            </span>
          </div>
        )}

        {/* Date Presets & Inputs */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Presets */}
          <div className="inline-flex bg-gray-100 p-1 rounded-xl ring-1 ring-gray-200/50">
            <button
              onClick={() => handlePreset('30d')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activePreset === '30d' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Last 30D
            </button>
            <button
              onClick={() => handlePreset('thisMonth')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activePreset === 'thisMonth' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => handlePreset('lastMonth')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activePreset === 'lastMonth' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => handlePreset('ytd')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activePreset === 'ytd' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              YTD
            </button>
          </div>

          {/* Date Picker Inputs */}
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 shadow-xs">
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

        </div>

      </div>

      {/* ── Turnover & Financial Target KPIs ────────────────────── */}
      {canSeeFinancials && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Euro size={14} className="text-emerald-600" />
              Revenue &amp; Period Target Pacing
            </h2>
            {activeSalespersonObj && (
              <span className="text-[11px] font-bold text-gray-400">
                Target configured: {activeSalespersonObj.monthlyTarget ? `€${activeSalespersonObj.monthlyTarget.toLocaleString()}/mo` : 'No Target Set'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Turnover Gross (Luxury Dark Hero Card) */}
            <div className="relative bg-[#0B1120] text-white rounded-2xl p-5 shadow-xl shadow-black/10 overflow-hidden ring-1 ring-white/10 flex flex-col justify-between group hover:shadow-2xl transition-all">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#CBFF38]/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />
              <div className="absolute right-2 bottom-1 opacity-5 text-white pointer-events-none">
                <Euro size={70} />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Gross Turnover
                  </span>
                  <div className="p-1.5 rounded-lg bg-white/10 text-[#CBFF38]">
                    <TrendingUp size={14} />
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1.5">
                  €{(analytics?.turnoverStats?.achieved || 0).toLocaleString()}
                </h3>
              </div>

              <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Achieved in selected period</span>
                <span className="text-[#CBFF38] font-bold text-[10px] uppercase tracking-wider">
                  Verified
                </span>
              </div>
            </div>

            {/* 2. Period Target */}
            <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                    Period Target
                  </span>
                  <div className="p-1.5 rounded-lg bg-slate-50 text-gray-600">
                    <Target size={14} />
                  </div>
                </div>
                <div className="mt-1.5">
                  {analytics?.turnoverStats?.targetIsSet ? (
                    <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
                      €{analytics.turnoverStats.monthlyTarget.toLocaleString()}
                    </h3>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-600 mt-1">
                      <AlertCircle size={18} />
                      <span className="text-lg font-bold">Not Configured</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-2 border-t border-gray-50 flex items-center justify-between text-xs">
                <span className="text-gray-400 text-[11px]">
                  {analytics?.turnoverStats?.targetIsSet ? 'Sales Goal for timeframe' : 'Set target in User Management'}
                </span>
              </div>
            </div>

            {/* 3. Target Progress Rate */}
            <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                    Target Progress
                  </span>
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                    <Percent size={14} />
                  </div>
                </div>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-blue-600">
                    {analytics?.turnoverStats?.targetIsSet ? formatPercent(analytics?.turnoverStats?.progress) : '—'}
                  </h3>
                  {analytics?.turnoverStats?.targetIsSet && (
                    <span className="text-xs text-gray-400 font-semibold">of Goal</span>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-2 border-t border-gray-50 space-y-1.5">
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.max(0, (analytics?.turnoverStats?.progress || 0) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 4. Pacing vs Target */}
            <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                    Pacing vs Timeline
                  </span>
                  <div className={`p-1.5 rounded-lg ${
                    analytics?.turnoverStats?.pacingStatus === 'Ahead' ? 'bg-emerald-50 text-emerald-600' :
                    analytics?.turnoverStats?.pacingStatus === 'Behind' ? 'bg-red-50 text-red-600' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    <Clock size={14} />
                  </div>
                </div>
                <div className="mt-1.5">
                  {analytics?.turnoverStats?.targetIsSet ? (
                    <div className="flex items-center gap-2">
                      <span className={`text-xl sm:text-2xl font-black tracking-tight ${
                        analytics.turnoverStats.pacingStatus === 'Ahead' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {analytics.turnoverStats.pacingStatus}
                      </span>
                      <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                        analytics.turnoverStats.pacingStatus === 'Ahead' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {(analytics.turnoverStats.pacingDelta || 0) > 0 ? '+' : ''}{formatPercent(analytics.turnoverStats.pacingDelta)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xl font-bold text-gray-400">—</span>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-2 border-t border-gray-50 text-[11px] text-gray-400 font-medium">
                {analytics?.turnoverStats?.targetIsSet
                  ? `Expected today: ${formatPercent(analytics?.turnoverStats?.expectedProgress)}`
                  : 'Requires target value'}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Appointments Funnel Section ─────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
          <Calendar size={14} className="text-blue-600" />
          Appointments Throughput &amp; Funnel
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          
          {/* 1. Booked */}
          <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Total Booked</span>
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Calendar size={14} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-gray-900">{analytics?.appointmentStats?.total || 0}</p>
            <p className="text-[10px] text-gray-400 mt-1 font-medium">Created in period</p>
          </div>

          {/* 2. Completed */}
          <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">Completed</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={14} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600">{analytics?.appointmentStats?.completed || 0}</p>
            <p className="text-[10px] text-emerald-700 mt-1 font-semibold">Done appointments</p>
          </div>

          {/* 3. Cancelled */}
          <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-500">Cancelled</span>
              <div className="p-1.5 rounded-lg bg-red-50 text-red-500">
                <XCircle size={14} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-red-600">{analytics?.appointmentStats?.cancelled || 0}</p>
            <p className="text-[10px] text-red-500 mt-1 font-medium">Cancelled in period</p>
          </div>

          {/* 4. No-Show */}
          <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500">No-Show</span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-500">
                <AlertCircle size={14} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-600">{analytics?.appointmentStats?.noShow || 0}</p>
            <p className="text-[10px] text-amber-600 mt-1 font-medium">Missed attendance</p>
          </div>

          {/* 5. Repeat Patients */}
          <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100 hover:shadow-md transition-all col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-600">Repeat Patients</span>
              <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
                <RefreshCw size={14} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-cyan-600">{analytics?.appointmentStats?.returned || 0}</p>
            <p className="text-[10px] text-cyan-700 mt-1 font-semibold">Returning clients</p>
          </div>

        </div>
      </div>

      {/* ── AI Quick Insights & Actionable Guidance ─────────────────── */}
      <QuickInsights analytics={analytics} />

      {/* ── Activity & Lead Conversion Matrix ────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
          <Activity size={14} className="text-violet-600" />
          Lead Velocity &amp; Action Performance
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Total Leads</span>
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><Users size={14} /></div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-gray-900">{analytics?.totalLeads || 0}</p>
            <p className="text-[10px] text-gray-400 mt-1">Accumulated in database</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">Converted Leads</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600"><UserCheck size={14} /></div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600">{analytics?.convertedLeads || 0}</p>
            <p className="text-[10px] text-emerald-700 mt-1 font-medium">Successful bookings</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">Conversion Rate</span>
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600"><TrendingUp size={14} /></div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-indigo-600">{formatPercent(analytics?.conversionRate)}</p>
            <p className="text-[10px] text-gray-400 mt-1">Lead-to-client throughput</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600">Completed Actions</span>
              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600"><Activity size={14} /></div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-purple-600">{analytics?.completedActions || 0}</p>
            <p className="text-[10px] text-gray-400 mt-1">out of {analytics?.totalActions || 0} total tasks</p>
          </div>

        </div>
      </div>

      {/* ── Detailed Analytics Charts & Panels (2 Columns) ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (2 Cols wide): Leaderboard or Time Series + Call Telemetry */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm ring-1 ring-gray-100 flex flex-col justify-between space-y-6">
          
          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-900 text-[#CBFF38]">
                <BarChart3 size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {salespersonId === 'all' ? 'Agent Performance Leaderboard' : 'Daily Activity & Revenue Timeline'}
                </h3>
                <p className="text-xs text-gray-400">
                  {salespersonId === 'all' ? 'Comparing sales velocity across all active agents' : 'Daily tracked financial throughput'}
                </p>
              </div>
            </div>
          </div>

          {/* Chart View */}
          <div className="h-64 w-full">
            {salespersonId !== 'all' ? (
              turnoverChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={turnoverChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                    {canSeeFinancials ? (
                      <>
                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `€${v}`} />
                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `€${v}`} />
                        <Bar yAxisId="left" dataKey="amount" name="Daily Revenue" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={28} />
                        <Line yAxisId="right" type="monotone" dataKey="cumulative" name="Cumulative" stroke="#0B1120" strokeWidth={2.5} dot={{ r: 3, fill: '#CBFF38' }} />
                      </>
                    ) : (
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    )}
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0B1120', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                      formatter={(value: any, name: string) => [
                        name.includes('Revenue') || name.includes('Cumulative') ? `€${Number(value).toLocaleString()}` : value,
                        name,
                      ]}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                  <Activity size={32} />
                  <p className="text-xs font-semibold text-gray-400">No activity logged for this agent in selected dates</p>
                </div>
              )
            ) : (
              (analytics?.agentLeaderboard?.length || 0) > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.agentLeaderboard} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => canSeeFinancials ? `€${val}` : val} />
                    <YAxis dataKey="agent" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#0f172a', fontWeight: 'bold' }} width={90} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0B1120', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                      formatter={(value: any) => [canSeeFinancials ? `€${Number(value).toLocaleString()}` : value, 'Gross Volume']}
                    />
                    <Bar dataKey="amount" fill="#0B1120" radius={[0, 6, 6, 0]} maxBarSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                  <Users size={32} />
                  <p className="text-xs font-semibold text-gray-400">No agent performance entries found</p>
                </div>
              )
            )}
          </div>

          {/* Telemetry Chips (Calls & Duration) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-100">
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100/80">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Assigned Leads</span>
              <span className="text-lg font-black text-gray-900 mt-0.5 block">{analytics?.leadsAssigned || 0}</span>
            </div>
            <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100/60">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Answered Calls</span>
              <span className="text-lg font-black text-emerald-800 mt-0.5 block">{analytics?.communicationStats?.answeredCalls || 0}</span>
            </div>
            <div className="bg-red-50/60 p-3 rounded-2xl border border-red-100/60">
              <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">Missed Calls</span>
              <span className="text-lg font-black text-red-800 mt-0.5 block">{analytics?.communicationStats?.missedCalls || 0}</span>
            </div>
            <div className="bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100/60">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Total Talk Time</span>
              <span className="text-lg font-black text-indigo-900 mt-0.5 block">
                {analytics?.communicationStats?.totalDurationSeconds ? Math.floor(analytics.communicationStats.totalDurationSeconds / 60) : 0} mins
              </span>
            </div>
          </div>

        </div>

        {/* Right Column (1 Col wide): Customer Base & Appointment Integrity Donut */}
        <div className="bg-white rounded-3xl p-6 shadow-sm ring-1 ring-gray-100 flex flex-col justify-between space-y-6">
          
          <div>
            <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4">
              <h3 className="text-sm font-bold text-gray-900">Appointments Overview</h3>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                Distribution
              </span>
            </div>

            {/* Donut Chart */}
            <div className="h-44 w-full relative flex items-center justify-center">
              {appointmentDonutData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={appointmentDonutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={68}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {appointmentDonutData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0B1120', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black text-gray-900">{analytics?.appointmentStats?.total || 0}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Total</span>
                  </div>
                </>
              ) : (
                <div className="text-xs text-gray-400">No appointments recorded</div>
              )}
            </div>
          </div>

          {/* Customer Base & Lifetime Value Box */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Patient Database</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-2xl">
                <span className="text-[10px] text-gray-400 font-bold block">Total Patients</span>
                <span className="text-lg font-black text-gray-900">{analytics?.customerStats?.totalCustomers || 0}</span>
              </div>
              <div className="bg-blue-50 p-3 rounded-2xl">
                <span className="text-[10px] text-blue-600 font-bold block">Repeat Ratio</span>
                <span className="text-lg font-black text-blue-700">{analytics?.customerStats?.repeatCustomers || 0}</span>
              </div>
            </div>

            {canSeeFinancials && (
              <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Customer Lifetime Value</span>
                  <span className="text-xl font-black text-emerald-900 mt-0.5 block">
                    €{(analytics?.customerStats?.totalRevenue || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Euro size={16} />
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

// ── AI Quick Insights Component ─────────────────────────────
const QuickInsights = ({ analytics }: { analytics: any }) => {
  if (!analytics) return null;

  const insights = [];
  const stats = analytics.appointmentStats || {};
  const turnover = analytics.turnoverStats || {};

  // 1. No-show Insight
  const noShowRate = ((Number(stats.noShow) || 0) / (Number(stats.total) || 1)) * 100;
  if (noShowRate > 10) {
    insights.push({
      type: 'warning',
      text: `No-show rate is ${noShowRate.toFixed(1)}%. Add confirmation WhatsApp/call reminder 24h prior.`,
      icon: <AlertCircle className="w-4 h-4 text-amber-600" />
    });
  }

  // 2. Conversion Insight
  const conversionRate = ((Number(stats.completed) || 0) / (Number(stats.total) || 1)) * 100;
  if (conversionRate < 70 && stats.total > 0) {
    insights.push({
      type: 'info',
      text: `Booked-to-done conversion rate is ${conversionRate.toFixed(1)}%. Review cancellation reasons.`,
      icon: <Activity className="w-4 h-4 text-blue-600" />
    });
  }

  // 3. Pacing Insight
  if (turnover.targetIsSet) {
    const isBehind = turnover.pacingStatus === 'Behind';
    const progressPercent = (Number(turnover.progress) || 0) * 100;
    const expectedPercent = (Number(turnover.expectedProgress) || 0) * 100;
    insights.push({
      type: isBehind ? 'warning' : 'success',
      text: `Currently at ${progressPercent.toFixed(1)}% of target (expected by today: ${expectedPercent.toFixed(1)}%).`,
      icon: isBehind ? <Zap className="w-4 h-4 text-red-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: 'success',
      text: 'Portfolio performing optimally with high attendance velocity and conversion rate.',
      icon: <Lightbulb className="w-4 h-4 text-emerald-600" />
    });
  }

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm ring-1 ring-gray-100 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-900 text-[#CBFF38]">
            <Sparkles size={13} />
          </div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-600">
            Intelligent Operational Insights
          </h3>
        </div>
        <span className="text-[10px] font-bold text-gray-400">Automated Audit</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 p-3 rounded-2xl border ${
              insight.type === 'warning' ? 'bg-amber-50/70 border-amber-200/80 text-amber-900' :
              insight.type === 'success' ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900' :
              'bg-blue-50/70 border-blue-200/80 text-blue-900'
            }`}
          >
            <div className="shrink-0 mt-0.5">{insight.icon}</div>
            <p className="text-xs font-semibold leading-relaxed">{insight.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
