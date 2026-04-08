import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
    CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
    Building2, Users, Calendar, CheckCircle, XCircle, AlertTriangle,
    TrendingUp, Filter, RefreshCw, Euro, Database, MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import { Button } from '@/components/atoms/Button/Button';
import { Select } from '@/components/atoms/Select/Select';
import { crmAPI } from '@/services/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#0ea5e9', '#a78bfa'];

export const ClinicAnalyticsPage = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [clinics, setClinics] = useState<any[]>([]);
    const [selectedClinicId, setSelectedClinicId] = useState<string>('');
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
        } finally {
            setIsLoading(false);
        }
    }, [dateRange, selectedClinicId]);

    const handleSeedData = async () => {
        if (!confirm("This will add mock leads, calls, and appointments for testing purposes. Continue?")) return;
        setIsLoading(true);
        try {
            await (adminAPI as any).axiosInstance.get('/crm/manager-crm/seed-mock-data');
            await fetchData();
            alert("Data seeded successfully! Refreshing dashboard...");
        } catch (e) {
            console.error('Failed to seed data', e);
            alert("Failed to seed data. Make sure the backend seeder is active.");
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

    const revenueChartData = useMemo(() =>
        [...data].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 8).map(c => ({
            name: (c.clinicName || 'Unknown')?.length > 12 ? (c.clinicName || 'Unknown').slice(0, 12) + '…' : (c.clinicName || 'Unknown'),
            revenue: parseFloat(c.totalRevenue?.toFixed(0) || '0'),
        })), [data]);

    const pieData = useMemo(() => [
        { name: 'Completed', value: totals.completed, color: '#10b981' },
        { name: 'Cancelled', value: totals.cancelled, color: '#ef4444' },
        { name: 'No-show', value: totals.noShow, color: '#f59e0b' },
        { name: 'Other', value: Math.max(0, totals.totalAppointments - totals.completed - totals.cancelled - totals.noShow), color: '#3b82f6' },
    ].filter(d => d.value > 0), [totals]);

    const clinicOptions = useMemo(() => [
        { value: '', label: 'All Clinics' },
        ...clinics.map(c => ({ value: c.id, label: c.name }))
    ], [clinics]);

    return (
        <div className="p-6 space-y-6 animate-in fade-in bg-[#fdfdfd] min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900 rounded-2xl shadow-lg shadow-slate-200">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Clinic Intelligence</h1>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Platform Distribution & Performance</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                    {/* Clinic Selector */}
                    <div className="px-2 border-r border-slate-100 min-w-[200px]">
                        <Select
                            placeholder="Select Clinic"
                            options={clinicOptions}
                            value={selectedClinicId}
                            onChange={(val) => setSelectedClinicId(val)}
                            className="border-none shadow-none h-9 text-xs font-black text-slate-700"
                        />
                    </div>

                    <div className="flex items-center gap-2 px-2 border-r border-slate-100">
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            className="bg-transparent border-none text-xs font-black text-slate-700 focus:ring-0 cursor-pointer"
                        />
                        <span className="text-[10px] font-black text-slate-300">TO</span>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            className="bg-transparent border-none text-xs font-black text-slate-700 focus:ring-0 cursor-pointer"
                        />
                    </div>

                    <Button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-9 px-4 text-xs font-black shadow-md shadow-blue-100">
                        <Filter className="w-3.5 h-3.5 mr-1.5" /> REFRESH
                    </Button>

                    {(user?.role === 'admin' || user?.role === 'SUPER_ADMIN' || user?.role === 'manager') && (
                        <Button onClick={handleSeedData} variant="outline" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-xl h-9 px-4 text-xs font-black">
                            <Database className="w-3.5 h-3.5 mr-1.5" /> SEED MOCK
                        </Button>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-32 gap-6">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div className="text-center">
                        <span className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Aggregating Data</span>
                        <p className="text-[10px] text-slate-300 mt-2 font-bold tracking-widest uppercase">Fetching real-time clinical results</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-12">

                    {/* KPI CARDS - Premium Style */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative rounded-2xl h-32">
                            <div className="absolute right-0 top-0 opacity-10 scale-150 rotate-12 -mt-6">
                                <Euro className="w-24 h-24" />
                            </div>
                            <CardContent className="p-6 flex flex-col justify-between h-full">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Estimated Revenue</p>
                                    <h3 className="text-3xl font-black tracking-tighter">€{totals.totalRevenue.toLocaleString()}</h3>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                    <span className="text-[8px] font-black tracking-widest uppercase text-slate-400">Live Collection Status</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white overflow-hidden border border-slate-100 rounded-2xl h-32">
                            <CardContent className="p-6 flex flex-col justify-between h-full">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Active Appointments</p>
                                    <h3 className="text-3xl font-black tracking-tighter text-slate-900">{totals.totalAppointments}</h3>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-[9px] font-black text-slate-500">{totals.completed} Done</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                        <span className="text-[9px] font-black text-slate-500">{totals.cancelled} Cancel</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white overflow-hidden border border-slate-100 rounded-2xl h-32">
                            <CardContent className="p-6 flex flex-col justify-between h-full">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Retention Health</p>
                                    <h3 className="text-3xl font-black tracking-tighter text-blue-600">
                                        {totals.totalAppointments > 0 ? ((totals.completed / totals.totalAppointments) * 100).toFixed(1) : 0}%
                                    </h3>
                                </div>
                                <div>
                                    <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${totals.totalAppointments > 0 ? (totals.completed / totals.totalAppointments) * 100 : 0}%` }} />
                                    </div>
                                    <p className="text-[8px] text-slate-400 font-bold mt-1.5 uppercase tracking-widest">Completion Efficiency</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white overflow-hidden border border-slate-100 rounded-2xl h-32">
                            <CardContent className="p-6 flex flex-col justify-between h-full">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Unique Patients</p>
                                        <h3 className="text-3xl font-black tracking-tighter text-slate-900">{totals.uniqueClients}</h3>
                                    </div>
                                    <Users className="w-5 h-5 text-slate-200" />
                                </div>
                                <span className="text-[8px] font-black bg-blue-50 text-blue-600 self-start px-2 py-1 rounded uppercase tracking-widest">Active Database</span>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Distribution Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Revenue Share */}
                        <Card className="border border-slate-100 shadow-xl shadow-slate-100/50 bg-white rounded-3xl overflow-hidden">
                            <CardHeader className="p-6 pb-2 border-b border-slate-50 bg-slate-50/30">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Top Revenue Centers</CardTitle>
                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 h-[340px]">
                                {revenueChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={revenueChartData} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                            <XAxis type="number" tick={{ fontSize: 9, fontWeight: 'bold' }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v.toLocaleString()}`} />
                                            <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fontWeight: '800' }} width={100} axisLine={false} tickLine={false} />
                                            <RechartsTooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: 11 }}
                                                formatter={(v: any) => [`€${Number(v).toLocaleString()}`, 'Revenue']}
                                            />
                                            <Bar dataKey="revenue" fill="#0f172a" radius={[0, 6, 6, 0]} maxBarSize={30} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-3 grayscale opacity-40">
                                        <Database className="w-12 h-12" />
                                        <span className="text-[10px] uppercase font-black tracking-[0.3em]">Dataset Latency</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Status Integrity */}
                        <Card className="border border-slate-100 shadow-xl shadow-slate-100/50 bg-white rounded-3xl overflow-hidden">
                            <CardHeader className="p-6 pb-2 border-b border-slate-50 bg-slate-50/30">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Appointment Status Integrity</CardTitle>
                                    <PieChart className="w-4 h-4 text-blue-500" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 h-[340px]">
                                {pieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%" cy="50%"
                                                innerRadius={80}
                                                outerRadius={110}
                                                paddingAngle={4}
                                                dataKey="value"
                                                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                labelLine={false}
                                                stroke="none"
                                            >
                                                {pieData.map((entry, i) => (
                                                    <Cell key={`cell-${i}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: 11 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-3 grayscale opacity-40">
                                        <Database className="w-12 h-12" />
                                        <span className="text-[10px] uppercase font-black tracking-[0.3em]">No Historical Context</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-800" />
                            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">03. Geographic Performance Matrix</h2>
                        </div>
                        <Card className="border border-slate-100 shadow-2xl shadow-slate-100/30 bg-white rounded-3xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left whitespace-nowrap">
                                    <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100">
                                        <tr>
                                            <th className="p-5">Clinic Location</th>
                                            <th className="p-5">Total Vol.</th>
                                            <th className="p-5">Completed</th>
                                            <th className="p-5">Attrition</th>
                                            <th className="p-5">Unique Clients</th>
                                            <th className="p-5">Revenue</th>
                                            <th className="p-5">Yield Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {[...data].sort((a, b) => b.totalRevenue - a.totalRevenue).map((clinic, idx) => {
                                            const yieldRate = clinic.totalAppointments > 0
                                                ? ((clinic.completed / clinic.totalAppointments) * 100).toFixed(0)
                                                : '0';
                                            return (
                                                <tr key={clinic.clinicId} className="hover:bg-slate-50/80 transition-all group">
                                                    <td className="p-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-lg shadow-slate-100 group-hover:scale-110 transition-transform"
                                                                style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                                                                {idx + 1}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-900 text-sm tracking-tight">{clinic.clinicName}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{clinic.phone || 'No Contact Record'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 font-black text-slate-600 font-mono text-xs">{clinic.totalAppointments}</td>
                                                    <td className="p-5">
                                                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg uppercase tracking-widest leading-none block w-fit border border-emerald-100/50">{clinic.completed}</span>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">{clinic.cancelled} Cancel</span>
                                                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{clinic.noShow} No-Show</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-sm font-black text-slate-900 tracking-tighter">{clinic.uniqueClients}</td>
                                                    <td className="p-5">
                                                        <p className="text-sm font-black text-slate-900 tracking-tighter">€{(clinic.totalRevenue || 0).toLocaleString()}</p>
                                                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Gross Collection</span>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex flex-col gap-1.5 min-w-[100px]">
                                                            <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                                <span>Efficiency</span>
                                                                <span>{yieldRate}%</span>
                                                            </div>
                                                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden shadow-inner">
                                                                <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${yieldRate}%` }} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {data.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="p-20 text-center">
                                                    <div className="flex flex-col items-center gap-4 opacity-20 grayscale">
                                                        <Database className="w-16 h-16" />
                                                        <p className="text-xs font-black uppercase tracking-[0.4em]">Zero Results Detected</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                </div>
            )}
        </div>
    );
};

export default ClinicAnalyticsPage;
