import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/atoms/Button/Button";
import {
  AlertCircle,
  Phone,
  CheckCircle2,
  Clock,
  Calendar,
  Building2,
  Users,
  RefreshCcw,
  ArrowRight,
  TrendingDown
} from "lucide-react";
import { fetchNoShowAlerts, resolveNoShowAlert, NoShowAlert } from "@/services/managerCrm.service";
import { cn } from "@/lib/utils";

export const NoShowAlerts: React.FC = () => {
  const [rows, setRows] = useState<NoShowAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchNoShowAlerts();
      setRows(data);
    } catch (error) {
      console.error("Failed to fetch no-show alerts:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResolve = async (id: string) => {
    try {
      await resolveNoShowAlert(id, "Followed up via phone call");
      alert("Alert resolved successfully");
      loadData(true);
    } catch (error) {
      alert("Failed to resolve alert");
    }
  };

  const handleViewPatient = (appointmentId: string) => {
    // Navigate to customer details (need customer ID from rows usually, but using appointmentId as fallback or searching)
    // For now, let's assume we can navigate to the appointment or related customer
    // toast.success("Navigating to patient record...");
  };

  const columns = [
    {
      accessorKey: "patientName",
      header: "Patient",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
            <Users className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{row.original.patientName}</div>
            <div className="text-[10px] text-gray-500">ID: {row.original.appointmentId.slice(0, 8)}</div>
          </div>
        </div>
      )
    },
    {
      accessorKey: "agentName",
      header: "Assigned Agent",
      cell: ({ row }: any) => (
        <div className="text-sm font-medium text-gray-700">{row.original.agentName}</div>
      )
    },
    {
      accessorKey: "clinicName",
      header: "Clinic",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Building2 className="h-3 w-3" />
          {row.original.clinicName}
        </div>
      )
    },
    {
      accessorKey: "date",
      header: "Appointment Date",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1.5 text-xs">
          <Calendar className="h-3 w-3 text-gray-400" />
          {row.original.date}
        </div>
      )
    },
    {
      accessorKey: "daysAgo",
      header: "Status",
      cell: ({ row }: any) => {
        const days = row.original.daysAgo;
        return (
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
            days >= 7 ? "bg-red-100 text-red-700" : days >= 3 ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
          )}>
            <Clock className="h-3 w-3" />
            {days} Days Ago
          </div>
        );
      }
    },
    {
      accessorKey: "actionRecommended",
      header: "Recommended Action",
      cell: ({ row }: any) => (
        <span className="text-xs italic text-gray-500">{row.original.actionRecommended}</span>
      )
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            onClick={() => handleResolve(row.original.appointmentId)}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Resolve
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-gray-900"
            onClick={() => handleViewPatient(row.original.appointmentId)}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const highPriorityCount = rows.filter(r => r.daysAgo >= 3).length;

  return (
    <div className="p-6 space-y-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-orange-500" />
            No-Show Alerts
          </h1>
          <p className="text-muted-foreground mt-1">Manage patients who missed their appointments and need follow-up.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => loadData(true)}
            disabled={loading || isRefreshing}
            className="bg-white"
          >
            <RefreshCcw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button className="bg-[#CBFF38] text-gray-900 hover:bg-[#b8e632] font-bold">
            All Resolved
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground font-medium text-xs uppercase tracking-wider">
            Pending Alerts
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rows.length}</div>
            <p className="text-[10px] text-red-600 mt-1 font-semibold flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              Action required
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground font-medium text-xs uppercase tracking-wider">
            High Priority ({">"}3 days)
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPriorityCount}</div>
            <p className="text-[10px] text-gray-500 mt-1">Patients likely to churn if not contacted</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground font-medium text-xs uppercase tracking-wider">
            Recovery Strategy
            <Phone className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">Direct Call</div>
            <p className="text-[10px] text-gray-500 mt-1 italic">"85% recovery rate via voice follow-up"</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-gray-200/60 overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <CardTitle className="text-lg">Patients to Follow Up</CardTitle>
          </div>
          <CardDescription>Contact these patients to reschedule and prevent revenue loss.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns as any}
            data={rows as any}
            searchKey="patientName"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default NoShowAlerts;
