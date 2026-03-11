import React, { useEffect, useState } from 'react';
import { Gift, Search, Plus } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGiftCardsSummary, fetchGiftCards, generateGiftCard, redeemGiftCardThunk } from '@/store/slices/adminSlice';
import type { AppDispatch, RootState } from '@/store';
import { toast } from 'react-hot-toast';

export const GiftCards: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { giftCards, giftCardsSummary, isLoading } = useSelector((state: RootState) => state.admin);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [recipientEmail, setRecipientEmail] = useState('');

    const [showRedeemModal, setShowRedeemModal] = useState(false);
    const [redeemCode, setRedeemCode] = useState('');
    const [redeemAmount, setRedeemAmount] = useState('');

    useEffect(() => {
        dispatch(fetchGiftCardsSummary());
        dispatch(fetchGiftCards(''));
    }, [dispatch]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        // Basic debounce could be implemented here
        if (value.length > 2 || value.length === 0) {
            dispatch(fetchGiftCards(value));
        }
    };

    const handleGenerate = () => {
        if (amount && !isNaN(Number(amount))) {
            dispatch(generateGiftCard({
                amount: Number(amount),
                recipientEmail: recipientEmail || undefined
            }));
            setShowModal(false);
            setAmount('');
            setRecipientEmail('');
        }
    };

    const handleRedeem = async () => {
        if (!redeemCode.trim()) return toast.error("Please enter a gift card code.");
        if (!redeemAmount || isNaN(Number(redeemAmount))) return toast.error("Please enter a valid amount to redeem.");

        try {
            await dispatch(redeemGiftCardThunk({ code: redeemCode.trim(), amount: Number(redeemAmount) })).unwrap();
            toast.success("Gift card redeemed successfully!");
            setShowRedeemModal(false);
            setRedeemCode('');
            setRedeemAmount('');
        } catch (error: any) {
             toast.error(error?.message || "Failed to redeem gift card.");
        }
    };

    return (
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gift Cards</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage global gift cards, purchases, and redemption status</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowRedeemModal(true)}
                        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-900 px-4 py-2 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Redeem Card
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-[#CBFF38] text-[#0B1120] px-4 py-2 font-bold rounded-lg hover:bg-[#A3D900] transition-colors"
                    >
                        <Plus className="w-5 h-5" /> Generate Gift Card
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow p-6 border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Active Cards</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {isLoading ? '...' : giftCardsSummary?.activeCards || 0}
                        </p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Gift className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow p-6 border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Total Liability</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {isLoading ? '...' : `€${(giftCardsSummary?.totalLiability || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        </p>
                    </div>
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                        <Gift className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow p-6 border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Total Redeemed</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {isLoading ? '...' : `€${((giftCardsSummary as any)?.totalRedeemed || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        </p>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <Gift className="w-6 h-6" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">Issued Gift Cards</h3>
                        <p className="text-sm text-gray-500">List of all gift cards created and sold.</p>
                    </div>
                    <div className="flex border border-gray-200 rounded-lg overflow-hidden max-w-md w-72">
                        <div className="bg-gray-50 px-3 flex items-center border-r border-gray-200">
                            <Search className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search code or buyer..."
                            className="w-full px-4 py-2 outline-none"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer / Recipient</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Original Amount</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {giftCards?.map((card: any) => (
                                <tr key={card.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">
                                        {card.code}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(card.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {card.recipientEmail || (card.user ? `${card.user.firstName} ${card.user.lastName}` : 'Anonymous')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                        €{Number(card.amount).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                        €{Number(card.balance).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        {card.isActive ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-500">
                                                Inactive
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {(!giftCards || giftCards.length === 0) && !isLoading && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                                        No gift cards found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Generate Gift Card Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Generate Gift Card</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (€)</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. 50"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Email (Optional)</label>
                            <input
                                type="email"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="recipient@example.com"
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave blank if the recipient is unknown or purchasing physically.</p>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={!amount || isNaN(Number(amount))}
                                className="px-4 py-2 bg-[#0B1120] text-white font-bold rounded-lg hover:bg-[#1f2937] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Generate
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Redeem Gift Card Modal */}
            {showRedeemModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Redeem Gift Card</h3>
                            <button onClick={() => setShowRedeemModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gift Card Code</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
                                placeholder="ABCD-1234"
                                value={redeemCode}
                                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Redeem (€)</label>
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. 25.50"
                                value={redeemAmount}
                                onChange={(e) => setRedeemAmount(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowRedeemModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRedeem}
                                disabled={!redeemCode || !redeemAmount || isNaN(Number(redeemAmount))}
                                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Redeem
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
