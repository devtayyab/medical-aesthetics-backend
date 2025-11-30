import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/DataTable";
import { fetchAdvertisementStats, fetchServicePerformance, AdvertisementStat, ServicePerformance } from "@/services/managerCrm.service";

export const Advertising: React.FC = () => {
  const [ads, setAds] = useState<AdvertisementStat[]>([]);
  const [services, setServices] = useState<ServicePerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [a, s] = await Promise.all([fetchAdvertisementStats(), fetchServicePerformance()]);
      setAds(a);
      setServices(s);
      setLoading(false);
    };
    load();
  }, []);

  const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Advertising & Services Performance</h1>

      <Card>
        <CardHeader>
          <CardTitle>Advertisements</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? "Loading..." : (
            <DataTable
              columns={[
                { accessorKey: "channel", header: "Channel" },
                { accessorKey: "campaignName", header: "Campaign" },
                { accessorKey: "agentBudgetOwner", header: "Budget Owner" },
                { accessorKey: "spent", header: "Spent", cell: ({ row }: any) => money(row.original.spent) },
                { accessorKey: "patientsCame", header: "Patients Came" },
                { accessorKey: "cancelled", header: "Cancelled" },
                { accessorKey: "totalRevenue", header: "Revenue", cell: ({ row }: any) => money(row.original.totalRevenue) },
              ] as any}
              data={ads as any}
              searchKey="campaignName"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistics per Service</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? "Loading..." : (
            <DataTable
              columns={[
                { accessorKey: "serviceName", header: "Service" },
                { accessorKey: "totalAppointments", header: "Appointments" },
                { accessorKey: "totalRevenue", header: "Revenue", cell: ({ row }: any) => money(row.original.totalRevenue) },
                { accessorKey: "cancellations", header: "Cancelled" },
              ] as any}
              data={services as any}
              searchKey="serviceName"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Advertising;
