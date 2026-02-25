import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import { Search, Filter, Download, Activity, Target, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card';
import { Button } from '@/components/atoms/Button/Button';
import { crmAPI } from '@/services/api';
import { RootState } from '@/store';
import { fetchSalespersons } from '@/store/slices/crmSlice';

export const SalesAnalyticsDashboard = () => {
    const dispatch = useDispatch<any>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { salespersons } = useSelector((state: RootState) => state.crm);

    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'daily' | 'conversion' | 'tasks' | 'performance' | 'report'>('report');

    // Filters
    const [dateRange, setDateRange] = useState({
        startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    });
    const [selectedSalesPerson, setSelectedSalesPerson] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        dispatch(fetchSalespersons());
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
    }, [dateRange, selectedSalesPerson]);

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
                            className="p-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 min-w-[150px]"
                        >
                            <option value="">All Agents</option>
                            {salespersons.map(sp => (
                                <option key={sp.id} value={sp.id}>{sp.firstName} {sp.lastName}</option>
                            ))}
                        </select>
                    )}

                    <Button onClick={fetchDashboardData} className="bg-blue-600 hover:bg-blue-700 text-white shadow">
                        <Filter className="w-4 h-4 mr-2" /> Apply
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-black uppercase tracking-widest text-blue-600">Analyzing Data...</span>
                </div>
            ) : data && (
                <>
                    {/* Top Level KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="border-none shadow-sm shadow-blue-100/50 bg-white">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Target className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Leads/Hits</p>
                                    <h3 className="text-2xl font-black text-gray-800">{data.salesConversionAnalytics?.leads || 0}</h3>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm shadow-emerald-100/50 bg-white">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Confirmed Bookings</p>
                                    <h3 className="text-2xl font-black text-gray-800">{data.salesConversionAnalytics?.confirmedBookings || 0}</h3>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm shadow-purple-100/50 bg-white">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Generated Revenue</p>
                                    <h3 className="text-2xl font-black text-gray-800">€{data.salesConversionAnalytics?.revenue?.toFixed(2) || '0.00'}</h3>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm shadow-amber-100/50 bg-white">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Task Completion</p>
                                    <h3 className="text-2xl font-black text-gray-800">
                                        {data.salesConversionAnalytics?.assignedTasks > 0 ?
                                            ((data.salesConversionAnalytics.completedTasks / data.salesConversionAnalytics.assignedTasks) * 100).toFixed(1) : 0}%
                                    </h3>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 inline-flex">
                        {(['report', 'daily', 'conversion', 'tasks', 'performance'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                {tab.replace('-', ' ')}
                            </button>
                        ))}
                    </div>

                    {/* Tab 1: Tabular Report */}
                    {activeTab === 'report' && (
                        <Card className="border-none shadow-xl shadow-gray-200/50 overflow-hidden">
                            <CardContent className="p-0">
                                <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 bg-gray-50/50">
                                    <div className="flex gap-3 items-center w-full md:w-auto">
                                        <div className="relative flex-1 md:w-64">
                                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                placeholder="Search client, agent, event..."
                                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="p-2 bg-white border border-gray-200 rounded-lg text-sm min-w-[140px]"
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="completed">Completed</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="pending">Pending</option>
                                            <option value="cancelled">Cancelled</option>
                                            <option value="no_show">No Show</option>
                                        </select>
                                    </div>
                                    <Button onClick={handleExport} variant="outline" className="border-gray-200 hover:bg-white text-gray-700 font-bold bg-white text-xs">
                                        <Download className="w-4 h-4 mr-2" /> Export Excel/CSV
                                    </Button>
                                </div>

                                <div className="overflow-x-auto w-full">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-gray-50/80 text-[10px] uppercase font-black tracking-widest text-gray-400 border-b border-gray-100">
                                            <tr>
                                                <th className="p-4">Agent details</th>
                                                <th className="p-4">Date & Time</th>
                                                <th className="p-4">Type / Action</th>
                                                <th className="p-4">Status & Result</th>
                                                <th className="p-4">Revenue</th>
                                                <th className="p-4">Exec Status</th>
                                                <th className="p-4">Rebook</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 bg-white">
                                            {paginatedReport.map((row: any) => (
                                                <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                                                    <td className="p-4">
                                                        <p className="font-bold text-gray-900">{row.clientName}</p>
                                                        <p className="text-xs font-medium text-blue-600 mt-0.5">{row.salesPersonName}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="font-bold text-gray-800">{format(new Date(row.date), 'MMM do, yyyy')}</p>
                                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> {format(new Date(row.date), 'HH:mm')}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="inline-block px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider mb-1 mr-2">{row.eventType}</span>
                                                        <p className="text-sm font-medium text-gray-700">{row.taskPerformed}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        {row.bookingStatus !== 'N/A' ? (
                                                            <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${['completed', 'confirmed', 'arrived'].includes(row.bookingStatus) ? 'bg-emerald-100 text-emerald-700' :
                                                                ['cancelled', 'no_show', 'missed'].includes(row.bookingStatus) ? 'bg-red-100 text-red-700' :
                                                                    'bg-amber-100 text-amber-700'
                                                                }`}>{row.bookingStatus}</span>
                                                        ) : (
                                                            <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${row.taskResult === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                                                                }`}>{row.taskResult}</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 font-black text-gray-900">
                                                        {row.revenue > 0 ? `€${row.revenue.toFixed(2)}` : '-'}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold tracking-widest ${row.executionStatus === 'Executed' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'
                                                            }`}>{row.executionStatus}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`font-bold ${row.rebookingRequest === 'Yes' ? 'text-blue-600' : 'text-gray-400'}`}>
                                                            {row.rebookingRequest}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {paginatedReport.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="p-12 text-center text-gray-400 font-medium">No activity records found matching your filters.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Pagination Controls */}
                                <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        Showing {filteredReport.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredReport.length)} of {filteredReport.length}
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline" size="sm"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="text-xs h-8 bg-white"
                                        >
                                            Prev
                                        </Button>
                                        <Button
                                            variant="outline" size="sm"
                                            onClick={() => setCurrentPage(p => p + 1)}
                                            disabled={currentPage * itemsPerPage >= filteredReport.length}
                                            className="text-xs h-8 bg-white"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Tab 2: Daily Booking Progress */}
                    {activeTab === 'daily' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <Card><CardContent className="p-4 text-center">
                                    <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Today Appts</p>
                                    <p className="text-2xl font-black text-blue-600">{data.dailyStats?.total || 0}</p>
                                </CardContent></Card>
                                <Card><CardContent className="p-4 text-center">
                                    <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Confirmed</p>
                                    <p className="text-2xl font-black text-emerald-600">{data.dailyStats?.confirmed || 0}</p>
                                </CardContent></Card>
                                <Card><CardContent className="p-4 text-center">
                                    <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Cancelled</p>
                                    <p className="text-2xl font-black text-red-500">{data.dailyStats?.cancelled || 0}</p>
                                </CardContent></Card>
                                <Card><CardContent className="p-4 text-center">
                                    <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">No Show</p>
                                    <p className="text-2xl font-black text-amber-500">{data.dailyStats?.noShow || 0}</p>
                                </CardContent></Card>
                                <Card><CardContent className="p-4 text-center bg-emerald-50">
                                    <p className="text-xs font-bold text-emerald-600 tracking-widest uppercase mb-1">Revenue</p>
                                    <p className="text-2xl font-black text-emerald-700">€{data.dailyStats?.revenue?.toFixed(2) || '0.00'}</p>
                                </CardContent></Card>
                            </div>

                            <Card className="border-none shadow-xl shadow-gray-200/50">
                                <CardHeader>
                                    <CardTitle>Daily Bookings Trendline</CardTitle>
                                </CardHeader>
                                <CardContent className="h-96">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={data.dailyProgressChart}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(val) => format(new Date(val), 'MMM d')} />
                                            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={val => `€${val}`} />
                                            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                            <Legend />
                                            <Line yAxisId="left" type="monotone" dataKey="total" name="Total Appointments" stroke="#8884d8" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                            <Line yAxisId="left" type="monotone" dataKey="confirmed" name="Confirmed" stroke="#10b981" strokeWidth={3} />
                                            <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue (€)" stroke="#f59e0b" strokeWidth={3} strokeDasharray="5 5" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Tab 3: Sales Conversion */}
                    {activeTab === 'conversion' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-none shadow-xl shadow-gray-200/50">
                                <CardHeader>
                                    <CardTitle>Sales Conversion by Agent</CardTitle>
                                </CardHeader>
                                <CardContent className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.performanceReport} layout="vertical" margin={{ left: 40, right: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                            <XAxis type="number" />
                                            <YAxis dataKey="salesPerson" type="category" tick={{ fontSize: 11, fontWeight: 'bold' }} width={100} />
                                            <RechartsTooltip cursor={{ fill: 'transparent' }} />
                                            <Legend />
                                            <Bar dataKey="leads" name="Leads" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                                            <Bar dataKey="confirmedBookings" name="Confirmed Bookings" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-xl shadow-gray-200/50">
                                <CardHeader>
                                    <CardTitle>Overall Booking Status Distribution</CardTitle>
                                </CardHeader>
                                <CardContent className="h-80 flex justify-center items-center relative">
                                    {(() => {
                                        const r = data.dailyProgressChart.reduce((acc: any, d: any) => {
                                            acc.confirmed += d.confirmed;
                                            acc.cancelled += d.cancelled;
                                            acc.noShow += d.noShow;
                                            acc.pending = d.total - d.confirmed - d.cancelled - d.noShow;
                                            return acc;
                                        }, { confirmed: 0, cancelled: 0, noShow: 0, pending: 0 });

                                        const pieData = [
                                            { name: 'Confirmed', value: r.confirmed },
                                            { name: 'Cancelled', value: r.cancelled },
                                            { name: 'No Show', value: r.noShow },
                                            { name: 'Pending/Other', value: Math.max(0, r.pending) }
                                        ].filter(i => i.value > 0);

                                        return (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={pieData}
                                                        cx="50%" cy="50%"
                                                        innerRadius={70}
                                                        outerRadius={100}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                        labelLine={false}
                                                    >
                                                        {pieData.map((_entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        );
                                    })()}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Tab 4: Tasks Progress */}
                    {activeTab === 'tasks' && (
                        <Card className="border-none shadow-xl shadow-gray-200/50">
                            <CardHeader>
                                <CardTitle>Task Management Progress</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        {data.performanceReport.map((agent: any) => (
                                            <div key={agent.salesPerson} className="bg-gray-50 rounded-xl p-4">
                                                <div className="flex justify-between items-end mb-2">
                                                    <div>
                                                        <h4 className="font-black text-gray-800">{agent.salesPerson}</h4>
                                                        <p className="text-xs text-gray-500 font-medium">{agent.completedTasks} / {agent.assignedTasks} Tasks Completed</p>
                                                    </div>
                                                    <span className="text-xl font-black text-blue-600">{agent.taskCompletionRate}%</span>
                                                </div>
                                                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${parseFloat(agent.taskCompletionRate) > 80 ? 'bg-emerald-500' :
                                                            parseFloat(agent.taskCompletionRate) > 50 ? 'bg-blue-500' : 'bg-amber-500'
                                                            }`}
                                                        style={{ width: `${agent.taskCompletionRate}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex flex-col justify-center items-center bg-blue-50 rounded-3xl p-8">
                                        <div className="text-center">
                                            <p className="text-sm font-black uppercase tracking-widest text-blue-400 mb-2">Global Task Completion</p>
                                            <h2 className="text-6xl font-black text-blue-600">
                                                {data.salesConversionAnalytics?.assignedTasks > 0 ?
                                                    ((data.salesConversionAnalytics.completedTasks / data.salesConversionAnalytics.assignedTasks) * 100).toFixed(0) : 0}%
                                            </h2>
                                            <p className="text-gray-600 font-medium mt-4">
                                                The team has completed <span className="font-black text-gray-900">{data.salesConversionAnalytics?.completedTasks}</span> out of
                                                <span className="font-black text-gray-900"> {data.salesConversionAnalytics?.assignedTasks}</span> total workflow activities over this period.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Tab 5: Combined Performance */}
                    {activeTab === 'performance' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {data.performanceReport.map((agent: any) => (
                                <Card key={agent.salesPerson} className="border-none shadow-xl shadow-gray-200/50 overflow-hidden relative group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-500">
                                        <Target className="w-24 h-24" />
                                    </div>
                                    <CardContent className="p-6 relative z-10">
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight mb-4 flex items-center gap-2">
                                            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm">{agent.salesPerson.charAt(0)}</span>
                                            {agent.salesPerson}
                                        </h3>

                                        <div className="space-y-4 mb-6">
                                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Revenue Impact</span>
                                                <span className="font-black text-emerald-600 tracking-tight">€{agent.revenue.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Conversion Rate</span>
                                                <span className="font-bold text-gray-800">{agent.conversionRate}%
                                                    <span className="text-[10px] text-gray-400 ml-1">({agent.confirmedBookings}/{agent.leads})</span>
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Task Completion</span>
                                                <span className="font-bold text-gray-800">{agent.taskCompletionRate}%</span>
                                            </div>
                                            <div className="flex justify-between items-center pb-2">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Booking Exec Rate</span>
                                                <span className="font-bold text-gray-800">{agent.bookingExecutionRate}%</span>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl p-4 text-white text-center shadow-lg shadow-blue-500/30">
                                            <p className="text-[10px] uppercase font-black tracking-[0.2em] mb-1 opacity-80">Performance Score</p>
                                            <div className="text-3xl font-black tracking-tighter">
                                                {agent.performanceScore} <span className="text-sm opacity-60 font-medium">/ 100</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
