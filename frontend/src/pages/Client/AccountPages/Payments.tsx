import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { css } from "@emotion/css";
import { User, ChevronRight, CreditCard, Building2, Receipt, Search, ArrowRight, Wallet, History } from "lucide-react";
import { paymentsAPI } from "@/services/api";
import { format } from "date-fns";
import { motion } from "framer-motion";

// Use the ultra-premium elite aesthetic hero image
import HeroBg from "@/assets/Elite_Aesthetic_Hero.png";

const sectionStyles = css`
  min-height: 100vh;
  background: radial-gradient(circle at top right, rgba(203, 255, 56, 0.05), transparent), #FFFFFF;
`;

const heroSection = css`
  position: relative;
  height: 520px;
  width: 100%;
  display: flex;
  align-items: center;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 30%, transparent 60%);
    z-index: 1;
  }

  @media (max-width: 768px) {
    height: 400px;
    &::after {
        background: linear-gradient(to top, rgba(255,255,255,1) 0%, transparent 100%);
    }
  }
`;

const glassCard = css`
  background: white;
  border-radius: 40px;
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.03);
  border: 1px solid #F1F5F9;
  width: 100%;
  max-width: 1100px;
  margin: -140px auto 60px;
  position: relative;
  z-index: 10;
  overflow: hidden;
`;

const statItem = css`
  padding: 32px;
  background: #F8FAFC;
  border-radius: 24px;
  border: 1px solid #F1F5F9;
  transition: all 0.3s ease;
  
  &:hover {
    background: white;
    box-shadow: 0 10px 30px rgba(0,0,0,0.02);
    border-color: #CBFF38;
  }
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
            {/* Immersive Hero */}
            <div className={heroSection}>
                <div className="absolute inset-0 z-0">
                    <img
                        src={HeroBg}
                        className="w-full h-full object-cover object-center"
                        alt="Billing Hero"
                    />
                </div>

                <div className="container mx-auto px-8 relative z-10">
                    <div className="max-w-4xl">
                        <div className="flex items-center gap-3 mb-6 text-gray-400 text-[11px] font-black uppercase tracking-[0.2em] italic">
                            <Link to="/my-account" className="text-gray-900 border-b border-gray-900 pb-0.5">ACCOUNT</Link>
                            <ChevronRight size={12} className="text-lime-500" />
                            <span className="text-lime-500">BILLING & FINANCE</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tighter leading-none text-gray-900 whitespace-nowrap">
                            PAYMENTS & <span className="text-[#CBFF38]">INVOICES</span>
                        </h1>

                        <p className="text-gray-500 mt-6 font-bold text-lg max-w-lg leading-relaxed italic">
                            Your complete financial history across all clinics and treatments. Track every deposit and transaction.
                        </p>

                        {/* Summary Quick Stats */}
                        <div className="flex flex-wrap gap-4 mt-10">
                            <div className="bg-white/80 backdrop-blur px-6 py-4 rounded-2xl border border-white/20 shadow-xl shadow-black/5">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Spent</p>
                                <p className="text-2xl font-black text-gray-900 tabular-nums">€{totalSpend.toFixed(2)}</p>
                            </div>
                            <div className="bg-white/80 backdrop-blur px-6 py-4 rounded-2xl border border-white/20 shadow-xl shadow-black/5">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Transactions</p>
                                <p className="text-2xl font-black text-gray-900 tabular-nums">{payments.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={glassCard}
                >
                    <div className="p-10 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                        <div className="flex items-center gap-6">
                            <div className="size-16 rounded-[20px] bg-black flex items-center justify-center text-[#CBFF38] shadow-2xl">
                                <History size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase italic text-gray-900 tracking-tight">Financial Ledger</h3>
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Transaction History & Verification</p>
                            </div>
                        </div>
                        <Receipt className="text-gray-200" size={40} />
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center py-32 gap-6">
                            <div className="size-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-gray-400 font-black text-[11px] uppercase tracking-[0.2em] italic">Syncing global ledger...</p>
                        </div>
                    ) : payments.length > 0 ? (
                        <div className="divide-y divide-gray-100/60">
                            {payments.map((payment, i) => (
                                <motion.div
                                    key={payment.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-center justify-between px-10 py-8 hover:bg-gray-50/80 transition-all group"
                                >
                                    <div className="flex items-center gap-8">
                                        <div className={`size-16 rounded-2xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110 duration-300 ${payment.type === 'refund' ? 'bg-orange-50 text-orange-500' : 'bg-[#CBFF38]/20 text-black'}`}>
                                            {payment.method === "cash" ? <Wallet size={24} /> : <CreditCard size={24} />}
                                        </div>
                                        <div>
                                            <p className="font-black text-xl text-gray-900 tracking-tight leading-none italic uppercase">
                                                {payment.appointment?.service?.treatment?.name || payment.notes || "Treatment Payment"}
                                            </p>
                                            <div className="flex items-center gap-4 mt-3">
                                                <span className="flex items-center gap-2 text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">
                                                    <Building2 size={12} className="text-lime-500" /> {payment.clinic?.name || "Clinic"}
                                                </span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                                                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">
                                                    {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-black text-2xl tabular-nums tracking-tighter ${payment.type === 'refund' ? 'text-orange-500' : 'text-gray-900'}`}>
                                            {payment.type === 'refund' ? '-' : ''}€{Number(payment.amount).toFixed(2)}
                                        </p>
                                        <span className={`mt-2 px-4 py-1.5 rounded-xl uppercase font-black text-[9px] tracking-[0.15em] border ${payment.status === 'completed'
                                                ? 'bg-lime-500/10 text-lime-700 border-lime-500/20'
                                                : 'bg-orange-50 text-orange-700 border-orange-100'
                                            }`}>
                                            {payment.status}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-32 px-10">
                            <CreditCard className="size-20 mx-auto mb-8 text-gray-100" />
                            <h4 className="text-3xl font-black uppercase italic text-gray-900 mb-3 tracking-tighter">No Transactions Yet</h4>
                            <p className="text-gray-400 max-w-sm mx-auto text-base font-bold italic leading-relaxed">
                                Once you complete a treatment or make a deposit, your financial record will be updated here.
                            </p>
                            <Link to="/search" className="inline-flex items-center gap-3 mt-10 bg-black text-[#CBFF38] px-10 h-16 rounded-[20px] font-black uppercase text-xs tracking-[0.2em] hover:bg-[#CBFF38] hover:text-black transition-all shadow-2xl">
                                Discover Treatments <ArrowRight size={18} />
                            </Link>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};
