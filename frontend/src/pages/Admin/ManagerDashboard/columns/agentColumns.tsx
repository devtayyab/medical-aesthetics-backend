import React from 'react';
import { ColumnDef } from '@tanstack/react-table';

// Define the shape of our data
interface AgentPerformanceData {
  agentName: string;
  totalAppointments: number;
  completedAppointments: number;
  noShows: number;
  cancellations: number;
  conversionRate: number;
  totalRevenue: number;
  avgAppointmentValue: number;
}

// Utility function to format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const columns: ColumnDef<AgentPerformanceData>[] = [
  {
    accessorKey: 'agentName',
    header: 'Agent',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('agentName')}</div>
    ),
  },
  {
    accessorKey: 'totalAppointments',
    header: 'Total Appts',
    cell: ({ row }) => row.getValue('totalAppointments'),
  },
  {
    accessorKey: 'completedAppointments',
    header: 'Completed',
    cell: ({ row }) => row.getValue('completedAppointments'),
  },
  {
    accessorKey: 'noShows',
    header: 'No Shows',
    cell: ({ row }) => (
      <span className="text-amber-600">{row.getValue('noShows')}</span>
    ),
  },
  {
    accessorKey: 'cancellations',
    header: 'Cancellations',
    cell: ({ row }) => (
      <span className="text-rose-600">{row.getValue('cancellations')}</span>
    ),
  },
  {
    accessorKey: 'conversionRate',
    header: 'Conversion Rate',
    cell: ({ row }) => {
      const rate = parseFloat(row.getValue('conversionRate')) * 100;
      return (
        <div className="flex items-center">
          <div className="w-16">{rate.toFixed(1)}%</div>
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary" 
              style={{ width: `${rate}%`, maxWidth: '100%' }}
            />
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'totalRevenue',
    header: 'Revenue',
    cell: ({ row }) => formatCurrency(row.getValue('totalRevenue')),
  },
  {
    accessorKey: 'avgAppointmentValue',
    header: 'Avg. Value',
    cell: ({ row }) => formatCurrency(row.getValue('avgAppointmentValue')),
  },
];
