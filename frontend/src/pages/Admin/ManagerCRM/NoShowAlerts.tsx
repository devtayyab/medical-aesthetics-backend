import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
import { fetchNoShowAlerts, NoShowAlert } from "@/services/managerCrm.service";

export const NoShowAlerts: React.FC = () => {
  const [rows, setRows] = useState<NoShowAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setRows(await fetchNoShowAlerts());
      setLoading(false);
    };
    load();
  }, []);

  const columns = [
    { accessorKey: "patientName", header: "Patient" },
    { accessorKey: "agentName", header: "Agent" },
    { accessorKey: "clinicName", header: "Clinic" },
    { accessorKey: "date", header: "Date" },
    { accessorKey: "daysAgo", header: "Days Ago" },
    { accessorKey: "actionRecommended", header: "Recommended Action" },
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">No-Show Alerts</h1>
      <Card>
        <CardHeader>
          <CardTitle>Patients to Follow Up</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? "Loading..." : (
            <DataTable columns={columns as any} data={rows as any} searchKey="patientName" />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NoShowAlerts;
