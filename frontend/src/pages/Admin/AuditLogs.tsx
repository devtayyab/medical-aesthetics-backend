import React, { useEffect, useState } from 'react';
import {
  History, User, ChevronDown, ChevronUp,
  RotateCcw, SlidersHorizontal, Calendar,
  AlertCircle, CheckCircle2, CreditCard,
  Shield, Activity, Search,
} from 'lucide-react';
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

/* ─── helpers ─────────────────────────────────────────────── */
const actionMeta = (action: string) => {
  if (action.includes('PAYMENT') || action.includes('REFUND') || action.includes('VOID'))
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', icon: <CreditCard size={11} /> };
  if (action.includes('STATUS'))
    return { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200', icon: <Activity size={11} /> };
  if (action.includes('ERROR') || action.includes('FAILED'))
    return { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-200', icon: <AlertCircle size={11} /> };
  if (action.includes('DELETE') || action.includes('REMOVE'))
    return { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', icon: <Shield size={11} /> };
  return { bg: 'bg-gray-100', text: 'text-gray-600', ring: 'ring-gray-200', icon: <CheckCircle2 size={11} /> };
};

const resourceColor = (resource: string) => {
  const map: Record<string, string> = {
    appointments: 'text-violet-600 bg-violet-50',
    payments:     'text-emerald-600 bg-emerald-50',
    leads:        'text-blue-600 bg-blue-50',
    users:        'text-amber-600 bg-amber-50',
    gift_cards:   'text-pink-600 bg-pink-50',
  };
  return map[resource?.toLowerCase()] ?? 'text-gray-600 bg-gray-100';
};

/* ─── Expandable Changes Cell ────────────────────────────── */
const ChangesCell: React.FC<{ changes: any; data: any }> = ({ changes, data }) => {
  const [open, setOpen] = useState(false);

  if (!changes && !data)
    return <span className="text-xs text-gray-400 italic">No changes</span>;

  const hasBeforeAfter = changes && (changes.before || changes.after);
  const hasData = !!data;

  return (
    <div className="space-y-1.5">
      {hasBeforeAfter && (
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {changes.before && (
            <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-semibold ring-1 ring-red-100">Before</span>
          )}
          {changes.after && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold ring-1 ring-emerald-100">After</span>
          )}
        </div>
      )}

      {(hasBeforeAfter || hasData || changes) && (
        <button
          onClick={() => setOpen(v => !v)}
          className="inline-flex items-center gap-1 text-[11px] text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
        >
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {open ? 'Hide details' : 'View details'}
        </button>
      )}

      {open && (
        <div className="mt-2 space-y-2 text-[11px] font-mono">
          {hasBeforeAfter ? (
            <>
              {changes.before && (
                <div className="rounded-lg bg-red-50 ring-1 ring-red-100 p-2.5">
                  <p className="font-sans font-semibold text-red-500 mb-1 text-[10px] uppercase tracking-wide">Before</p>
                  <pre className="text-red-700 whitespace-pre-wrap break-all leading-relaxed">
                    {JSON.stringify(changes.before, null, 2)}
                  </pre>
                </div>
              )}
              {changes.after && (
                <div className="rounded-lg bg-emerald-50 ring-1 ring-emerald-100 p-2.5">
                  <p className="font-sans font-semibold text-emerald-500 mb-1 text-[10px] uppercase tracking-wide">After</p>
                  <pre className="text-emerald-700 whitespace-pre-wrap break-all leading-relaxed">
                    {JSON.stringify(changes.after, null, 2)}
                  </pre>
                </div>
              )}
            </>
          ) : changes ? (
            <div className="rounded-lg bg-gray-50 ring-1 ring-gray-200 p-2.5">
              <pre className="text-gray-600 whitespace-pre-wrap break-all leading-relaxed">
                {JSON.stringify(changes, null, 2)}
              </pre>
            </div>
          ) : null}

          {hasData && (
            <div className="rounded-lg bg-slate-50 ring-1 ring-slate-200 p-2.5">
              <p className="font-sans font-semibold text-slate-500 mb-1 text-[10px] uppercase tracking-wide">Metadata</p>
              <pre className="text-slate-600 whitespace-pre-wrap break-all leading-relaxed">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Skeleton Row ───────────────────────────────────────── */
const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-gray-50">
    <td className="px-6 py-4">
      <div className="h-3.5 bg-gray-100 rounded-full w-24 mb-2" />
      <div className="h-2.5 bg-gray-50 rounded-full w-16" />
    </td>
    <td className="px-6 py-4"><div className="h-3.5 bg-gray-100 rounded-full w-28" /></td>
    <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-lg w-36" /></td>
    <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-lg w-24" /></td>
    <td className="px-6 py-4"><div className="h-3.5 bg-gray-100 rounded-full w-full" /></td>
  </tr>
);

/* ─── Main Page ──────────────────────────────────────────── */
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

  const fetchLogs = async (overrideFilters?: typeof filters) => {
    try {
      setIsLoading(true);
      const response = await adminAuditLogsAPI.getAuditLogs(overrideFilters ?? filters);
      setLogs(response.data);
    } catch {
      toast.error('Failed to fetch audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    const empty = { resource: '', action: '', userId: '', dateFrom: '', dateTo: '' };
    setFilters(empty);
    fetchLogs(empty);
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0B1120] flex items-center justify-center shadow-lg shadow-black/10 flex-shrink-0">
            <History className="text-[#CBFF38]" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">System Audit Logs</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Administrative changes · Financial edits · Status updates
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-xl ring-1 ring-gray-100">
          <Activity size={13} className="text-[#CBFF38]" />
          <span>{isLoading ? '—' : logs.length} entries loaded</span>
        </div>
      </div>

      {/* ── Filter Bar ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal size={14} className="text-gray-400" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-500">Resource</label>
            <select
              name="resource" value={filters.resource} onChange={handleFilterChange}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CBFF38] focus:border-transparent transition-all"
            >
              <option value="">All Resources</option>
              <option value="appointments">Appointments</option>
              <option value="payments">Payments</option>
              <option value="gift_cards">Gift Cards</option>
              <option value="leads">Leads / CRM</option>
              <option value="users">Users</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-500">Action</label>
            <select
              name="action" value={filters.action} onChange={handleFilterChange}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CBFF38] focus:border-transparent transition-all"
            >
              <option value="">All Actions</option>
              <option value="APPOINTMENT_STATUS_CHANGE">Status Change</option>
              <option value="APPOINTMENT_COMPLETE_WITH_PAYMENT">Completion &amp; Payment</option>
              <option value="APPOINTMENT_PAYMENT_RECORD">Payment Recorded</option>
              <option value="PAYMENT_REFUND">Payment Refund</option>
              <option value="PAYMENT_VOID">Payment Void</option>
              <option value="GIFT_CARD_REDEEM">Gift Card Redeem</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-medium text-gray-500">
              <Calendar size={11} /> Date From
            </label>
            <input
              type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CBFF38] focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-xs font-medium text-gray-500">
              <Calendar size={11} /> Date To
            </label>
            <input
              type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CBFF38] focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => fetchLogs()}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#0B1120] text-white px-4 py-2.5 text-sm font-semibold rounded-xl hover:bg-black active:scale-95 transition-all"
            >
              <Search size={14} /> Filter
            </button>
            <button
              onClick={resetFilters} title="Reset filters"
              className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
            >
              <RotateCcw size={15} />
            </button>
          </div>

        </div>
      </div>

      {/* ── Table ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Timestamp</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Resource</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider min-w-[240px]">Changes / Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-gray-50 ring-1 ring-gray-100 flex items-center justify-center">
                        <History size={28} className="text-gray-300" />
                      </div>
                      <p className="text-sm font-semibold text-gray-400">No audit logs found</p>
                      <p className="text-xs text-gray-300">Try adjusting the filters above</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const meta = actionMeta(log.action);
                  const resColor = resourceColor(log.resource);
                  const userName = log.user
                    ? `${log.user.firstName} ${log.user.lastName}`
                    : log.userId
                    ? log.userId.substring(0, 8) + '…'
                    : 'System';
                  const isSystem = !log.user && !log.userId;

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">

                      {/* Timestamp */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-800">
                          {format(new Date(log.createdAt), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5 font-mono">
                          {format(new Date(log.createdAt), 'HH:mm:ss')}
                        </div>
                      </td>

                      {/* User */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isSystem ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'}`}>
                            <User size={14} />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                            {userName}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ring-1 ${meta.bg} ${meta.text} ${meta.ring}`}>
                          {meta.icon}
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Resource */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${resColor}`}>
                          {log.resource}
                        </span>
                        {log.resourceId && (
                          <div className="text-[10px] text-gray-300 font-mono mt-1 max-w-[130px] truncate" title={log.resourceId}>
                            {log.resourceId}
                          </div>
                        )}
                      </td>

                      {/* Changes */}
                      <td className="px-6 py-4">
                        <ChangesCell changes={log.changes} data={log.data} />
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!isLoading && logs.length > 0 && (
          <div className="px-6 py-3.5 border-t border-gray-50 bg-gray-50/50">
            <span className="text-xs text-gray-400">
              Showing <span className="font-semibold text-gray-600">{logs.length}</span> log entries
            </span>
          </div>
        )}
      </div>

    </div>
  );
};
