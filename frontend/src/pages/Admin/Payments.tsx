import React, { useEffect, useState } from 'react';
import { Euro, Download, RotateCcw, XCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPaymentsLedger, fetchAdminClinics, fetchUsers } from '@/store/slices/adminSlice';
import { adminAPI } from '@/services/api';
import type { AppDispatch, RootState } from '@/store';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export const Payments: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { paymentsLedger, clinics, users, isLoading } = useSelector((state: RootState) => state.admin);

    const [filters, setFilters] = useState({
        clinicId: '',
        providerId: '',
        salespersonId: '',
        date: '',
        method: '',
        limit: 50,
        offset: 0
    });

    const [isActioning, setIsActioning] = useState<string | null>(null);

    useEffect(() => {
        dispatch(fetchAdminClinics());
        dispatch(fetchUsers());
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchPaymentsLedger(filters));
    }, [dispatch, filters]);

    const doctors = users.filter(u => u.role === 'doctor');
    const salespeople = users.filter(u => u.role === 'salesperson');

    const handleFilterChange = (name: string, value: string) => {
        setFilters(prev => ({ ...prev, [name]: value, offset: 0 }));
    };

    const handleAction = async (id: string, action: 'refund' | 'void') => {
        const notes = window.prompt(`Enter reason for ${action}:`);
        if (notes === null) return;

        setIsActioning(id);
        try {
            if (action === 'refund') {
                await adminAPI.refundPayment(id, notes);
                toast.success('Refund processed successfully');
            } else {
                await adminAPI.voidPayment(id, notes);
                toast.success('Payment voided successfully');
            }
            dispatch(fetchPaymentsLedger(filters));
        } catch (err: any) {
            toast.error(err.response?.data?.message || `Failed to ${action}`);
        } finally {
            setIsActioning(null);
        }
    };

    // Use items from ledger (assuming backend returns { items, total })
    const transactions = (paymentsLedger as any)?.items || [];
    const totalCount = (paymentsLedger as any)?.total || 0;

    return (
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Payments & Financial Control</h1>
                    <p className="text-sm text-gray-500 mt-1">Audit transactions, manage refunds, and track clinic turnover</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-4 py-2.5 font-semibold rounded-xl hover:bg-gray-50 shadow-sm transition-all text-sm">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                    <button className="flex items-center gap-2 bg-[#405C0B] text-white px-5 py-2.5 font-semibold rounded-xl hover:bg-[#304608] shadow-md transition-all text-sm">
                        <Euro className="w-4 h-4" /> New Manual Record
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Clinic</label>
                    <select
                        value={filters.clinicId}
                        onChange={(e) => handleFilterChange('clinicId', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#405C0B] transition-all"
                    >
                        <option value="">All Clinics</option>
                        {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Doctor / Provider</label>
                    <select
                        value={filters.providerId}
                        onChange={(e) => handleFilterChange('providerId', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#405C0B] transition-all"
                    >
                        <option value="">All Providers</option>
                        {doctors.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
                    </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Salesperson</label>
                    <select
                        value={filters.salespersonId}
                        onChange={(e) => handleFilterChange('salespersonId', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#405C0B] transition-all"
                    >
                        <option value="">All Salespersons</option>
                        {salespeople.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                    </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Method</label>
                    <select
                        value={filters.method}
                        onChange={(e) => handleFilterChange('method', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#405C0B] transition-all"
                    >
                        <option value="">All Methods</option>
                        <option value="cash">Cash</option>
                        <option value="pos">POS / Card</option>
                        <option value="viva_wallet">Viva Wallet</option>
                        <option value="online_deposit">Online Deposit</option>
                    </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Date</label>
                    <input
                        type="date"
                        value={filters.date}
                        onChange={(e) => handleFilterChange('date', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-[#405C0B] transition-all"
                    />
                </div>
                <button
                    onClick={() => setFilters({ clinicId: '', providerId: '', salespersonId: '', date: '', method: '', limit: 50, offset: 0 })}
                    className="h-[42px] px-4 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-all text-sm font-medium"
                >
                    Reset
                </button>
            </div>

            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Transaction Date</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Client & Provider</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Type / Description</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Method</th>
                                <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <Loader2 className="w-8 h-8 text-[#405C0B] animate-spin" />
                                            <p className="text-gray-400 font-medium">Loading ledger records...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : transactions.length > 0 ? (
                                transactions.map((txn: any) => (
                                    <tr key={txn.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">{format(new Date(txn.createdAt), 'MMM dd, yyyy')}</div>
                                            <div className="text-[11px] text-gray-400 font-medium font-mono uppercase">{format(new Date(txn.createdAt), 'HH:mm')}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-sm font-bold text-gray-900">
                                                {txn.client ? `${txn.client.firstName} ${txn.client.lastName}` : 'Guest'}
                                            </div>
                                            <div className="text-xs text-gray-500 font-medium">
                                                By: {txn.provider ? `${txn.provider.firstName} ${txn.provider.lastName}` : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className={`text-[10px] inline-flex font-black uppercase tracking-widest px-2 py-0.5 rounded-md mb-1 ${txn.type === 'refund' || txn.type === 'void' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {txn.type}
                                            </div>
                                            <div className="text-xs text-gray-600 font-medium max-w-[200px] truncate" title={txn.notes}>
                                                {txn.appointment?.service?.treatment?.name || txn.notes || 'No description'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="size-2 rounded-full bg-gray-300"></div>
                                                <span className="text-xs font-bold text-gray-700 uppercase">{txn.method.replace('_', ' ')}</span>
                                            </div>
                                            {txn.transactionReference && (
                                                <div className="text-[10px] text-gray-400 mt-1 truncate max-w-[100px] font-mono">#{txn.transactionReference}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-full shadow-sm ${txn.status === 'completed'
                                                    ? 'bg-green-100 text-green-700 shadow-green-100/50'
                                                    : txn.status === 'refunded' || txn.status === 'voided'
                                                        ? 'bg-orange-100 text-orange-700 shadow-orange-100/50'
                                                        : 'bg-red-100 text-red-700 shadow-red-100/50'
                                                }`}>
                                                {txn.status}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-5 whitespace-nowrap text-right font-black text-sm ${txn.type === 'refund' || txn.type === 'void' ? 'text-orange-600' : 'text-gray-900'
                                            }`}>
                                            {txn.type === 'refund' || txn.type === 'void' ? '-' : ''}€{Number(txn.amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-center">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {txn.status === 'completed' && txn.type === 'payment' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(txn.id, 'refund')}
                                                            disabled={isActioning === txn.id}
                                                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                                            title="Refund Transaction"
                                                        >
                                                            {isActioning === txn.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(txn.id, 'void')}
                                                            disabled={isActioning === txn.id}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Void Transaction"
                                                        >
                                                            {isActioning === txn.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center text-sm text-gray-500 border-none">
                                        <div className="flex flex-col items-center justify-center text-gray-400 font-medium h-full">
                                            <Euro className="w-12 h-12 mb-3 opacity-20 text-gray-400" />
                                            No financial records found matching these filters.
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Placeholder */}
                {totalCount > filters.limit && (
                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-500 font-medium">Showing {filters.offset + 1} to {Math.min(filters.offset + filters.limit, totalCount)} of {totalCount} transactions</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleFilterChange('offset', (filters.offset - filters.limit).toString())}
                                disabled={filters.offset === 0}
                                className="p-2 border border-gray-200 rounded-lg bg-white disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleFilterChange('offset', (filters.offset + filters.limit).toString())}
                                disabled={filters.offset + filters.limit >= totalCount}
                                className="p-2 border border-gray-200 rounded-lg bg-white disabled:opacity-50"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
