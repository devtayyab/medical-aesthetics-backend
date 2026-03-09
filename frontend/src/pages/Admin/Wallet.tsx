import React, { useEffect } from 'react';
import { CreditCard, History, Award } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWalletSummary, fetchRecentTransactions } from '@/store/slices/adminSlice';
import type { AppDispatch, RootState } from '@/store';

export const Wallet: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { walletSummary, recentTransactions, isLoading } = useSelector(
        (state: RootState) => state.admin
    );

    useEffect(() => {
        dispatch(fetchWalletSummary());
        dispatch(fetchRecentTransactions());
    }, [dispatch]);

    return (
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Loyalty & Wallet Management</h1>
                <p className="text-sm text-gray-500 mt-1">Manage consumer wallets, loyalty points, and redemptions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow p-6 border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                        <Award className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Points Issued</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {isLoading ? '...' : walletSummary?.totalPointsIssued?.toLocaleString() || 0}
                        </p>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow p-6 border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Euro Value</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {isLoading ? '...' : `€${(walletSummary?.totalEuroValueIssued || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        </p>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow p-6 border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <History className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Points Redeemed</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {isLoading ? '...' : walletSummary?.totalPointsRedeemed?.toLocaleString() || 0}
                        </p>
                    </div>
                </div>
            </div>

            {/* Wallet History Table */}
            <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">Recent Wallet Transactions</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consumer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Euro Value</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recentTransactions?.map((tx: any) => {
                                const isEarned = tx.transactionType === 'earned';
                                const sign = isEarned ? '+' : '-';
                                const color = isEarned ? 'text-green-600' : 'text-red-600';
                                const euroValue = (Math.abs(tx.points) * 0.01).toFixed(2);

                                return (
                                    <tr key={tx.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(tx.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {(tx.client?.firstName && tx.client?.lastName) ? `${tx.client.firstName} ${tx.client.lastName}` : tx.client?.email || 'Unknown Client'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {tx.description}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${color}`}>
                                            {sign} {Math.abs(tx.points)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                            {sign} €{euroValue}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Processed
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {(!recentTransactions || recentTransactions.length === 0) && !isLoading && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                                        No transactions found.
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
