import React from 'react';

// Format currency utility function
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const columns = [
  {
    accessorKey: 'serviceName',
    header: 'Service',
    cell: ({ row }: { row: { getValue: (key: string) => any } }) => (
      <div className="font-medium">{row.getValue('serviceName')}</div>
    ),
  },
  {
    accessorKey: 'totalAppointments',
    header: 'Appointments',
    cell: ({ row }: { row: { getValue: (key: string) => any } }) => row.getValue('totalAppointments'),
  },
  {
    accessorKey: 'totalRevenue',
    header: 'Revenue',
    cell: ({ row }: { row: { getValue: (key: string) => any } }) => 
      formatCurrency(row.getValue('totalRevenue') || 0),
  },
  {
    accessorKey: 'avgRevenuePerAppointment',
    header: 'Avg. per Appt',
    cell: ({ row }: { row: { getValue: (key: string) => any } }) => {
      const revenue = parseFloat(row.getValue('totalRevenue') || '0');
      const appointments = parseInt(row.getValue('totalAppointments') || '1');
      const avg = appointments > 0 ? revenue / appointments : 0;
      return formatCurrency(avg);
    },
  },
  {
    accessorKey: 'revenueShare',
    header: 'Revenue Share',
    cell: ({ row, table }: { 
      row: { getValue: (key: string) => any }, 
      table: { getRowModel: () => { rows: { getValue: (key: string) => any }[] } } 
    }) => {
      const revenue = parseFloat(row.getValue('totalRevenue') || '0');
      // @ts-ignore - TypeScript doesn't understand the table structure here
      const rows = table.getRowModel().rows;
      const totalRevenue = rows.reduce((sum: number, r: { getValue: (key: string) => any }) => {
        return sum + parseFloat(r.getValue('totalRevenue') || '0');
      }, 0);
      const share = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
      return (
        <div className="flex items-center">
          <div className="w-16">{share.toFixed(1)}%</div>
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary" 
              style={{ width: `${share}%`, maxWidth: '100%' }}
            />
          </div>
        </div>
      );
    },
  },
];
