import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
import { fetchClientBenefits, ClientBenefit } from "@/services/managerCrm.service";

export const Benefits: React.FC = () => {
  const [rows, setRows] = useState<ClientBenefit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setRows(await fetchClientBenefits());
      setLoading(false);
    };
    load();
  }, []);

  const columns = [
    { accessorKey: "customerName", header: "Customer" },
    { accessorKey: "clinicName", header: "Clinic" },
    { accessorKey: "discount", header: "Discount" },
    { accessorKey: "gift", header: "Gift" },
    { accessorKey: "membership", header: "Membership" },
    { accessorKey: "lastUpdated", header: "Updated" },
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Customer Benefits</h1>
      <Card>
        <CardHeader>
          <CardTitle>Discounts, Gifts, Memberships</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? "Loading..." : (
            <DataTable columns={columns as any} data={rows as any} searchKey="customerName" />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Benefits;
