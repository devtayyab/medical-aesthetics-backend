import { ColumnDef } from '@tanstack/react-table';

export interface ServiceStat {
  serviceName: string;
  totalAppointments: number;
  totalRevenue: number;
  avgRevenuePerAppointment?: number;
  revenueShare?: number;
}

declare const columns: ColumnDef<ServiceStat>[];

export { columns };
