import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { css } from "@emotion/css";
import { User, ChevronRight, ChevronLeft, CreditCard, Building2, Receipt, Search, ArrowRight, Wallet, History, Gift, X, Sparkles } from "lucide-react";
import { paymentsAPI, bookingAPI } from "@/services/api";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// Use the ultra-premium elite aesthetic hero image
import HeroBg from "@/assets/Payments_Hero.png";

const sectionStyles = css`
  min-height: 100vh;
  background: #F8FAFC;
`;

const glassCard = css`
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 28px;
  box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02), inset 0 1px 1px rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.85);
  width: 100%;
  max-width: 1100px;
  margin: 0 auto 50px;
  position: relative;
  z-index: 20;
  overflow: hidden;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  @media (min-width: 640px) {
    border-radius: 36px;
  }

  &:hover {
    border-color: rgba(203, 255, 56, 0.6);
    box-shadow: 0 35px 70px -15px rgba(203, 255, 56, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.95);
  }
`;

export const Payments: React.FC = () => {
  const [isGreek, setIsGreek] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('preferredLang') === 'el'
  );

  useEffect(() => {
    const handleLang = () => {
      setIsGreek(localStorage.getItem('preferredLang') === 'el');
    };
    window.addEventListener('storage', handleLang);
    window.addEventListener('languagechange', handleLang);
    return () => {
      window.removeEventListener('storage', handleLang);
      window.removeEventListener('languagechange', handleLang);
    };
  }, []);

  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchUnifiedFinancials = async () => {
    try {
      // Fetch both transactions and appointments
      const [walletRes, appointmentsRes] = await Promise.all([
        paymentsAPI.getMyWallet({ limit: 100 }),
        bookingAPI.getUserAppointments()
      ]);

      const transactions = walletRes.data.items || [];
      const allAppointments = appointmentsRes.data || [];

      // Get all completed/executed appointments
      const completedApts = allAppointments.filter((a: any) =>
        ['completed', 'executed'].includes(a.status?.toLowerCase())
      );

      // Merge logic: Start with transactions, then add completed appointments 
      // that don't have a transaction associated with them yet.
      const unifiedList = [...transactions];

      completedApts.forEach((apt: any) => {
        const hasTransaction = transactions.some((t: any) => t.appointmentId === apt.id);
        if (!hasTransaction) {
          unifiedList.push({
            id: `apt-${apt.id}`,
            amount: apt.amountPaid || apt.totalAmount || 0,
            status: 'completed',
            type: 'payment',
            createdAt: apt.completedAt || apt.updatedAt || apt.startTime,
            method: apt.paymentMethod || 'manual',
            appointment: apt,
            clinic: apt.clinic
          });
        }
      });

      // Sort by newest first
      unifiedList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setPayments(unifiedList);
    } catch (error) {
      console.error("Error fetching unified financial ledger:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnifiedFinancials();
  }, []);

  const totalPages = Math.ceil(payments.length / itemsPerPage);
  const paginatedPayments = payments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalSpend = payments.reduce((acc, curr) => {
    if (curr.type === 'refund') return acc - Number(curr.amount);
    return acc + Number(curr.amount);
  }, 0);

  return (
    <div className={`${sectionStyles} relative overflow-x-hidden`}>
      {/* Background Hero Banner - 100% Crisp, unblurred clinic reception visual */}
      <div className="absolute top-0 inset-x-0 h-[640px] sm:h-[740px] lg:h-[820px] z-0 pointer-events-none overflow-hidden">
        <img
          src={HeroBg}
          style={{ objectPosition: 'center 38%', filter: 'none', imageRendering: 'auto' }}
          className="w-full h-full object-cover"
          alt="Payments & Invoices Hero"
        />
        {/* Soft Ambient Left Gradient behind typography so text is 100% readable while the desk & orchids remain totally crisp & visible */}
        <div className="absolute inset-y-0 left-0 w-full sm:w-2/3 max-w-2xl bg-gradient-to-r from-white/95 via-white/45 to-transparent pointer-events-none" />
        {/* Soft bottom blend to transition smoothly into page base */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/70 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-[1300px] w-full mx-auto px-4 sm:px-8 pt-8 sm:pt-14 pb-24">
        {/* Page Title & Floating Glass Breadcrumbs */}
        <div className="max-w-xl mb-8 sm:mb-10">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/75 backdrop-blur-md border border-white/85 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] shadow-sm mb-4 sm:mb-6"
          >
            <Link to="/my-account" className="text-gray-900 border-b border-gray-900/30 hover:border-black pb-0.5">
              {isGreek ? "ΛΟΓΑΡΙΑΣΜΟΣ" : "ACCOUNT"}
            </Link>
            <ChevronRight size={12} className="text-[#84cc16]" />
            <span className="text-[#84cc16] font-extrabold">
              {isGreek ? "ΧΡΕΩΣΕΙΣ ΚΑΙ ΟΙΚΟΝΟΜΙΚΑ" : "CHARGES & FINANCIALS"}
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-none text-gray-900 drop-shadow-sm"
          >
            {isGreek ? "ΠΛΗΡΩΜΕΣ & ΧΡΕΩΣΕΙΣ" : <>PAYMENTS & <span className="text-[#84cc16] sm:text-[#a3e635]">INVOICES</span></>}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-gray-600 mt-3 sm:mt-5 font-bold text-xs sm:text-base max-w-lg leading-relaxed"
          >
            {isGreek 
              ? "Το πλήρες ιστορικό πληρωμών σας σε συνεργαζόμενες κλινικές και θεραπείες." 
              : "Your complete financial history across all clinics and treatments. Track every deposit and transaction."}
          </motion.p>

          {/* Summary Quick Stats - Transparent Frosted Glass */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-4 mt-6 sm:mt-8"
          >
            <div className="bg-white/65 hover:bg-white/80 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/85 shadow-lg shadow-black/5 transition-all">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                {isGreek ? "Συνολικό Ποσό" : "Total Spent"}
              </p>
              <p className="text-2xl font-black text-gray-900 tabular-nums">€{totalSpend.toFixed(2)}</p>
            </div>
            <div className="bg-white/65 hover:bg-white/80 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/85 shadow-lg shadow-black/5 transition-all">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                {isGreek ? "Συναλλαγές" : "Transactions"}
              </p>
              <p className="text-2xl font-black text-gray-900 tabular-nums">{payments.length}</p>
            </div>
          </motion.div>
        </div>

        {/* Payments Table Card */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className={glassCard}
        >
          <div className="p-6 sm:p-10 border-b border-gray-200/60 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/40 backdrop-blur-sm">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="size-12 sm:size-16 shrink-0 rounded-[20px] bg-black text-[#CBFF38] flex items-center justify-center shadow-xl shadow-black/10">
                <History size={24} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black uppercase text-gray-900 tracking-tight">
                  {isGreek ? "Ιστορικό πληρωμών" : "Payment History"}
                </h3>
                <p className="text-[11px] text-gray-500 font-medium mt-1.5 leading-relaxed max-w-xl">
                  {isGreek 
                    ? "* Οι πληρωμές που εμφανίζονται εδώ αφορούν συναλλαγές με τις αντίστοιχες κλινικές ή ιατρούς. Το BeautyDoctors παρέχει την πλατφόρμα και δεν ενεργεί ως αποδέκτης των πληρωμών αυτών." 
                    : "* Payments shown here are transactions with the respective clinics or medical professionals. Beauty Doctors provides the platform and does not act as the recipient of these payments."}
                </p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">
                  {isGreek ? "Ιστορικό & Επαλήθευση" : "Transaction History & Verification"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Receipt className="text-gray-300 hidden sm:block" size={40} />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-32 gap-6">
              <div className="size-12 border-4 border-[#CBFF38] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 font-black text-[11px] uppercase tracking-[0.2em]">Syncing global ledger...</p>
            </div>
          ) : payments.length > 0 ? (
            <>
              <div className="divide-y divide-gray-200/50">
                {paginatedPayments.map((payment, i) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 sm:px-10 py-6 sm:py-8 gap-4 sm:gap-0 hover:bg-white/60 transition-all group"
                  >
                    <div className="flex items-center gap-4 sm:gap-8">
                      <div className={`size-12 sm:size-14 rounded-2xl flex items-center justify-center text-xl transition-transform group-hover:scale-105 duration-300 ${payment.type === 'refund' ? 'bg-orange-500/15 text-orange-600' : 'bg-black text-[#CBFF38]'}`}>
                        {payment.method === "gift_card" ? <Gift size={22} /> : payment.method === "cash" ? <Wallet size={22} /> : <CreditCard size={22} />}
                      </div>
                      <div>
                        <p className="font-black text-base sm:text-xl text-gray-900 tracking-tight leading-none uppercase">
                          {payment.appointment?.service?.treatment?.name || payment.notes || "Treatment Payment"}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                          <span className="flex items-center gap-1.5 text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">
                            <Building2 size={12} className="text-[#84cc16]" /> {payment.clinic?.name || "Clinic"}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">
                            {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right self-end sm:self-auto">
                      <p className={`font-black text-2xl tabular-nums tracking-tight ${payment.type === 'refund' ? 'text-orange-500' : 'text-gray-900'}`}>
                        {payment.type === 'refund' ? '-' : ''}€{Number(payment.amount).toFixed(2)}
                      </p>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full uppercase font-black text-[9px] tracking-widest border ${payment.status === 'completed'
                        ? 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30'
                        : 'bg-orange-500/15 text-orange-800 border-orange-500/30'
                        }`}>
                        {payment.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="px-6 sm:px-10 py-5 bg-white/40 border-t border-gray-200/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-[11px] font-black uppercase tracking-widest text-gray-500">
                    {isGreek ? `Εμφάνιση ${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, payments.length)} από ${payments.length}` : `Showing ${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, payments.length)} of ${payments.length} transactions`}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="size-9 rounded-xl border border-white/80 bg-white/70 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-black hover:text-[#CBFF38] hover:border-black disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                      title="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(pageNum => {
                        const isActive = pageNum === currentPage;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`size-9 rounded-xl text-xs font-black transition-all ${isActive ? 'bg-black text-[#CBFF38] shadow-md shadow-black/10' : 'bg-white/70 backdrop-blur-sm border border-white/80 text-gray-700 hover:border-black hover:text-black'}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="size-9 rounded-xl border border-white/80 bg-white/70 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-black hover:text-[#CBFF38] hover:border-black disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                      title="Next page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-24 text-center px-4">
              <div className="size-16 rounded-full bg-white/70 border border-white/80 flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Receipt size={24} />
              </div>
              <h4 className="text-lg font-black uppercase text-gray-900 mb-2">No Transactions Found</h4>
              <p className="text-gray-500 text-xs font-medium max-w-sm mx-auto">
                Your payment ledger is currently clean. Confirmed appointments and payments will automatically populate here.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
