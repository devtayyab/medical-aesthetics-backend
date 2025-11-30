import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
import { fetchAccessMatrix, AccessMatrixRow } from "@/services/managerCrm.service";

export const AccessControl: React.FC = () => {
  const [rows, setRows] = useState<AccessMatrixRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setRows(await fetchAccessMatrix());
      setLoading(false);
    };
    load();
  }, []);

  const columns = [
    { accessorKey: "agentName", header: "Agent" },
    {
      id: "clinics",
      header: "Clinics Access",
      cell: ({ row }: any) => (
        <div className="space-y-1">
          {row.original.clinics.map((c: any) => (
            <div key={c.clinicId} className="text-sm">
              <span className={`px-2 py-0.5 rounded mr-2 ${c.hasAccess ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                {c.clinicName}
              </span>
              {c.isPrivateToOwner && <span className="text-xs text-red-600">(Private to owner)</span>}
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Access Control</h1>
      <Card>
        <CardHeader>
          <CardTitle>Agent x Clinic Access Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? "Loading..." : (
            <DataTable columns={columns as any} data={rows as any} searchKey="agentName" />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessControl;
