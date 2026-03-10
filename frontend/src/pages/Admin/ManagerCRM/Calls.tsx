import React, { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import {
  PhoneCall,
  Clock,
  Headphones,
  Activity,
  RefreshCcw,
  CheckCircle2,
  PhoneForwarded,
  PhoneIncoming,
  Timer,
  Calendar,
  UserCheck,
  Filter,
  Users
} from "lucide-react";
import { fetchCallLogs, initiateCall, CallLog } from "@/services/managerCrm.service";
import { fetchSalespersons } from "@/store/slices/crmSlice";
import { RootState, AppDispatch } from "@/store";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth } from "date-fns";

export const Calls: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { salespersons } = useSelector((state: RootState) => state.crm);

  const [rows, setRows] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [selectedAgent, setSelectedAgent] = useState<string>("all");

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchCallLogs({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        salespersonId: selectedAgent === 'all' ? undefined : selectedAgent
      });
      setRows(data);
      setError(null);
    } catch (e) {
      setError("Failed to load call logs");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [dateRange, selectedAgent]);

  useEffect(() => {
    dispatch(fetchSalespersons());
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatOutcome = (outcome: string) => {
    return outcome.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const columns = [
    {
      accessorKey: "timestamp",
      header: "Call Time",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(row.original.timestamp).toLocaleString()}
        </div>
      )
    },
    {
      accessorKey: "agentName",
      header: "Agent",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-blue-50 flex items-center justify-center">
            <UserCheck className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <span className="font-semibold text-sm text-gray-900">{row.original.agentName}</span>
        </div>
      )
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }: any) => (
        <div className="text-sm font-medium text-gray-700">{row.original.customerName}</div>
      )
    },
    {
      accessorKey: "customerPhone",
      header: "Recipient",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <PhoneForwarded className="h-3 w-3" />
          {row.original.customerPhone}
        </div>
      )
    },
    {
      accessorKey: "outcome",
      header: "Status",
      cell: ({ row }: any) => (
        <div className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
          row.original.outcome === 'answered' ? "bg-emerald-100 text-emerald-700" :
            row.original.outcome === 'no_answer' ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
        )}>
          {row.original.outcome === 'answered' && <CheckCircle2 className="h-3 w-3" />}
          {formatOutcome(row.original.outcome)}
        </div>
      )
    },
    {
      accessorKey: "durationSec",
      header: "Duration",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1.5 text-xs font-mono text-gray-600">
          <Timer className="h-3.5 w-3.5 text-gray-400" />
          {formatDuration(row.original.durationSec)}
        </div>
      )
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }: any) => (
        <Button
          size="sm"
          className="h-8 bg-[#CBFF38] text-black hover:bg-[#b8e632] font-bold gap-2 px-4"
          onClick={async () => {
            const res = await initiateCall(row.original.customerPhone);
            if (!res.ok) alert(res.providerHint);
          }}
        >
          <PhoneCall className="h-3.5 w-3.5" />
          Redial
        </Button>
      ),
    },
  ];

  // Calculated Stats
  const totalCalls = rows.length;
  const avgDuration = rows.length > 0 ? Math.round(rows.reduce((acc, curr) => acc + curr.durationSec, 0) / rows.length) : 0;
  const successRate = rows.length > 0 ? Math.round((rows.filter(r => r.outcome === 'answered').length / rows.length) * 100) : 0;

  return (
    <div className="p-6 space-y-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Headphones className="h-8 w-8 text-[#CBFF38]" />
            Communication Hub
          </h1>
          <p className="text-muted-foreground mt-1">Monitor agent-client voice interactions and call performance.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          {/* Date Range Picker */}
          <div className="flex items-center gap-2 px-3 border-r border-slate-100">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(p => ({ ...p, startDate: e.target.value }))}
              className="bg-transparent border-none text-[11px] font-black text-slate-700 focus:ring-0 p-0"
            />
            <span className="text-[10px] text-slate-300 font-bold px-1">TO</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(p => ({ ...p, endDate: e.target.value }))}
              className="bg-transparent border-none text-[11px] font-black text-slate-700 focus:ring-0 p-0"
            />
          </div>

          {/* Salesperson Filter */}
          <div className="flex items-center gap-2 px-3 border-r border-slate-100 min-w-[180px]">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="bg-transparent border-none text-[11px] font-black text-slate-700 focus:ring-0 p-0 flex-1 appearance-none cursor-pointer"
            >
              <option value="all">Overall Data (All Agents)</option>
              {salespersons.map(s => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
              ))}
            </select>
          </div>

          <Button
            variant="ghost"
            onClick={() => loadData(true)}
            disabled={loading || isRefreshing}
            className="flex items-center gap-2 h-9 px-4 rounded-xl hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest text-slate-600"
          >
            <RefreshCcw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            Update Logs
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-all border-none shadow-sm overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Activity className="h-12 w-12 text-blue-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground font-black text-[9px] uppercase tracking-[0.2em] text-slate-400">
            Total Volume
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 tracking-tighter">{totalCalls}</div>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-bold italic">
              Logged engagements
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-none shadow-sm overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Clock className="h-12 w-12 text-[#CBFF38]" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground font-black text-[9px] uppercase tracking-[0.2em] text-slate-400">
            Avg. Interaction
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 tracking-tighter">{formatDuration(avgDuration)}</div>
            <p className="text-[10px] text-emerald-600 mt-1 font-black uppercase tracking-wider">
              Success Efficiency
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-none shadow-sm overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground font-black text-[9px] uppercase tracking-[0.2em] text-slate-400">
            Connection Rate
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 tracking-tighter">{successRate}%</div>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-bold italic">
              Conversion probability
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="shadow-2xl shadow-slate-200/50 border-none rounded-3xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
              <PhoneIncoming className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Interaction Database</CardTitle>
              <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Comprehensive audit log of platform communications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && <div className="p-20 text-center text-red-600 font-black uppercase tracking-widest">{error}</div>}
          {!error && (
            <div className="Calls-DataTable-Container">
              <DataTable columns={columns as any} data={rows as any} searchKey="customerName" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Calls;
