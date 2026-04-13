import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import {
  fetchClinicProfile,
  fetchAppointments,
} from "../../store/slices/clinicSlice";
import {
  canAccessClinicDashboard,
  hasPermission,
} from "../../utils/rolePermissions";
import { UserRole, AppointmentStatus, Appointment } from "../../types/clinic.types";
import {
  Calendar,
  Users,
  Euro,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Plus,
  BarChart3,
  FileText,
  UserCog,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AppointmentExecutionModal from "../../components/clinic/AppointmentExecutionModal";
import ClinicBookingModal from "../../components/clinic/ClinicBookingModal";



const ClinicDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { profile, appointments, isLoading } = useSelector(
    (state: RootState) => state.clinic
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Get clinicId from profile or user context
  const clinicId = user?.role === 'clinic_owner' ? (user as any).ownedClinics?.[0]?.id : (user as any).associatedClinicId;
  const activeClinicId = profile?.id || clinicId || appointments[0]?.clinicId;

  useEffect(() => {
    if (!user || !canAccessClinicDashboard(user.role)) {
      if (user?.role === 'doctor' || user?.role === 'secretariat') {
        navigate("/clinic/appointments");
      } else {
        navigate("/");
      }
      return;
    }
    dispatch(fetchClinicProfile());
    dispatch(fetchAppointments(undefined));
  }, [dispatch, user, navigate]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayAppointments = appointments.filter(
      (apt) => apt.startTime.split("T")[0] === today
    );

    return {
      totalToday: todayAppointments.length,
      pending: appointments.filter(
        (apt) => apt.status === AppointmentStatus.PENDING
      ).length,
      confirmed: appointments.filter(
        (apt) => apt.status === AppointmentStatus.CONFIRMED
      ).length,
      completed: appointments.filter(
        (apt) => apt.status === AppointmentStatus.COMPLETED
      ).length,
      totalRevenue: appointments
        .filter((apt) => apt.status === AppointmentStatus.COMPLETED)
        .reduce((sum, apt) => sum + (Number(apt.totalAmount) || 0), 0),
    };
  }, [appointments]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center gap-4">
        <div className="size-10 border-4 border-[#CBFF38] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest italic">Syncing clinical data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Refined Minimal Header */}
      <div className="relative pt-8 pb-16 px-6 md:px-10 border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100"
              >
                <div className="size-1.5 rounded-full bg-green-500" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Operational Overview</span>
              </motion.div>

              <div className="space-y-1">
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl md:text-5xl font-black text-gray-900 uppercase italic tracking-tighter leading-none"
                >
                  {profile?.name || "Clinic Executive"}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-500 font-medium text-base max-w-xl"
                >
                  Clinical performance is <span className="text-black font-black">optimized</span>. You have {stats.totalToday} primary procedures scheduled for today.
                </motion.p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3"
            >
              <button
                onClick={() => navigate('/clinic/appointments')}
                className="group px-6 h-12 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border border-gray-200 flex items-center gap-2"
              >
                <Calendar size={14} className="text-gray-400 group-hover:text-black transition-colors" />
                View Diary
              </button>
              <button
                onClick={() => setShowBookingModal(true)}
                className="group px-6 h-12 bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#CBFF38] hover:text-black active:scale-95 transition-all shadow-lg flex items-center gap-2"
              >
                <Plus size={16} />
                New Booking
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Grid System */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 mt-8 relative z-20 pb-20">

        {/* Statistics Layer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard
            title="Daily Throughput"
            value={stats.totalToday}
            percentage="+12%"
            trend="up"
            icon={<HashRadial size={24} />}
            delay={0}
          />
          <StatCard
            title="Confirmation Delay"
            value={stats.pending}
            percentage="Needs Action"
            trend="neutral"
            icon={<Clock size={24} />}
            delay={0.1}
            highlight={stats.pending > 0}
          />
          <StatCard
            title="Procedure Yield"
            value={stats.completed}
            percentage="94% Success"
            trend="up"
            icon={<CheckCircle size={24} />}
            delay={0.2}
          />
          <StatCard
            title="Entity Valuation"
            value={(
              <span className="flex items-center">
                <span className="font-sans mr-1">€</span>
                {stats.totalRevenue.toLocaleString()}
              </span>
            )}
            percentage={(
              <span className="flex items-center">
                +<span className="font-sans mr-0.5">€</span>4.2k
              </span>
            )}
            trend="up"
            icon={<Euro size={24} />}
            delay={0.3}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Active Queue Control */}
          <div className="lg:col-span-8 space-y-10">
            <section className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-gray-900">Treatment Queue</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Live Clinical Feed</p>
                </div>
                <div className="flex gap-1.5 p-1 bg-gray-50 rounded-xl">
                  <button className="px-4 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm">Today</button>
                  <button className="px-4 py-2 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:text-black transition-colors">Pending</button>
                </div>
              </div>

              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {appointments
                    .filter((apt) => apt.startTime.split("T")[0] === new Date().toISOString().split("T")[0])
                    .slice(0, 6)
                    .map((apt, index) => (
                      <AppointmentPremiumRow
                        key={apt.id}
                        appointment={apt}
                        index={index}
                        onClick={() => setSelectedApt(apt)}
                      />
                    ))}

                  {appointments.filter(apt => apt.startTime.split("T")[0] === new Date().toISOString().split("T")[0]).length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-20 text-center"
                    >
                      <div className="size-20 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-gray-200">
                        <Calendar size={32} />
                      </div>
                      <h3 className="text-lg font-black uppercase italic tracking-tighter text-gray-900">No active procedures</h3>
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Clinic schedule is currently clear for today.</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {selectedApt && (
                    <AppointmentExecutionModal
                      appointment={selectedApt}
                      onClose={() => setSelectedApt(null)}
                      onComplete={() => {
                        setSelectedApt(null);
                        dispatch(fetchAppointments(undefined));
                      }}
                    />
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => navigate('/clinic/appointments')}
                className="w-full mt-6 py-3 border-2 border-dashed border-gray-100 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 hover:border-black hover:text-black transition-all"
              >
                Expand Operations Intelligence
              </button>
            </section>

            {/* Impact Visualization Card */}
            {hasPermission(user?.role as UserRole, "canViewAnalytics") && (
              <section className="group relative bg-[#0D0D0D] rounded-[32px] p-6 md:p-8 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#CBFF38]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="transition-transform duration-300 group-hover:scale-110">
                  <BarChart3 size={300} className="absolute -bottom-16 -right-16 opacity-10 rotate-12" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#CBFF38]/10 rounded-full">
                      <TrendingUp size={10} className="text-[#CBFF38]" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#CBFF38]">Performance Index</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-white">Advanced Metrics</h3>
                    <p className="text-gray-400 text-[11px] max-w-xs font-medium leading-relaxed">
                      Analyze conversion funnels, churn velocity, and clinical resource allocation with our proprietary data engine.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/clinic/analytics')}
                    className="h-12 px-8 bg-white text-black rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-[#CBFF38] hover:scale-105 active:scale-95 transition-all shadow-xl"
                  >
                    Access Engine
                  </button>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar Modules */}
          <div className="lg:col-span-4 space-y-8 sticky top-8">
            <section className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
              <h2 className="text-sm font-black uppercase italic tracking-tighter text-gray-900 mb-6 px-2">Operational Access</h2>
              <div className="grid grid-cols-2 gap-4">
                <ModernQuickAction
                  icon={<Users size={22} />}
                  label="Database"
                  desc="Client CRM"
                  onClick={() => navigate('/clinic/clients')}
                  color="#CBFF38"
                />
                <ModernQuickAction
                  icon={<FileText size={22} />}
                  label="Mastery"
                  desc="Catalog"
                  onClick={() => navigate('/clinic/services')}
                  color="#FFD700"
                />
                <ModernQuickAction
                  icon={<UserCog size={22} />}
                  label="Legion"
                  desc="Staffing"
                  onClick={() => navigate('/clinic/staff')}
                  color="#00E5FF"
                />
                <ModernQuickAction
                  icon={<Star size={22} />}
                  label="Reputation"
                  desc="Reviews"
                  onClick={() => navigate('/clinic/reviews')}
                  color="#FF4081"
                />
              </div>
            </section>

            {/* Action Alert Center */}
            {stats.pending > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-black rounded-[32px] p-6 border-l-[4px] border-[#CBFF38] shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <AlertCircle size={60} className="text-[#CBFF38]" />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="inline-flex items-center gap-2 text-[#CBFF38]">
                    <div className="size-2 rounded-full bg-[#CBFF38] animate-ping" />
                    <span className="text-[8px] font-black uppercase tracking-widest italic">Booking Priority</span>
                  </div>
                  <h4 className="text-lg font-black uppercase text-white italic tracking-tighter leading-tight">
                    {stats.pending} Entries <br />Await Validation
                  </h4>
                  <p className="text-gray-400 text-[11px] font-medium leading-relaxed">
                    Confirm pending appointments to optimize resource utilization.
                  </p>
                  <button
                    onClick={() => navigate("/clinic/appointments?status=pending")}
                    className="w-full py-3 bg-[#CBFF38] hover:bg-white text-black rounded-xl font-black uppercase text-[9px] tracking-widest transition-all"
                  >
                    Confirm Queue
                  </button>
                </div>
              </motion.div>
            )}

            {/* System Intelligence Feed */}
            <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-200">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-5 italic">System Insights</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="size-1 rounded-full bg-[#CBFF38] mt-2" />
                  <p className="text-[11px] font-bold text-gray-600 leading-normal">
                    Monday evening is your highest <span className="text-black">demand window</span>. Consider adding staff capacity.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="size-1 rounded-full bg-blue-400 mt-2" />
                  <p className="text-[11px] font-bold text-gray-600 leading-normal">
                    Botox treatments account for <span className="text-black">60%</span> of this month's gross revenue.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Booking Modal */}
      {showBookingModal && activeClinicId && (
        <ClinicBookingModal
          isOpen={showBookingModal}
          clinicId={activeClinicId}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false);
            dispatch(fetchAppointments(undefined));
          }}
        />
      )}
    </div>
  );
};

