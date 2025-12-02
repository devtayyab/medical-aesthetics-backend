import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
import { fetchCallLogs, initiateCall, CallLog } from "@/services/managerCrm.service";

export const Calls: React.FC = () => {
  const [rows, setRows] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchCallLogs();
        setRows(data);
      } catch (e) {
        setError("Failed to load call logs");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns = [
    { accessorKey: "timestamp", header: "Time" },
    { accessorKey: "agentName", header: "Agent" },
    { accessorKey: "customerName", header: "Customer" },
    { accessorKey: "customerPhone", header: "Phone" },
    { accessorKey: "clinicName", header: "Clinic" },
    { accessorKey: "outcome", header: "Outcome" },
    { accessorKey: "durationSec", header: "Duration (s)" },
    {
      id: "actions",
      header: "",
      cell: ({ row }: any) => (
        <button
          className="px-2 py-1 text-sm rounded bg-[#CBFF38] text-black"
          onClick={async () => {
            const res = await initiateCall(row.original.customerPhone);
            if (!res.ok) alert(res.providerHint);
          }}
        >
          Call
        </button>
      ),
    },
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">CRM Calls</h1>

      <Card>
        <CardHeader>
          <CardTitle>Call Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div>Loading...</div>}
          {error && <div className="text-red-600">{error}</div>}
          {!loading && !error && (
            <DataTable columns={columns as any} data={rows as any} searchKey="customerName" />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Calls;
