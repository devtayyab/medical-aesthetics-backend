import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { css } from "@emotion/css";
import LayeredBG from "@/assets/LayeredBg.svg";
import { FaChevronRight, FaRegCreditCard, FaMoneyBillWave, FaBuilding } from "react-icons/fa6";
import { Card } from "@/components/atoms/Card/Card";
import { paymentsAPI } from "@/services/api";
import { format } from "date-fns";

const containerStyle = css`
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px;
`;

const paymentItemStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.2s;
  &:hover {
    background: #f9fafb;
  }
  &:last-child {
    border-bottom: none;
  }
`;

export const Payments: React.FC = () => {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWallet = async () => {
            try {
                const response = await paymentsAPI.getMyWallet({ limit: 50 });
                // Response is { items, total }
                setPayments(response.data.items || []);
            } catch (err) {
                console.error("Failed to fetch wallet:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchWallet();
    }, []);

    return (
        <section
            className="relative bg-cover bg-center flex items-center justify-center px-4 py-[60px] min-h-[80vh]"
            style={{
                backgroundImage: `url(${LayeredBG})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
            }}
        >
            <div className={containerStyle}>
                {/* Breadcrumb */}
                <div className="flex items-center text-[#33373F] text-[15px] font-medium mb-1 translate-y-[-10px]">
                    <Link to="/my-account" className="hover:text-[#405C0B] transition-colors">Account</Link>
                    <span className="px-3">
                        <FaChevronRight size={11} className="pt-[1px] text-[#767676]" />
                    </span>
                    Wallet & Payments
                </div>

                {/* Title */}
                <h2 className="text-[#33373F] text-[36px] font-black mb-8 tracking-tight">
                    Wallet & Payments
                </h2>

                <Card className="bg-white/80 backdrop-blur-md p-8 rounded-[32px] shadow-2xl border border-white/20">
                    <div className="mb-10 flex justify-between items-end">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 mb-1">Transaction History</h3>
                            <p className="text-gray-500 text-sm font-medium">View all your clinic payments, deposits, and refunds.</p>
                        </div>
                        <div className="bg-[#405C0B]/5 px-4 py-2 rounded-2xl border border-[#405C0B]/10">
                            <span className="text-[10px] uppercase font-bold text-[#405C0B] block tracking-widest mb-1">Total Impact</span>
                            <span className="text-xl font-black text-[#405C0B]">€{payments.reduce((acc, p) => acc + (p.type === 'payment' ? Number(p.amount) : -Number(p.amount)), 0).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        {loading ? (
                            <div className="flex flex-col items-center py-24 gap-4">
                                <div className="size-10 border-4 border-[#405C0B] border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-[#405C0B] font-bold animate-pulse text-sm uppercase tracking-tighter">Syncing your financial history...</p>
                            </div>
                        ) : payments.length > 0 ? (
                            payments.map((payment) => (
                                <div key={payment.id} className={paymentItemStyle}>
                                    <div className="flex items-center gap-5">
                                        <div className={`size-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${payment.type === 'refund' ? 'bg-orange-50 text-orange-600' : 'bg-lime-50 text-lime-700'
                                            }`}>
                                            {payment.method === "cash" ? <FaMoneyBillWave /> : <FaRegCreditCard />}
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 text-base leading-tight">
                                                {payment.appointment?.service?.treatment?.name || payment.notes || "Treatment Payment"}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="flex items-center gap-1.5 text-xs text-gray-400 font-bold uppercase">
                                                    <FaBuilding className="size-3" /> {payment.clinic?.name || "Clinic"}
                                                </span>
                                                <span className="text-gray-200">•</span>
                                                <span className="text-xs text-gray-400 font-bold uppercase">
                                                    {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-black text-lg ${payment.type === 'refund' ? 'text-orange-600' : 'text-[#405C0B]'
                                            }`}>
                                            {payment.type === 'refund' ? '-' : ''}€{Number(payment.amount).toFixed(2)}
                                        </p>
                                        <span className={`text-[10px] px-2.5 py-1 rounded-full uppercase font-black tracking-tighter shadow-sm border ${payment.status === 'completed'
                                                ? 'bg-lime-100 text-lime-800 border-lime-200'
                                                : 'bg-orange-100 text-orange-800 border-orange-200'
                                            }`}>
                                            {payment.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 px-8 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                                <FaRegCreditCard className="size-16 mx-auto mb-4 text-gray-200" />
                                <h4 className="text-xl font-bold text-gray-900 mb-2">No Transactions Yet</h4>
                                <p className="text-gray-500 max-w-[280px] mx-auto text-sm">Once you make a payment for a booking or treatment, it will appear here in your ledger.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </section>
    );
};
