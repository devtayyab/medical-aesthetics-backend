import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
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
} from "@/services/managerCrm.service";

export const Reports: React.FC = () => {
  const [emails, setEmails] = useState<AgentEmail[]>([]);
  const [forms, setForms] = useState<AgentFormStats[]>([]);
  const [comms, setComms] = useState<AgentCommunicationStats[]>([]);
  const [appts, setAppts] = useState<AgentAppointmentStats[]>([]);
  const [cash, setCash] = useState<AgentCashflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [e, f, c, a, cf] = await Promise.all([
        fetchAgentEmails(),
        fetchAgentFormStats(),
        fetchAgentCommunicationStats(),
        fetchAgentAppointmentStats(),
        fetchAgentCashflow(),
      ]);
      setEmails(e);
      setForms(f);
      setComms(c);
      setAppts(a);
      setCash(cf);
      setLoading(false);
    };
    load();
  }, []);

  const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Manager Reports</h1>

      <Card>
        <CardHeader>
          <CardTitle>Agent Emails</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? "Loading..." : (
            <DataTable
              columns={[{ accessorKey: "agentName", header: "Agent" }, { accessorKey: "email", header: "Email" }] as any}
              data={emails as any}
              searchKey="agentName"
            />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Forms per Agent</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? "Loading..." : (
              <DataTable
                columns={[{ accessorKey: "agentName", header: "Agent" }, { accessorKey: "formsReceived", header: "Forms" }] as any}
                data={forms as any}
                searchKey="agentName"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Communications</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? "Loading..." : (
              <DataTable
                columns={[
                  { accessorKey: "agentName", header: "Agent" },
                  { accessorKey: "totalContacts", header: "Total Contacts" },
                  { accessorKey: "realCommunications", header: "Real Communications" },
                ] as any}
                data={comms as any}
                searchKey="agentName"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appointments per Agent</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? "Loading..." : (
            <DataTable
              columns={[
                { accessorKey: "agentName", header: "Agent" },
                { accessorKey: "booked", header: "Booked" },
                { accessorKey: "attended", header: "Attended" },
                { accessorKey: "treatmentsCompleted", header: "Completed" },
                { accessorKey: "cancelled", header: "Cancelled" },
                { accessorKey: "noShows", header: "No-Shows" },
              ] as any}
              data={appts as any}
              searchKey="agentName"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cash Flow per Agent</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? "Loading..." : (
            <DataTable
              columns={[
                { accessorKey: "agentName", header: "Agent" },
                { accessorKey: "revenue", header: "Revenue", cell: ({ row }: any) => money(row.original.revenue) },
                { accessorKey: "refunds", header: "Refunds", cell: ({ row }: any) => money(row.original.refunds) },
                { accessorKey: "net", header: "Net", cell: ({ row }: any) => money(row.original.net) },
              ] as any}
              data={cash as any}
              searchKey="agentName"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
