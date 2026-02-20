import React from 'react';
import { ColumnDef } from '@tanstack/react-table';

// Define the shape of our data
interface AgentPerformanceData {
  agentName: string;
  totalAppointments: number;
  completedAppointments: number;
  servicesSold: number;
  noShows: number;
  cancellations: number;
  conversionRate: number;
  totalRevenue: number;
  avgAppointmentValue: number;
  callsMade: number;
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
    header: 'Appts Booked',
    cell: ({ row }) => row.getValue('totalAppointments'),
  },
  {
    accessorKey: 'servicesSold',
    header: 'Services Sold',
    cell: ({ row }) => row.getValue('servicesSold'),
  },
  {
    accessorKey: 'callsMade',
    header: 'Calls Made',
    cell: ({ row }) => row.getValue('callsMade'),
  },
  {
    accessorKey: 'noShows',
    header: 'Non-shows',
    cell: ({ row }) => (
      <span className="text-amber-600">{row.getValue('noShows')}</span>
    ),
  },
  {
    accessorKey: 'totalRevenue',
    header: 'Revenue',
    cell: ({ row }) => formatCurrency(row.getValue('totalRevenue')),
  },
  {
    accessorKey: 'conversionRate',
    header: 'Conversion',
    cell: ({ row }) => {
      const rate = parseFloat(row.getValue('conversionRate'));
      // Handle percentage if already 0-100 or 0-1
      // Assuming 0-100 from backend based on previous code: (completed/total) * 100
      const displayRate = rate.toFixed(1);
      return (
        <div className="flex items-center">
          <div className="w-12 text-xs">{displayRate}%</div>
          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{ width: `${rate}%`, maxWidth: '100%' }}
            />
          </div>
        </div>
      );
    },
  },
];
