import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { css } from "@emotion/css";
import LayeredBG from "@/assets/LayeredBg.svg";
import { FaChevronRight, FaRegCreditCard, FaMoneyBillWave } from "react-icons/fa6";
import { Card } from "@/components/atoms/Card/Card";
import { bookingAPI } from "@/services/api";

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
  padding: 16px;
  border-bottom: 1px solid #eee;
  &:last-child {
    border-bottom: none;
  }
`;

export const Payments: React.FC = () => {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const response = await bookingAPI.getUserAppointments();
                // Filter appointments that have payment info (either advance or total)
                const paidAppointments = response.data.filter((apt: any) =>
                    (apt.totalAmount > 0 || apt.advancePaymentAmount > 0)
                ).map((apt: any) => ({
                    id: apt.id,
                    amount: apt.totalAmount || apt.advancePaymentAmount,
                    date: new Date(apt.startTime).toLocaleDateString(),
                    method: apt.paymentMethod || "Electronic",
                    type: apt.paymentMethod === "Cash" ? "On-site" : "Electronic",
                    status: apt.status === "COMPLETED" ? "Paid" : "Pending",
                    treatment: apt.serviceName || "Treatment"
                }));
                setPayments(paidAppointments);
            } catch (err) {
                console.error("Failed to fetch payments:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPayments();
    }, []);

    return (
        <section
            className="relative bg-cover bg-center flex items-center justify-center px-4 py-[60px]"
            style={{
                backgroundImage: `url(${LayeredBG})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
            }}
        >
            <div className={containerStyle}>
                {/* Breadcrumb */}
                <div className="flex items-center text-[#33373F] text-[15px] font-medium mb-1">
                    <Link to="/my-account" className="hover:text-[#405C0B] transition-colors">Account</Link>
                    <span className="px-3">
                        <FaChevronRight size={11} className="pt-[1px] text-[#767676]" />
                    </span>
                    Payments
                </div>

                {/* Title */}
                <h2 className="text-[#33373F] text-[30px] font-semibold mb-8">
                    Payment Records
                </h2>

                <Card className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900">History</h3>
                        <p className="text-gray-500 text-sm">View all your electronic and cash payments</p>
                    </div>

                    <div className="space-y-2">
                        {loading ? (
                            <div className="flex flex-col items-center py-12 gap-3">
                                <div className="size-8 border-4 border-lime-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-gray-500 animate-pulse">Loading payment records...</p>
                            </div>
                        ) : payments.length > 0 ? (
                            payments.map((payment) => (
                                <div key={payment.id} className={paymentItemStyle}>
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600">
                                            {payment.method === "Cash" ? <FaMoneyBillWave /> : <FaRegCreditCard />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{payment.treatment}</p>
                                            <p className="text-sm text-gray-500">{payment.date} • {payment.type}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-lime-700">£{payment.amount}</p>
                                        <span className="text-[10px] px-2 py-0.5 bg-lime-100 text-lime-800 rounded-full uppercase font-bold">
                                            {payment.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center py-10 text-gray-500 italic">No payment records found.</p>
                        )}
                    </div>
                </Card>
            </div>
        </section>
    );
};
