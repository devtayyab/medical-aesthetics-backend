import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/atoms/Button/Button";
import {
  Building2,
  RotateCcw,
  Users,
  TrendingUp,
  ArrowUpRight,
  ExternalLink,
  Percent,
  RefreshCcw,
  Calendar
} from "lucide-react";
import { fetchClinicReturnRates, ClinicReturnRate } from "@/services/managerCrm.service";
import { cn } from "@/lib/utils";

export const ClinicStats: React.FC = () => {
  const [rows, setRows] = useState<ClinicReturnRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchClinicReturnRates();
      setRows(data);
    } catch (error) {
      console.error("Failed to fetch clinic repeat rates:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClinicClick = (clinicId: string) => {
    navigate(`/admin/manager-dashboard?clinicId=${clinicId}`);
  };

  const percent = (p: number) => `${Math.round(p * 100)}%`;

  const columns = [
    {
      accessorKey: "clinicName",
      header: "Clinic Name",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <span className="font-semibold text-gray-900">{row.original.clinicName}</span>
        </div>
      )
    },
    {
      accessorKey: "returnRate",
      header: "Return Rate",
      cell: ({ row }: any) => {
        const val = row.original.returnRate;
        return (
          <div className="flex items-center gap-3">
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full",
                  val > 0.6 ? "bg-emerald-500" : val > 0.3 ? "bg-[#CBFF38]" : "bg-orange-400"
                )}
                style={{ width: `${val * 100}%` }}
              />
            </div>
            <span className="font-bold text-sm">{percent(val)}</span>
          </div>
        );
      }
    },
    {
      accessorKey: "last30Days",
      header: "Returning (30d)",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1.5 font-medium text-emerald-600">
          <RotateCcw className="h-3 w-3" />
          {row.original.last30Days}
        </div>
      )
    },
    {
      accessorKey: "last90Days",
      header: "Returning (90d)",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1.5 font-medium text-blue-600">
          <RotateCcw className="h-3 w-3" />
          {row.original.last90Days}
        </div>
      )
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }: any) => (
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-[#CBFF38]/20 text-gray-400 hover:text-[#CBFF38]"
          onClick={() => handleClinicClick(row.original.clinicId)}
          title="View Clinic Details"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      )
    }
  ];

  // Calculated Stats
  const avgReturnRate = rows.length > 0 ? rows.reduce((acc, curr) => acc + curr.returnRate, 0) / rows.length : 0;
  const totalReturning30 = rows.reduce((acc, curr) => acc + curr.last30Days, 0);
  const totalReturning90 = rows.reduce((acc, curr) => acc + curr.last90Days, 0);

  return (
    <div className="p-6 space-y-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-[#CBFF38]" />
            Clinic Retention Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Track patient loyalty and return rates across all locations.</p>
        </div>

        <Button
          variant="outline"
          onClick={() => loadData(true)}
          disabled={loading || isRefreshing}
          className="flex items-center gap-2 bg-white"
        >
          <RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          {isRefreshing ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground font-medium text-xs uppercase tracking-wider text-gray-500">
            Avg. Return Rate
            <Percent className="h-4 w-4 text-[#CBFF38]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{percent(avgReturnRate)}</div>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 font-medium">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              Above industry benchmark
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground font-medium text-xs uppercase tracking-wider text-gray-500">
            Total Returning (30d)
            <RotateCcw className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalReturning30}</div>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 font-medium">
              <Calendar className="h-3 w-3 text-blue-500" />
              Repeat visits this month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground font-medium text-xs uppercase tracking-wider text-gray-500">
            Total Returning (90d)
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalReturning90}</div>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 font-medium text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              Growing long-term loyalty
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="shadow-sm border-gray-200/60 overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-500" />
            <CardTitle className="text-lg">Repeat Visit Breakdown</CardTitle>
          </div>
          <CardDescription>Detailed loyalty breakdown for each managed clinic.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns as any}
            data={rows as any}
            searchKey="clinicName"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ClinicStats;
