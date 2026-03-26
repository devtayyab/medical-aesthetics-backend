import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { css } from "@emotion/css";
import { FaChevronRight, FaRegCreditCard, FaMoneyBillWave, FaBuilding, FaReceipt, FaArrowRight } from "react-icons/fa6";
import { paymentsAPI } from "@/services/api";
import { format } from "date-fns";
import { motion } from "framer-motion";

const sectionStyles = css`
  min-height: 100vh;
  background: #FDFDFD;
  background-image: 
    radial-gradient(at 0% 0%, rgba(203, 255, 56, 0.08) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(203, 255, 56, 0.05) 0px, transparent 50%);
  padding-bottom: 80px;
`;

const premiumCard = css`
  background: white;
  border: 1px solid rgba(241, 245, 249, 1);
  border-radius: 32px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.02);
  overflow: hidden;
`;

export const Payments: React.FC = () => {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWallet = async () => {
            try {
                const response = await paymentsAPI.getMyWallet({ limit: 50 });
                setPayments(response.data.items || []);
            } catch (err) {
                console.error("Failed to fetch wallet:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchWallet();
    }, []);

    const totalSpend = payments
        .filter(p => p.type !== 'refund')
        .reduce((acc, p) => acc + Number(p.amount), 0);

    const totalRefunded = payments
        .filter(p => p.type === 'refund')
        .reduce((acc, p) => acc + Number(p.amount), 0);

    return (
        <div className={sectionStyles}>
            {/* Visual Header */}
            <div className="bg-[#1A1A1A] text-white pt-16 pb-28 px-6 relative overflow-hidden">
                <div className="max-w-5xl mx-auto relative z-10">
                    <div className="flex items-center gap-4 mb-4 text-[#CBFF38] text-[10px] font-black uppercase tracking-[0.2em] italic">
                        <Link to="/my-account" className="hover:opacity-80 transition-opacity">Account</Link>
                        <FaChevronRight size={10} />
                        <span>Billing</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-tight">
                        Payments & Invoices
                    </h1>
                    <p className="text-gray-400 mt-2 font-medium max-w-lg">
                        Your complete financial history across all clinics and treatments.
                    </p>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-10">
                        {[
                            { label: "Total Spent", value: `${totalSpend.toFixed(2)}`, color: "text-[#CBFF38]" },
                            { label: "Total Refunded", value: `${totalRefunded.toFixed(2)}`, color: "text-orange-400" },
                            { label: "Transactions", value: payments.length, color: "text-white" },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
                                <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#CBFF38]/10 to-transparent pointer-events-none" />
            </div>

            <div className="max-w-5xl mx-auto px-6 -mt-10 relative z-20">
                <div className={premiumCard}>
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black uppercase italic text-gray-900">Transaction Ledger</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">All payments, deposits & refunds</p>
                        </div>
                        <FaReceipt className="text-gray-200" size={32} />
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center py-24 gap-4">
                            <div className="size-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
                            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest italic">Syncing financial history...</p>
                        </div>
                    ) : payments.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                            {payments.map((payment, i) => (
                                <motion.div
                                    key={payment.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="flex items-center justify-between px-8 py-5 hover:bg-gray-50/50 transition-colors group"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`size-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${payment.type === 'refund' ? 'bg-orange-50 text-orange-500' : 'bg-[#CBFF38]/20 text-black'}`}>
                                            {payment.method === "cash" ? <FaMoneyBillWave /> : <FaRegCreditCard />}
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 leading-tight">
                                                {payment.appointment?.service?.treatment?.name || payment.notes || "Treatment Payment"}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="flex items-center gap-1.5 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                                    <FaBuilding className="size-3" /> {payment.clinic?.name || "Clinic"}
                                                </span>
                                                <span className="text-gray-200">•</span>
                                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                                    {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-4">
                                        <p className={`font-black text-xl tabular-nums ${payment.type === 'refund' ? 'text-orange-500' : 'text-gray-900'}`}>
                                            {payment.type === 'refund' ? '-' : ''}{Number(payment.amount).toFixed(2)}
                                        </p>
                                        <span className={`text-[9px] px-2.5 py-1 rounded-full uppercase font-black tracking-widest border mt-1 inline-block ${
                                            payment.status === 'completed'
                                                ? 'bg-[#CBFF38]/20 text-black border-[#CBFF38]/30'
                                                : 'bg-orange-50 text-orange-700 border-orange-100'
                                        }`}>
                                            {payment.status}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 px-8">
                            <FaRegCreditCard className="size-16 mx-auto mb-6 text-gray-100" />
                            <h4 className="text-2xl font-black uppercase italic text-gray-900 mb-2">No Transactions Yet</h4>
                            <p className="text-gray-400 max-w-xs mx-auto text-sm font-medium">
                                Once you make a payment for a booking or treatment, it will appear here.
                            </p>
                            <Link to="/search" className="inline-flex items-center gap-2 mt-8 bg-black text-[#CBFF38] px-6 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-900 transition-all">
                                Browse Treatments <FaArrowRight />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
