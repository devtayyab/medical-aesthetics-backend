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
  DollarSign,
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
      {/* Dynamic Header */}
      <div className="relative pt-10 pb-24 px-6 md:px-10 overflow-hidden">
        <div className="absolute inset-0 bg-black rounded-b-[48px] shadow-2xl" />
        <div className="absolute top-0 right-0 w-full h-full">
           <div className="absolute top-[-10%] right-[-5%] size-[500px] bg-[#CBFF38]/10 blur-[120px] rounded-full" />
           <div className="absolute bottom-[-20%] left-[-5%] size-[400px] bg-[#CBFF38]/5 blur-[100px] rounded-full" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-4">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10"
              >
                <div className="size-1.5 rounded-full bg-[#CBFF38] animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CBFF38] italic">Operational Intelligence</span>
              </motion.div>
              
              <div className="space-y-1">
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none"
                >
                  {profile?.name || "Clinic Executive"}
                </motion.h1>
                <motion.p 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ delay: 0.2 }}
                   className="text-gray-400 font-medium text-lg max-w-xl"
                >
                  Clinical performance is <span className="text-[#CBFF38]">optimized</span>. You have {stats.totalToday} primary procedures scheduled for the next 24 hours.
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
                className="group relative px-8 h-14 bg-white/5 hover:bg-white/10 backdrop-blur-xl text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all border border-white/10 flex items-center gap-3 overflow-hidden"
              >
                <Calendar size={16} className="text-[#CBFF38] group-hover:scale-110 transition-transform" /> 
                Diary
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>
              <button 
                onClick={() => setShowBookingModal(true)}
                className="group px-8 h-14 bg-[#CBFF38] text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-lime-500/20 flex items-center gap-3"
              >
                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" /> 
                New Booking
              </button>
            </motion.div>
          </div>
        </div>
      </div>
 
      {/* Main Grid System */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 -mt-12 relative z-20 pb-20">
        
        {/* Statistics Layer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
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
             value={`${stats.totalRevenue.toLocaleString()}`} 
             percentage="+4.2k"
             trend="up"
             icon={<TrendingUp size={24} />}
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
                className="w-full mt-8 py-4 border-2 border-dashed border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:border-black hover:text-black transition-all"
              >
                Expand Operations Intelligence
              </button>
            </section>
 
            {/* Impact Visualization Card */}
            {hasPermission(user?.role as UserRole, "canViewAnalytics") && (
              <section className="group relative bg-[#0D0D0D] rounded-[48px] p-10 overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#CBFF38]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                 <div className="transition-transform duration-300 group-hover:scale-110">
                   {/* Placeholder for iconMap[item.icon] - ensure item and iconMap are defined in context */}
                   <BarChart3 size={400} className="absolute -bottom-20 -right-20 opacity-10 rotate-12" />
                </div>
                 
                 <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                    <div className="space-y-4">
                       <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#CBFF38]/10 rounded-full">
                          <TrendingUp size={12} className="text-[#CBFF38]" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-[#CBFF38]">Performance Index</span>
                       </div>
                       <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Advanced Metrics</h3>
                       <p className="text-gray-400 text-sm max-w-sm font-medium leading-relaxed">
                          Analyze conversion funnels, churn velocity, and clinical resource allocation with our proprietary data engine.
                       </p>
                    </div>
                    <button 
                      onClick={() => navigate('/clinic/analytics')}
                      className="h-16 px-10 bg-white text-black rounded-[24px] font-black uppercase text-xs tracking-[0.2em] hover:bg-[#CBFF38] hover:scale-105 active:scale-95 transition-all shadow-xl"
                    >
                      Access Engine
                    </button>
                 </div>
              </section>
            )}
          </div>
 
          {/* Sidebar Modules */}
          <div className="lg:col-span-4 space-y-8 sticky top-8">
            <section className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-gray-900 mb-8 px-2">Operational Access</h2>
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
                className="bg-black rounded-[40px] p-8 border-l-[6px] border-[#CBFF38] shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <AlertCircle size={80} className="text-[#CBFF38]" />
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="inline-flex items-center gap-3 text-[#CBFF38]">
                    <div className="size-2 rounded-full bg-[#CBFF38] animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-widest italic">Booking Priority</span>
                  </div>
                  <h4 className="text-2xl font-black uppercase text-white italic tracking-tighter leading-tight">
                    {stats.pending} Entries <br/>Await Validation
                  </h4>
                  <p className="text-gray-400 text-xs font-medium leading-relaxed">
                    Confirm pending appointments to optimize resource utilization and secure clinical revenue for the week.
                  </p>
                  <button 
                    onClick={() => navigate("/clinic/appointments?status=pending")}
                    className="w-full py-4 bg-[#CBFF38] hover:bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
                  >
                    Confirm Queue
                  </button>
                </div>
              </motion.div>
            )}
            
            {/* System Intelligence Feed */}
            <div className="p-8 bg-gray-50 rounded-[40px] border border-gray-200">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 italic">System Insights</h3>
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
    className={`bg-white p-6 rounded-[32px] border transition-all duration-300 group relative overflow-hidden ${
      highlight ? 'border-[#CBFF38] shadow-lg shadow-lime-500/10' : 'border-gray-100 hover:border-black'
    }`}
  >
    <div className="relative z-10 flex flex-col justify-between h-full min-h-[140px]">
       <div className="flex items-start justify-between">
          <div className={`size-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
            highlight ? 'bg-black text-[#CBFF38]' : 'bg-gray-50 text-black group-hover:bg-black group-hover:text-[#CBFF38]'
          }`}>
             {icon}
          </div>
          <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
             trend === 'up' ? 'text-green-500 bg-green-50' : trend === 'neutral' ? 'text-orange-500 bg-orange-50' : 'text-gray-400 bg-gray-50'
          }`}>
             {percentage}
          </div>
       </div>
       
       <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 group-hover:text-black transition-colors">{title}</p>
          <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none text-gray-900 group-hover:scale-105 transition-transform origin-left">{value}</h3>
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
      className={`relative p-5 rounded-3xl border transition-all duration-300 cursor-pointer group flex items-center justify-between ${
         isBeautyDoctors ? 'bg-lime-50/30 border-[#CBFF38] shadow-sm' : 'bg-white border-gray-100 hover:border-black'
      }`}
    >
       <div className="flex items-center gap-5">
          <div className="relative shrink-0">
             <div className="size-14 rounded-2xl bg-black flex flex-col items-center justify-center text-[#CBFF38] shadow-lg">
                <span className="text-[11px] font-black italic">{new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
             </div>
             {isBeautyDoctors && (
                <div className="absolute -top-1 -right-1 size-4 bg-[#CBFF38] border-2 border-white rounded-full animate-ping" />
             )}
          </div>
          
          <div>
             <div className="flex items-center gap-2 mb-1">
                <h4 className="font-black uppercase italic tracking-tighter text-gray-900 group-hover:text-black">
                   {appointment.client?.firstName} {appointment.client?.lastName}
                </h4>
                {isBeautyDoctors && (
                   <span className="text-[8px] font-black bg-[#CBFF38] text-black px-2 py-0.5 rounded-full italic tracking-widest">DIAMOND CUSTOMER</span>
                )}
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors">
                {appointment.service?.name || appointment.serviceName || "Premium Clinical Procedure"}
             </p>
          </div>
       </div>

       <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
             <div className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isPending ? 'text-orange-500' : 'text-gray-400'}`}>
                {appointment.status}
             </div>
             <div className="text-sm font-black text-gray-900">{appointment.totalAmount || "0"}</div>
          </div>
          <div className="size-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-[#CBFF38] group-hover:text-black transition-all group-hover:rotate-12">
             <ChevronRight size={18} />
          </div>
       </div>
    </motion.div>
  );
});

const ModernQuickAction = ({ icon, label, desc, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className="bg-white p-6 rounded-[32px] border border-gray-100 flex flex-col items-start gap-4 hover:border-black transition-all hover:shadow-xl group"
  >
    <div className="size-12 rounded-2xl flex items-center justify-center transition-all bg-gray-50 group-hover:bg-black group-hover:text-[#CBFF38] shadow-sm" style={{ color }}>
      {icon}
    </div>
    <div>
       <span className="block text-xs font-black uppercase tracking-widest text-black group-hover:translate-x-1 transition-transform">{label}</span>
       <span className="block text-[8px] font-black uppercase tracking-widest text-gray-400 mt-1">{desc}</span>
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
