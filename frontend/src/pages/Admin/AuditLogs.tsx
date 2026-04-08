import React, { useEffect, useState } from 'react';
import { Search, Filter, History, User, Calendar, Activity, Info } from 'lucide-react';
import { adminAuditLogsAPI } from '@/services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  userId: string;
  user?: { id: string; firstName: string; lastName: string };
  action: string;
  resource: string;
  resourceId: string;
  data: any;
  changes: any;
  ip: string;
  userAgent: string;
  createdAt: string;
}

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    resource: '',
    action: '',
    userId: '',
    dateFrom: '',
    dateTo: '',
  });

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await adminAuditLogsAPI.getAuditLogs(filters);
      setLogs(response.data);
    } catch (error) {
      toast.error('Failed to fetch audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    fetchLogs();
  };

  const resetFilters = () => {
    setFilters({
      resource: '',
      action: '',
      userId: '',
      dateFrom: '',
      dateTo: '',
    });
    // We need to fetch after state updates, but setFilters is async. 
    // Usually, we'd use another useEffect or just call fetch with the reset object.
    setIsLoading(true);
    adminAuditLogsAPI.getAuditLogs({}).then(res => {
      setLogs(res.data);
      setIsLoading(false);
    });
  };

  const renderChanges = (changes: any) => {
    if (!changes) return <span className="text-gray-400">No changes</span>;
    
    // If it's the specific format { before, after }
    if (changes.before || changes.after) {
      return (
        <div className="text-xs space-y-1">
          {changes.before && (
            <div className="flex gap-1">
              <span className="font-semibold text-red-600">Before:</span>
              <pre className="inline text-gray-600 font-mono">{JSON.stringify(changes.before, null, 1)}</pre>
            </div>
          )}
          {changes.after && (
            <div className="flex gap-1">
              <span className="font-semibold text-green-600">After:</span>
              <pre className="inline text-gray-800 font-mono bg-green-50 px-1 rounded">{JSON.stringify(changes.after, null, 1)}</pre>
            </div>
          )}
        </div>
      );
    }

    return <pre className="text-xs text-gray-600 font-mono">{JSON.stringify(changes, null, 1)}</pre>;
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <History className="text-[#CBFF38]" /> System Audit Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tracking administrative changes, financial modifications, and appointment status edits
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Resource</label>
            <select
              name="resource"
              value={filters.resource}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CBFF38]"
            >
              <option value="">All Resources</option>
              <option value="appointments">Appointments</option>
              <option value="payments">Payments</option>
              <option value="gift_cards">Gift Cards</option>
              <option value="leads">Leads / CRM</option>
              <option value="users">Users</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Action</label>
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CBFF38]"
            >
              <option value="">All Actions</option>
              <option value="APPOINTMENT_STATUS_CHANGE">Status Change</option>
              <option value="APPOINTMENT_COMPLETE_WITH_PAYMENT">Completion & Payment</option>
              <option value="APPOINTMENT_PAYMENT_RECORD">Payment Recorded</option>
              <option value="PAYMENT_REFUND">Payment Refund</option>
              <option value="PAYMENT_VOID">Payment Void</option>
              <option value="GIFT_CARD_REDEEM">Gift Card Redeem</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Date From</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CBFF38]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Date To</label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CBFF38]"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={applyFilters}
              className="flex-1 bg-[#0B1120] text-white px-4 py-2 font-bold rounded-xl hover:bg-black transition-all"
            >
              Filter
            </button>
            <button
              onClick={resetFilters}
              className="flex-1 bg-gray-100 text-gray-600 px-4 py-2 font-bold rounded-xl hover:bg-gray-200 transition-all"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Timestamp</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">User</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Action</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Resource</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Changes / Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <History size={48} className="text-gray-200 mb-4" />
                      <p className="font-medium">No audit logs found matching the criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {format(new Date(log.createdAt), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {format(new Date(log.createdAt), 'HH:mm:ss')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                          <User size={14} />
                        </div>
                        <div className="text-sm text-gray-700 font-bold">
                          {log.user ? `${log.user.firstName} ${log.user.lastName}` : (log.userId ? log.userId.substring(0, 8) + '...' : 'System')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        log.action.includes('PAYMENT') || log.action.includes('REFUND')
                          ? 'bg-green-100 text-green-700'
                          : log.action.includes('STATUS') 
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 flex items-center gap-1.5 capitalize">
                        {log.resource}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        {log.resourceId}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {renderChanges(log.changes)}
                      {log.data && (
                        <div className="mt-2 text-[10px] text-gray-400 bg-gray-50 p-2 rounded">
                          <div className="flex items-center gap-1 mb-1 font-semibold">
                            <Info size={10} /> Metadata
                          </div>
                          {JSON.stringify(log.data)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
