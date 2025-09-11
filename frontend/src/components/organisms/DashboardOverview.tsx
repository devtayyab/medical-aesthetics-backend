import React from "react";
import { Card } from "@/components/atoms/Card/Card";

interface DashboardOverviewProps {
  metrics: { leads: number; conversions: number; revenue: number };
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  metrics,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4">
        <h3 className="text-lg font-semibold">Leads</h3>
        <p className="text-2xl">{metrics.leads}</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-lg font-semibold">Conversions</h3>
        <p className="text-2xl">{metrics.conversions}</p>
      </Card>
      <Card className="p-4">
        <h3 className="text-lg font-semibold">Revenue</h3>
        <p className="text-2xl">${metrics.revenue.toFixed(2)}</p>
      </Card>
    </div>
  );
};
