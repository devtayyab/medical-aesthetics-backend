import React from 'react';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  className?: string;
}

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
  className?: string;
}

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
  className?: string;
}

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  className?: string;
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
  className?: string;
}

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className = '', ...props }) => (
  <div className="relative w-full overflow-auto">
    <table
      className={`w-full caption-bottom text-sm border-collapse ${className}`}
      {...props}
    >
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className = '', ...props }) => (
  <thead
    className={`border-b border-gray-200 bg-gray-50/50 ${className}`}
    {...props}
  >
    {children}
  </thead>
);

export const TableBody: React.FC<TableBodyProps> = ({ children, className = '', ...props }) => (
  <tbody
    className={`divide-y divide-gray-200 ${className}`}
    {...props}
  >
    {children}
  </tbody>
);

export const TableHead: React.FC<TableHeadProps> = ({
  children,
  className = '',
  ...props
}) => (
  <th
    className={`h-12 px-4 text-left align-middle font-medium text-gray-500 border-b border-gray-200 bg-gray-50/50 ${className}`}
    {...props}
  >
    {children}
  </th>
);

export const TableRow: React.FC<TableRowProps> = ({ children, className = '', ...props }) => (
  <tr
    className={`transition-colors hover:bg-gray-50/50 ${className}`}
    {...props}
  >
    {children}
  </tr>
);

export const TableCell: React.FC<TableCellProps> = ({
  children,
  className = '',
  ...props
}) => (
  <td
    className={`p-4 align-middle text-gray-900 border-b border-gray-200 ${className}`}
    {...props}
  >
    {children}
  </td>
);