/* --- Sub-Components --- */

const StatCard = React.forwardRef(({ title, value, percentage, trend, icon, delay, highlight }: any, ref: any) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={`bg-white p-5 rounded-2xl border transition-all duration-300 group relative ${highlight ? 'border-[#CBFF38] bg-lime-50/10' : 'border-gray-100'
      }`}
  >
    <div className="flex flex-col justify-between h-full min-h-[120px]">
      <div className="flex items-start justify-between mb-4">
        <div className={`size-10 rounded-xl flex items-center justify-center transition-all duration-500 bg-gray-50 text-gray-400 group-hover:bg-black group-hover:text-white`}>
          {React.cloneElement(icon, { size: 18 })}
        </div>
        <div className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${trend === 'up' ? 'text-green-600 bg-green-50' : trend === 'neutral' ? 'text-orange-500 bg-orange-50' : 'text-gray-400 bg-gray-50'
          }`}>
          {percentage}
        </div>
      </div>

      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{title}</p>
        <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none text-gray-900">{value}</h3>
      </div>
    </div>
  </motion.div>
));

const AppointmentPremiumRow = React.forwardRef(({ appointment, index, onClick }: any, ref: any) => {
  const isBeautyDoctors = appointment.isBeautyDoctorsClient;
  const isPending = appointment.status === AppointmentStatus.PENDING;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer group flex items-center justify-between ${isBeautyDoctors ? 'bg-lime-50/20 border-[#CBFF38]' : 'bg-white border-gray-100 hover:border-gray-200'
        }`}
    >
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <div className="size-12 rounded-xl bg-gray-900 flex flex-col items-center justify-center text-[#CBFF38]">
            <span className="text-[10px] font-black italic">{new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="font-black uppercase italic tracking-tighter text-gray-900 group-hover:text-black text-sm">
              {appointment.client?.firstName} {appointment.client?.lastName}
            </h4>
            {isBeautyDoctors && (
              <span className="text-[7px] font-black bg-[#CBFF38] text-black px-1.5 py-0.5 rounded-full italic tracking-widest">DIAMOND</span>
            )}
          </div>
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
            {appointment.service?.name || appointment.serviceName || "Premium Clinical Procedure"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className={`text-[8px] font-black uppercase tracking-widest mb-0.5 ${isPending ? 'text-orange-500' : 'text-gray-400'}`}>
            {appointment.status}
          </div>
          <div className="text-xs font-black text-gray-900">
            <span className="font-sans mr-0.5">€</span>{appointment.totalAmount || "0"}
          </div>
        </div>
        <div className="size-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-black group-hover:text-[#CBFF38] transition-all">
          <ChevronRight size={14} />
        </div>
      </div>
    </motion.div>
  );
});

const ModernQuickAction = ({ icon, label, desc, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col items-start gap-4 hover:border-gray-200 hover:bg-gray-50 transition-all group"
  >
    <div className="size-10 rounded-xl flex items-center justify-center transition-all bg-gray-50 group-hover:bg-black group-hover:text-white" style={{ color }}>
      {React.cloneElement(icon, { size: 18 })}
    </div>
    <div className="text-left">
       <span className="block text-[10px] font-black uppercase tracking-widest text-black">{label}</span>
       <span className="block text-[8px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">{desc}</span>
    </div>
  </button>
);

const HashRadial = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
    <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default ClinicDashboard;
