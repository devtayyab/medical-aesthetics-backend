import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
import { fetchClinicReturnRates, ClinicReturnRate } from "@/services/managerCrm.service";

export const ClinicStats: React.FC = () => {
  const [rows, setRows] = useState<ClinicReturnRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setRows(await fetchClinicReturnRates());
      setLoading(false);
    };
    load();
  }, []);

  const percent = (p: number) => `${Math.round(p * 100)}%`;

  const columns = [
    { accessorKey: "clinicName", header: "Clinic" },
    { accessorKey: "returnRate", header: "Return Rate", cell: ({ row }: any) => percent(row.original.returnRate) },
    { accessorKey: "last30Days", header: "Returning (30d)" },
    { accessorKey: "last90Days", header: "Returning (90d)" },
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Clinic Repeat Rate</h1>
      <Card>
        <CardHeader>
          <CardTitle>Per Clinic Stats</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? "Loading..." : (
            <DataTable columns={columns as any} data={rows as any} searchKey="clinicName" />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClinicStats;
