import React, { useEffect, useState } from 'react';
import { DollarSign, Download, Filter } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPaymentsLedger } from '@/store/slices/adminSlice';
import type { AppDispatch, RootState } from '@/store';

export const Payments: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { paymentsLedger, isLoading } = useSelector((state: RootState) => state.admin);

    const [typeFilter, setTypeFilter] = useState('All Types');
    const [dateFilter, setDateFilter] = useState('');

    useEffect(() => {
        dispatch(fetchPaymentsLedger({ type: typeFilter, date: dateFilter }));
    }, [dispatch, typeFilter, dateFilter]);

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setTypeFilter(e.target.value);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateFilter(e.target.value);
    };

    return (
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Payments & Turnover</h1>
                    <p className="text-sm text-gray-500 mt-1">Audit all payment events, turnover calculations, and issues</p>
                </div>
                <button className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2 font-bold rounded-lg hover:bg-gray-50 transition-colors">
                    <Download className="w-5 h-5" /> Export Ledger
                </button>
            </div>

            <div className="bg-white rounded-xl shadow border border-gray-100 flex flex-col min-h-[400px] overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 shrink-0">
                        <DollarSign className="w-5 h-5 text-green-600" /> Transaction Ledger
                    </h3>

                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-48">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                value={typeFilter}
                                onChange={handleTypeChange}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg outline-none appearance-none bg-gray-50 text-sm"
                            >
                                <option>All Types</option>
                                <option>Appointment (Prepaid)</option>
                                <option>Gift Card</option>
                                <option>Refund</option>
                            </select>
                        </div>
                        <div className="relative flex-1 md:w-48">
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={handleDateChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-gray-50 text-sm focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto flex-1">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type / Notes</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paymentsLedger?.map((txn, index) => (
                                <tr key={txn.id || index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(txn.date).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                        <span className={`block font-medium ${txn.type === 'gift_card' ? 'text-purple-600' : 'text-blue-600'}`}>
                                            {txn.type === 'appointment' ? 'Appointment' : 'Gift Card'}
                                        </span>
                                        <span className="text-xs text-gray-500 block truncate">{txn.description || 'No description'}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {txn.user ? `${txn.user.firstName} ${txn.user.lastName}` : 'Guest/Unknown'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                        {txn.method || 'System'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        €{Number(txn.amount).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${txn.status === 'completed' || txn.status === 'confirmed'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {txn.status || 'Processed'}
                                        </span>
                                    </td>
                                </tr>
                            ))}

                            {(!paymentsLedger || paymentsLedger.length === 0) && !isLoading && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-sm text-gray-500 border-none">
                                        <div className="flex flex-col items-center justify-center text-gray-400 font-medium h-full">
                                            <DollarSign className="w-8 h-8 mb-2 opacity-50" />
                                            No transactions matched the current filters.
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
