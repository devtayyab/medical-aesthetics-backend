import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/atoms/Button/Button";
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
  UserCheck
} from "lucide-react";
import { fetchCallLogs, initiateCall, CallLog } from "@/services/managerCrm.service";
import { cn } from "@/lib/utils";

export const Calls: React.FC = () => {
  const [rows, setRows] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchCallLogs();
      setRows(data);
      setError(null);
    } catch (e) {
      setError("Failed to load call logs");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

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
          {row.original.timestamp}
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Headphones className="h-8 w-8 text-[#CBFF38]" />
            Communication Hub
          </h1>
          <p className="text-muted-foreground mt-1">Monitor agent-client voice interactions and call performance.</p>
        </div>

        <Button
          variant="outline"
          onClick={() => loadData(true)}
          disabled={loading || isRefreshing}
          className="flex items-center gap-2 bg-white"
        >
          <RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          Refresh Logs
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground font-medium text-xs uppercase tracking-wider text-gray-500">
            Total Volume
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalCalls}</div>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 font-medium">
              Calls logged this period
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground font-medium text-xs uppercase tracking-wider text-gray-500">
            Avg. Engagement
            <Clock className="h-4 w-4 text-[#CBFF38]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatDuration(avgDuration)}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium text-emerald-600">
              Per successful connection
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground font-medium text-xs uppercase tracking-wider text-gray-500">
            Connection Rate
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{successRate}%</div>
            <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1 font-medium">
              Successful call delivery
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="shadow-sm border-gray-200/60 overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b">
          <div className="flex items-center gap-2">
            <PhoneIncoming className="h-4 w-4 text-gray-500" />
            <CardTitle className="text-lg">Recent Call Activity</CardTitle>
          </div>
          <CardDescription>Comprehensive log of all outgoing and incoming agent communications.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {error && <div className="p-8 text-center text-red-600 font-medium">{error}</div>}
          {!error && (
            <DataTable columns={columns as any} data={rows as any} searchKey="customerName" />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Calls;
