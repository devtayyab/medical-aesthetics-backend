import React, { useEffect } from"react";
import { useDispatch, useSelector } from"react-redux";
import { fetchMetrics } from"@/store/slices/adminSlice";
import type { RootState, AppDispatch } from"@/store";
import {
 Users,
 CalendarCheck,
 Euro,
 XCircle,
 AlertTriangle,
 Clock,
 MapPin,
 Image as ImageIcon,
 CheckCircle,
 ListTodo,
} from"lucide-react";

export const Dashboard: React.FC = () => {
 const dispatch = useDispatch<AppDispatch>();
 const { metrics: _metrics, isLoading, error } = useSelector(
 (state: RootState) => state.admin
 );

 useEffect(() => {
 dispatch(fetchMetrics());
 }, [dispatch]);

 // Only turnover comes from the API so far. The other figures are not computed yet:
 // show a dash instead of invented numbers.
 const NA = "—";
 const expandedMetrics = {
 leadsToday: NA,
 leadsLast7Days: NA,
 appointmentsDateRange: {
 booked: NA,
 confirmed: NA,
 canceled: NA,
 noShow: NA,
 done: NA,
 },
 // Turnover MTD comes from the payments ledger (shared revenue definition, EUR, paid only).
 turnoverMtd: Number((_metrics as any)?.revenue || 0),
 cancellationRate: NA,
 noShowRate: NA,
 tasksDueToday: NA,
 tasksOverdue: NA,
 };

 const actionWidgets = [
 { title:"Pending Reviews", count: NA, icon: <Clock className="w-5 h-5 text-yellow-500" />, color:"bg-yellow-50 border-yellow-200" },
 { title:"New Therapy Requests", count: NA, icon: <AlertTriangle className="w-5 h-5 text-orange-500" />, color:"bg-orange-50 border-orange-200" },
 { title:"Missing Coordinates", count: NA, icon: <MapPin className="w-5 h-5 text-red-500" />, color:"bg-red-50 border-red-200" },
 { title:"Missing Therapy Photos", count: NA, icon: <ImageIcon className="w-5 h-5 text-purple-500" />, color:"bg-purple-50 border-purple-200" },
 ];

 // No execution feed API yet: never show invented clinics.
 const executionFeed: { id: number; clinic: string; service: string; status: string; time: string }[] = [];

 return (
 <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
 <div className="flex justify-between items-center mb-8">
 <div>
 <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
 <p className="text-sm text-gray-500 mt-1">System control center & overview</p>
 </div>
 </div>

 {isLoading && <p>Loading metrics...</p>}
 {error && <p className="text-red-600">Error loading metrics: {error}</p>}

 {/* KPI Overview Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
 <div className="bg-white rounded-xl shadow p-6 border border-gray-100 flex items-center justify-between">
 <div>
 <p className="text-sm font-medium text-gray-500 mb-1">Leads (Today / 7d)</p>
 <p className="text-2xl font-bold text-gray-900">{expandedMetrics.leadsToday} / {expandedMetrics.leadsLast7Days}</p>
 </div>
 <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
 <Users className="w-6 h-6" />
 </div>
 </div>

 <div className="bg-white rounded-xl shadow p-6 border border-gray-100 flex items-center justify-between">
 <div>
 <p className="text-sm font-medium text-gray-500 mb-1">Turnover MTD</p>
 <p className="text-2xl font-bold text-gray-900">€{expandedMetrics.turnoverMtd.toLocaleString()}</p>
 <p className="text-xs text-gray-400 mt-1">Paid, EUR, this month</p>
 </div>
 <div className="p-3 bg-green-50 text-green-600 rounded-lg">
 <Euro className="w-6 h-6" />
 </div>
 </div>

 <div className="bg-white rounded-xl shadow p-6 border border-gray-100 flex items-center justify-between">
 <div>
 <p className="text-sm font-medium text-gray-500 mb-1">Cancellations / No-Shows</p>
 <p className="text-2xl font-bold text-gray-900">{expandedMetrics.cancellationRate} / {expandedMetrics.noShowRate}</p>
 </div>
 <div className="p-3 bg-red-50 text-red-600 rounded-lg">
 <XCircle className="w-6 h-6" />
 </div>
 </div>

 <div className="bg-white rounded-xl shadow p-6 border border-gray-100 flex items-center justify-between">
 <div>
 <p className="text-sm font-medium text-gray-500 mb-1">Tasks (Due / Overdue)</p>
 <p className="text-2xl font-bold text-gray-900">{expandedMetrics.tasksDueToday} / <span className="text-red-500">{expandedMetrics.tasksOverdue}</span></p>
 </div>
 <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
 <ListTodo className="w-6 h-6" />
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

 {/* Left Column: Appointments & Actions */}
 <div className="lg:col-span-2 space-y-8">

 {/* Appointments Block */}
 <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
 <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
 <CalendarCheck className="w-5 h-5 text-blue-600" /> Appointments Overview (Date Range)
 </h3>
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
 <div className="text-center p-4 bg-gray-50 rounded-lg">
 <p className="text-2xl font-bold text-gray-900">{expandedMetrics.appointmentsDateRange.booked}</p>
 <p className="text-xs text-gray-500 uppercase mt-1">Booked</p>
 </div>
 <div className="text-center p-4 bg-blue-50 rounded-lg">
 <p className="text-2xl font-bold text-blue-700">{expandedMetrics.appointmentsDateRange.confirmed}</p>
 <p className="text-xs text-blue-600 uppercase mt-1">Confirmed</p>
 </div>
 <div className="text-center p-4 bg-green-50 rounded-lg">
 <p className="text-2xl font-bold text-green-700">{expandedMetrics.appointmentsDateRange.done}</p>
 <p className="text-xs text-green-600 uppercase mt-1">Done</p>
 </div>
 <div className="text-center p-4 bg-orange-50 rounded-lg">
 <p className="text-2xl font-bold text-orange-700">{expandedMetrics.appointmentsDateRange.canceled}</p>
 <p className="text-xs text-orange-600 uppercase mt-1">Canceled</p>
 </div>
 <div className="text-center p-4 bg-red-50 rounded-lg">
 <p className="text-2xl font-bold text-red-700">{expandedMetrics.appointmentsDateRange.noShow}</p>
 <p className="text-xs text-red-600 uppercase mt-1">No-Show</p>
 </div>
 </div>
 </div>

 {/* Action Required Widgets */}
 <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
 <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
 <AlertTriangle className="w-5 h-5 text-orange-500" /> Action Required
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {actionWidgets.map((widget, idx) => (
 <div key={idx} className={`flex items-center justify-between p-4 rounded-lg border ${widget.color}`}>
 <div className="flex items-center gap-3">
 {widget.icon}
 <span className="font-semibold text-gray-800">{widget.title}</span>
 </div>
 <span className="font-bold text-lg text-gray-900">{widget.count}</span>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Right Column: Execution Notifications */}
 <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
 <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
 <CheckCircle className="w-5 h-5 text-green-500" /> Execution Feed
 </h3>
 <p className="text-xs text-gray-400 mb-4">Appointments recently marked as Done</p>
 <div className="space-y-4">
 {executionFeed.map((item) => (
 <div key={item.id} className="p-3 border-l-4 border-green-400 bg-gray-50 rounded-r-lg relative">
 <div className="absolute top-3 right-3 text-xs text-gray-400">{item.time}</div>
 <p className="font-semibold text-sm text-gray-900">{item.clinic}</p>
 <p className="text-sm text-gray-600 truncate mr-16">{item.service}</p>
 </div>
 ))}
 {executionFeed.length === 0 && (
 <p className="text-sm text-gray-500 text-center py-4">No recent executions.</p>
 )}
 <button className="w-full mt-2 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded transition-colors">
 View All Executions
 </button>
 </div>
 </div>

 </div>
 </div>
 );
};

