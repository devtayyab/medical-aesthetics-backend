import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/atoms/Button/Button";
import {
  ShieldCheck,
  Lock,
  UserCheck,
  Building2,
  RefreshCcw,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  EyeOff
} from "lucide-react";
import { fetchAccessMatrix, AccessMatrixRow } from "@/services/managerCrm.service";
import { cn } from "@/lib/utils";

export const AccessControl: React.FC = () => {
  const [rows, setRows] = useState<AccessMatrixRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchAccessMatrix();
      setRows(data);
    } catch (error) {
      console.error("Failed to fetch access matrix:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns = [
    {
      accessorKey: "agentName",
      header: "Agent",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
            <UserCheck className="h-4 w-4 text-blue-600" />
          </div>
          <span className="font-bold text-gray-900">{row.original.agentName}</span>
        </div>
      )
    },
    {
      id: "clinics",
      header: "Clinics Access Permissions",
      cell: ({ row }: any) => (
        <div className="flex flex-wrap gap-2 py-1">
          {row.original.clinics.map((c: any) => (
            <div
              key={c.clinicId}
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-medium transition-all group",
                c.hasAccess
                  ? "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100"
                  : "bg-gray-50 border-gray-100 text-gray-400 opacity-60"
              )}
            >
              {c.hasAccess ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              ) : (
                <XCircle className="h-3 w-3 text-gray-300" />
              )}
              {c.clinicName}
              {c.isPrivateToOwner && (
                <div className="flex items-center gap-1 text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded ml-1 font-bold">
                  <EyeOff className="h-2.5 w-2.5" />
                  OWNER ONLY
                </div>
              )}
            </div>
          ))}
        </div>
      ),
    },
  ];

  // Calculated Stats
  const totalAgents = rows.length;
  const privateClinicsCount = rows[0]?.clinics.filter(c => c.isPrivateToOwner).length || 0;
  const totalClinicsCount = rows[0]?.clinics.length || 0;

  return (
    <div className="p-6 space-y-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-[#CBFF38]" />
            Access Control Matrix
          </h1>
          <p className="text-muted-foreground mt-1">Manage agent visibility and clinic-specific permissions.</p>
        </div>

        <Button
          variant="outline"
          onClick={() => loadData(true)}
          disabled={loading || isRefreshing}
          className="flex items-center gap-2 bg-white"
        >
          <RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          Refresh Registry
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground font-medium text-xs uppercase tracking-wider text-gray-500">
            Managed Agents
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalAgents}</div>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 font-medium text-emerald-600">
              <CheckCircle2 className="h-3 w-3" />
              All profiles synchronized
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground font-medium text-xs uppercase tracking-wider text-gray-500">
            Clinic Inventory
            <Building2 className="h-4 w-4 text-[#CBFF38]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalClinicsCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">
              Registered locations in network
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground font-medium text-xs uppercase tracking-wider text-gray-500">
            Access Restrictions
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{privateClinicsCount}</div>
            <p className="text-[10px] text-red-600 mt-1 flex items-center gap-1 font-bold">
              <Lock className="h-3 w-3" />
              Private to owners only
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Matrix Table */}
      <Card className="shadow-sm border-gray-200/60 overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-gray-500" />
            <CardTitle className="text-lg">Permission Mapping</CardTitle>
          </div>
          <CardDescription>View which agents have access to specific clinic calendars and data.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns as any}
            data={rows as any}
            searchKey="agentName"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessControl;
