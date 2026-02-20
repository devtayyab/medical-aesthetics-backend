import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/atoms/Button/Button";
import {
  BarChart3,
  Mail,
  FileText,
  MessageSquare,
  Calendar as CalendarIcon,
  DollarSign,
  RefreshCcw,
  Clock,
  ExternalLink
} from "lucide-react";
import {
  fetchAgentEmails,
  fetchAgentFormStats,
  fetchAgentCommunicationStats,
  fetchAgentAppointmentStats,
  fetchAgentCashflow,
  AgentEmail,
  AgentFormStats,
  AgentCommunicationStats,
  AgentAppointmentStats,
  AgentCashflow,
  getDateRange,
} from "@/services/managerCrm.service";
import { cn } from "@/lib/utils";

const periods = [
  { label: "Today", value: "0" },
  { label: "Last 7 Days", value: "7" },
  { label: "Last 30 Days", value: "30" },
  { label: "Last 90 Days", value: "90" },
  { label: "All Time", value: "all" },
];

export const Reports: React.FC = () => {
  const [emails, setEmails] = useState<AgentEmail[]>([]);
  const [forms, setForms] = useState<AgentFormStats[]>([]);
  const [comms, setComms] = useState<AgentCommunicationStats[]>([]);
  const [appts, setAppts] = useState<AgentAppointmentStats[]>([]);
  const [cash, setCash] = useState<AgentCashflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const handleAgentClick = (agent: AgentEmail) => {
    navigate(`/admin/manager-dashboard?agentId=${agent.agentId}`);
  };

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      const dates = selectedPeriod === "all" ? undefined : getDateRange(parseInt(selectedPeriod));

      const [e, f, c, a, cf] = await Promise.all([
        fetchAgentEmails(),
        fetchAgentFormStats(dates),
        fetchAgentCommunicationStats(dates),
        fetchAgentAppointmentStats(dates),
        fetchAgentCashflow(dates),
      ]);

      setEmails(e);
      setForms(f);
      setComms(c);
      setAppts(a);
      setCash(cf);
    } catch (error) {
      console.error("Failed to load CRM reports:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const money = (n: number) => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(n);

  return (
    <div className="p-6 space-y-8 bg-gray-50/50 min-h-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-[#CBFF38]" />
            Manager CRM Reports
          </h1>
          <p className="text-muted-foreground mt-1">Detailed performance metrics for your sales team.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white border rounded-lg p-1 shadow-sm">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setSelectedPeriod(p.value)}
                className={cn(
                  "px-4 py-1.5 text-xs font-semibold rounded-md transition-all",
                  selectedPeriod === p.value
                    ? "bg-[#CBFF38] text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => loadData(true)}
            disabled={loading || isRefreshing}
            className={cn(isRefreshing && "animate-spin")}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Stats Summary Cards (Dynamic calculation from loaded data) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground font-medium text-xs uppercase tracking-wider">
            Total Forms
            <FileText className="h-4 w-4 text-[#CBFF38]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forms.reduce((acc, curr) => acc + curr.formsReceived, 0)}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground font-medium text-xs uppercase tracking-wider">
            Total Comms
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comms.reduce((acc, curr) => acc + curr.totalContacts, 0)}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground font-medium text-xs uppercase tracking-wider">
            Appts Booked
            <CalendarIcon className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appts.reduce((acc, curr) => acc + curr.booked, 0)}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground font-medium text-xs uppercase tracking-wider">
            Total Net Cash
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{money(cash.reduce((acc, curr) => acc + curr.net, 0))}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Agent Emails Card */}
        <Card className="shadow-sm border-gray-200/60 overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <CardTitle className="text-lg">Agent Directory</CardTitle>
            </div>
            <CardDescription>Contact information for active sales agents.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={[
                { accessorKey: "agentName", header: "Agent" },
                {
                  accessorKey: "email",
                  header: "Email",
                  cell: ({ row }: any) => (
                    <a href={`mailto:${row.original.email}`} className="text-blue-600 hover:scale-105 transition-transform inline-block">
                      {row.original.email}
                    </a>
                  )
                },
                {
                  id: "actions",
                  header: "",
                  cell: ({ row }: any) => (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-[#CBFF38]/20 hover:text-[#CBFF38]"
                      onClick={() => handleAgentClick(row.original)}
                      title="View Agent Dashboard"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )
                }
              ] as any}
              data={emails as any}
              searchKey="agentName"
            />
          </CardContent>
        </Card>

        {/* Communications Card */}
        <Card className="shadow-sm border-gray-200/60 overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              <CardTitle className="text-lg">Communications</CardTitle>
            </div>
            <CardDescription>Activity logs by salesperson.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={[
                { accessorKey: "agentName", header: "Agent" },
                {
                  accessorKey: "totalContacts",
                  header: "Total",
                  cell: ({ row }: any) => <div className="font-medium text-gray-900">{row.original.totalContacts}</div>
                },
                {
                  accessorKey: "realCommunications",
                  header: "Real",
                  cell: ({ row }: any) => {
                    const pct = row.original.totalContacts > 0
                      ? Math.round((row.original.realCommunications / row.original.totalContacts) * 100)
                      : 0;
                    return (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-emerald-600">{row.original.realCommunications}</span>
                        <span className="text-[10px] text-gray-400">({pct}%)</span>
                      </div>
                    );
                  }
                },
              ] as any}
              data={comms as any}
              searchKey="agentName"
            />
          </CardContent>
        </Card>

        {/* Forms per Agent Card */}
        <Card className="shadow-sm border-gray-200/60 overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <CardTitle className="text-lg">Lead Generation</CardTitle>
            </div>
            <CardDescription>Forms received by assigned agent.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={[
                { accessorKey: "agentName", header: "Agent" },
                {
                  accessorKey: "formsReceived",
                  header: "Forms",
                  cell: ({ row }: any) => (
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
                        <div
                          className="h-full bg-[#CBFF38]"
                          style={{ width: `${Math.min(100, (row.original.formsReceived / 50) * 100)}%` }}
                        />
                      </div>
                      <span className="font-bold">{row.original.formsReceived}</span>
                    </div>
                  )
                }
              ] as any}
              data={forms as any}
              searchKey="agentName"
            />
          </CardContent>
        </Card>

        {/* Cash Flow Card */}
        <Card className="shadow-sm border-gray-200/60 overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <CardTitle className="text-lg">Financial Impact</CardTitle>
            </div>
            <CardDescription>Revenue and refunds attributed to agents.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={[
                { accessorKey: "agentName", header: "Agent" },
                {
                  accessorKey: "revenue",
                  header: "Revenue",
                  cell: ({ row }: any) => <span className="font-semibold text-gray-900">{money(row.original.revenue)}</span>
                },
                {
                  accessorKey: "net",
                  header: "Net Yield",
                  cell: ({ row }: any) => (
                    <div className={cn(
                      "font-bold px-2 py-0.5 rounded text-xs inline-block",
                      row.original.net >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    )}>
                      {money(row.original.net)}
                    </div>
                  )
                },
              ] as any}
              data={cash as any}
              searchKey="agentName"
            />
          </CardContent>
        </Card>
      </div>

      {/* Appointments Summary Table (Full Width) */}
      <Card className="shadow-sm border-gray-200/60 overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              <CardTitle className="text-lg">Appointment Conversion</CardTitle>
            </div>
            <CardDescription>End-to-end appointment lifecycle metrics.</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
              <Clock className="h-3 w-3" />
              Live Updates
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={[
              { accessorKey: "agentName", header: "Agent" },
              { accessorKey: "booked", header: "Booked" },
              {
                accessorKey: "attended",
                header: "Shows",
                cell: ({ row }: any) => {
                  const pct = row.original.booked > 0 ? Math.round((row.original.attended / row.original.booked) * 100) : 0;
                  return (
                    <div className="flex items-center gap-2">
                      <span>{row.original.attended}</span>
                      <span className="text-[10px] text-gray-400">({pct}%)</span>
                    </div>
                  );
                }
              },
              { accessorKey: "treatmentsCompleted", header: "Compl." },
              {
                accessorKey: "cancelled",
                header: "Cancl.",
                cell: ({ row }: any) => <span className="text-red-500">{row.original.cancelled}</span>
              },
              {
                accessorKey: "noShows",
                header: "No-Show",
                cell: ({ row }: any) => <span className="text-orange-600 font-medium">{row.original.noShows}</span>
              },
            ] as any}
            data={appts as any}
            searchKey="agentName"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
