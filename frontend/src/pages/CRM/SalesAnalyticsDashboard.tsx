import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import { Search, Filter, Download, Activity, Target, TrendingUp, CheckCircle, Clock, Zap, AlertTriangle, Building, PieChart as PieChartIcon, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import { Button } from '@/components/atoms/Button/Button';
import { Badge } from '@/components/atoms/Badge/Badge';
import { crmAPI } from '@/services/api';
import { RootState } from '@/store';
import { fetchSalespersons } from '@/store/slices/crmSlice';
import { searchClinics } from '@/store/slices/clinicsSlice';

export const SalesAnalyticsDashboard = () => {
    const dispatch = useDispatch<any>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { salespersons } = useSelector((state: RootState) => state.crm);
    const { clinics } = useSelector((state: RootState) => state.clinics);

    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    // Filters
    const [dateRange, setDateRange] = useState({
        startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    });
    const [selectedSalesPerson, setSelectedSalesPerson] = useState<string>('');
    const [selectedClinic, setSelectedClinic] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        dispatch(fetchSalespersons());
        dispatch(searchClinics({}));
    }, [dispatch]);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const params: any = {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            };
            if (selectedSalesPerson) {
                params.salespersonId = selectedSalesPerson;
            } else if (user?.role === 'salesperson') {
                params.salespersonId = user.id;
            }

            if (selectedClinic) {
                params.clinicId = selectedClinic;
            }

            const res = await crmAPI.getPerformanceDashboard(params);
            setData(res.data);
        } catch (error) {
            console.error('Failed to fetch performance dashboard data', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [dateRange, selectedSalesPerson, selectedClinic]);

    // Derived states
    const filteredReport = useMemo(() => {
        if (!data?.reportTable) return [];
        let filtered = data.reportTable;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter((r: any) =>
                r.clientName.toLowerCase().includes(q) ||
                r.salesPersonName.toLowerCase().includes(q) ||
                r.taskPerformed.toLowerCase().includes(q)
            );
        }
        if (statusFilter) {
            filtered = filtered.filter((r: any) => r.bookingStatus === statusFilter || r.taskResult === statusFilter);
        }

        return filtered;
    }, [data, searchQuery, statusFilter]);

    const paginatedReport = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredReport.slice(start, start + itemsPerPage);
    }, [filteredReport, currentPage]);

    const handleExport = () => {
        // Simplified raw CSV export
        if (!filteredReport.length) return;

        const headers = ["Sales Person", "Client", "Date", "Event Type", "Task Performed", "Result/Status", "Revenue", "Execution", "Rebook Request"];
        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + filteredReport.map((r: any) =>
                `"${r.salesPersonName}","${r.clientName}","${format(new Date(r.date), 'MMM do, yyyy HH:mm')}","${r.eventType}","${r.taskPerformed}","${r.bookingStatus !== 'N/A' ? r.bookingStatus : r.taskResult}","${r.revenue}","${r.executionStatus}","${r.rebookingRequest}"`
            ).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `sales_report_${format(new Date(), 'yyyyMMdd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a288e3', '#ff6b6b'];

    const targetRevenue = data?.monthlyTarget || 125000;
    const currentRevenue = data?.salesConversionAnalytics?.totalRevenue || 0;
    const conversionPercentage = (currentRevenue / targetRevenue) * 100;
    const amountRemaining = Math.max(0, targetRevenue - currentRevenue);

    return (
        <div className="p-6 space-y-6 animate-in fade-in bg-gray-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Sales Analytics & Performance</h1>
                    <p className="text-sm text-gray-500 font-medium">Analyze bookings, tasks, and team conversions.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="p-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700"
                    />
                    <span className="text-gray-400 font-black">TO</span>
                    <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="p-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700"
                    />

                    {user?.role !== 'salesperson' && (
                        <select
                            value={selectedSalesPerson}
                            onChange={(e) => setSelectedSalesPerson(e.target.value)}
                            className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 min-w-[150px] shadow-sm"
                        >
                            <option value="">All Agents</option>
                            {salespersons.map(sp => (
                                <option key={sp.id} value={sp.id}>{sp.firstName} {sp.lastName}</option>
                            ))}
                        </select>
                    )}

                    <select
                        value={selectedClinic}
                        onChange={(e) => setSelectedClinic(e.target.value)}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 min-w-[150px] shadow-sm"
                    >
                        <option value="">All Clinics</option>
                        {clinics.map(clinic => (
                            <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                        ))}
                    </select>

                    <Button onClick={fetchDashboardData} className="bg-blue-600 hover:bg-blue-700 text-white shadow">
                        <Filter className="w-4 h-4 mr-2" /> Apply
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-black uppercase tracking-widest text-blue-600">Gathering Intelligence...</span>
                </div>
            ) : data && (
                <div className="space-y-12">
                    {/* LAYER 1 — Revenue Control (Performance KPI Bar) */}
                    <div className="space-y-4 shadow-sm pb-2">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-slate-800" />
                            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">01. Revenue Control</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {/* 1. Monthly Target */}
                            <Card className="border-none shadow-sm bg-[#0f172a] text-white overflow-hidden relative rounded-xl h-36">
                                <div className="absolute right-0 top-0 opacity-10 scale-150 rotate-12 -mt-10">
                                    <Target className="w-32 h-32" />
                                </div>
                                <CardContent className="p-5 flex flex-col justify-between h-full">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Monthly Target</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-bold opacity-60">€</span>
                                            <h3 className="text-3xl font-black tracking-tighter">{(data.monthlyTarget || 125000).toLocaleString()}</h3>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded">Quota Active</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 2. Revenue Month-to-Date */}
                            <Card className="border-none shadow-sm bg-white overflow-hidden border border-slate-100 rounded-xl h-36">
                                <CardContent className="p-5 flex flex-col justify-between h-full">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Revenue MTD</p>
                                        <div className="flex items-baseline gap-1 flex-wrap">
                                            <span className="text-xl font-bold text-slate-400">€</span>
                                            <h3 className="text-3xl font-black tracking-tighter text-slate-900">
                                                {data.salesConversionAnalytics?.totalRevenue?.toLocaleString() || '0'}
                                            </h3>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="bg-emerald-500 text-white border-none font-black text-[8px] uppercase tracking-widest px-2.5 py-1 rounded">
                                            Live Collections
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 3. Target % */}
                            <Card className="border-none shadow-sm bg-white overflow-hidden border border-slate-100 rounded-xl h-36">
                                <CardContent className="p-5 flex flex-col justify-between h-full">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Target Achievement</p>
                                            <Activity className="w-3 h-3 text-blue-500" />
                                        </div>
                                        <h3 className="text-3xl font-black tracking-tighter text-blue-600">
                                            {conversionPercentage.toFixed(1)}%
                                        </h3>
                                    </div>
                                    <div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                                                style={{ width: `${Math.min(100, conversionPercentage)}%` }}
                                            />
                                        </div>
                                        <p className="text-[8px] text-slate-400 font-bold mt-1.5 uppercase tracking-widest">
                                            €{amountRemaining.toLocaleString()} to Goal
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 4. Conversion % */}
                            <Card className="border-none shadow-sm bg-[#3b82f6] text-white overflow-hidden relative rounded-xl h-36">
                                <CardContent className="p-5 flex flex-col justify-between h-full">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-200 mb-1">Conversion Ratio</p>
                                        <h3 className="text-3xl font-black tracking-tighter">
                                            {data.salesConversionAnalytics?.leads > 0
                                                ? ((data.salesConversionAnalytics.confirmedBookings / data.salesConversionAnalytics.leads) * 100).toFixed(0)
                                                : '0'}%
                                        </h3>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-black mt-2">
                                        <div className="flex flex-col text-left">
                                            <span className="text-blue-200 text-[7px] uppercase tracking-widest">Bookings</span>
                                            <span className="text-base leading-none">{data.salesConversionAnalytics?.confirmedBookings || 0}</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-blue-200 text-[7px] uppercase tracking-widest">Leads</span>
                                            <span className="text-base leading-none">{data.salesConversionAnalytics?.leads || 0}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* LAYER 2 — Sales Intelligence (Proactive Action Center) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-slate-800" />
                            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">02. Sales Intelligence</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* 1. Hot Leads */}
                            <Card className="border-none shadow-sm bg-white hover:bg-slate-50 cursor-pointer transition-all border border-slate-200 rounded-2xl group">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Hot Leads</p>
                                        <h3 className="text-lg font-black text-slate-900 leading-none mt-1">{data.actionCenter?.hotLeads || 0}</h3>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 2. Follow-up Today */}
                            <Card className="border-none shadow-sm bg-white hover:bg-slate-50 cursor-pointer transition-all border border-slate-200 rounded-2xl group">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-blue-600">Follow-up Today</p>
                                        <h3 className="text-lg font-black text-slate-900 leading-none mt-1">{data.actionCenter?.followupsDueToday || 0}</h3>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 3. No Contact 7 Days */}
                            <Card className="border-none shadow-sm bg-white hover:bg-slate-50 cursor-pointer transition-all border border-slate-200 rounded-2xl group">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">No Contact 7 Days</p>
                                        <h3 className="text-lg font-black text-slate-900 leading-none mt-1">{data.actionCenter?.noContact7Days || 0}</h3>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 4. Overdue Tasks */}
                            <Card className="border-none shadow-sm bg-white hover:bg-slate-50 cursor-pointer transition-all border border-slate-200 rounded-2xl group">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-red-600">Overdue Tasks</p>
                                        <h3 className="text-lg font-black text-slate-900 leading-none mt-1">{data.actionCenter?.overdueTasks || 0}</h3>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* LAYER 3 — Pipeline & Distribution (Final strategic view) */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-slate-800" />
                            <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">03. Pipeline & Distribution</h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* 1. Leads by Status */}
                            <Card className="border-none shadow-sm bg-white overflow-hidden rounded-xl">
                                <CardHeader className="pt-6 px-6 pb-2">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Leads by Status Pipeline</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 h-72">
                                    {data.pipeline?.leadsByStatus?.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data.pipeline.leadsByStatus.map((v: any) => ({ ...v, count: Number(v.count) }))}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                                <XAxis dataKey="status" tick={{ fontSize: 9, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                                                <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                <Bar dataKey="count" name="Leads" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                            <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
                                            <span className="text-[10px] uppercase font-black tracking-widest">No Pipeline Data</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* 2. Source Breakdown */}
                            <Card className="border-none shadow-sm bg-white overflow-hidden rounded-xl">
                                <CardHeader className="pt-6 px-6 pb-2">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Meta Form Source Intelligence</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 h-72">
                                    {data.pipeline?.sourceBreakdown?.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={data.pipeline.sourceBreakdown.map((v: any) => ({ ...v, count: Number(v.count) }))}
                                                    cx="50%" cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={90}
                                                    paddingAngle={2}
                                                    dataKey="count"
                                                    nameKey="source"
                                                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    labelLine={false}
                                                >
                                                    {data.pipeline.sourceBreakdown.map((_entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                            <PieChartIcon className="w-8 h-8 mb-2 opacity-50" />
                                            <span className="text-[10px] uppercase font-black tracking-widest">No Source Data</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* 3. Clinic Distribution (Revenue) */}
                            <Card className="border-none shadow-sm bg-white overflow-hidden rounded-xl">
                                <CardHeader className="pt-6 px-6 pb-2">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Clinic Attribution (Revenue)</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 h-72">
                                    {data.clinicPerformance?.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data.clinicPerformance.map((v: any) => ({ ...v, revenue: Number(v.revenue) }))} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#f8fafc" />
                                                <XAxis type="number" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                                                <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fontWeight: 'bold' }} width={80} axisLine={false} tickLine={false} />
                                                <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(val: any) => `€${val.toLocaleString()}`} />
                                                <Bar dataKey="revenue" name="MTD Revenue" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={30} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                            <Building className="w-8 h-8 mb-2 opacity-50" />
                                            <span className="text-[10px] uppercase font-black tracking-widest">No Clinic Data</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* 4. Personal Pipeline (Agent Contribution) */}
                            <Card className="border-none shadow-sm bg-white overflow-hidden rounded-xl">
                                <CardHeader className="pt-6 px-6 pb-2">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Personal Pipeline (Agent Performance)</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 h-72">
                                    {data.performanceReport?.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data.performanceReport.map((v: any) => ({ ...v, totalRevenue: Number(v.totalRevenue) }))}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                                <XAxis dataKey="salesPersonName" tick={{ fontSize: 9, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                                                <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                <Bar dataKey="totalRevenue" name="Revenue Contributed" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={60} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                            <User className="w-8 h-8 mb-2 opacity-50" />
                                            <span className="text-[10px] uppercase font-black tracking-widest">No Agent Data</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* 3C. Live Activity Log */}
                        <Card className="border-none shadow-2xl bg-white border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4 bg-slate-50/30">
                                <div>
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-blue-600" />
                                        Performance Execution Log
                                    </h3>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time Daily Record</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="relative">
                                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            placeholder="Quick Search..."
                                            className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold w-64 shadow-sm"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <Button onClick={handleExport} variant="outline" className="border-slate-200 hover:bg-white text-slate-700 font-bold bg-white text-[9px] rounded-lg h-8 shadow-sm">
                                        <Download className="w-3 h-3 mr-2" /> Export
                                    </Button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-50/80 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100">
                                        <tr>
                                            <th className="p-4">Customer Details</th>
                                            <th className="p-4">Agent</th>
                                            <th className="p-4">Type / Action</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Revenue</th>
                                            <th className="p-4">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 bg-white">
                                        {paginatedReport.map((row: any) => (
                                            <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4">
                                                    <p className="font-black text-slate-900 text-xs">{row.clientName}</p>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                                                        {row.salesPersonName}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider font-mono">{row.eventType}</span>
                                                        <span className="text-xs font-bold text-slate-700">{row.taskPerformed}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${['completed', 'confirmed', 'arrived'].includes(row.bookingStatus?.toLowerCase()) ? 'bg-emerald-100 text-emerald-700' :
                                                        ['cancelled', 'no_show', 'missed'].includes(row.bookingStatus?.toLowerCase()) ? 'bg-red-100 text-red-700' :
                                                            'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {row.bookingStatus !== 'N/A' ? row.bookingStatus : row.taskResult}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`text-xs font-black ${row.revenue > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                                                        {row.revenue > 0 ? `€${row.revenue.toLocaleString()}` : '—'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700">{format(new Date(row.date), 'MMM do')}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium">{format(new Date(row.date), 'HH:mm')}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/20">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Log entries: {filteredReport.length} records found
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline" size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="text-[10px] h-8 bg-white font-bold px-4"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline" size="sm"
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        disabled={currentPage * itemsPerPage >= filteredReport.length}
                                        className="text-[10px] h-8 bg-white font-bold px-4"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesAnalyticsDashboard;
