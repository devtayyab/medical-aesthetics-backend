import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchAppointments, updateAppointmentStatus } from '../../store/slices/clinicSlice';
import { AppointmentStatus } from '../../types/clinic.types';
import { hasPermission } from '../../utils/rolePermissions';
import { Calendar, Clock, User, Search, X } from 'lucide-react';
import AppointmentExecutionModal from '../../components/clinic/AppointmentExecutionModal';
import ClinicBookingModal from '../../components/clinic/ClinicBookingModal';
import RescheduleModal from '../../components/clinic/RescheduleModal';
import AppointmentDetailModal from '../../components/clinic/AppointmentDetailModal';
import { AuthState } from '../../store/slices/authSlice';
import { rescheduleAppointment } from '../../store/slices/clinicSlice';

const AppointmentsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { appointments, isLoading } = useSelector((state: RootState) => state.clinic);
  const user = useSelector((state: RootState) => (state.auth as AuthState).user);

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Get clinicId from user context
  const userRole = user?.role?.toLowerCase();
  const clinicId = userRole === 'clinic_owner' 
    ? (user as any).ownedClinics?.[0]?.id 
    : (user as any).assignedClinicId;
    
  const activeClinicId = clinicId || (appointments.length > 0 ? appointments[0]?.clinicId : null);
  const isPastDate = new Date(selectedDate) < new Date(new Date().toISOString().split('T')[0]);

  const refreshAppointments = () => {
    const filters: any = {};
    if (selectedDate) filters.date = selectedDate;
    if (activeClinicId) filters.clinicId = activeClinicId;
    dispatch(fetchAppointments(filters));
  };

  useEffect(() => {
    refreshAppointments();
  }, [dispatch, selectedDate, activeClinicId]);

  const counts = {
    active: (appointments || []).filter(a => a?.status?.toLowerCase() !== 'completed').length,
    completed: (appointments || []).filter(a => a?.status?.toLowerCase() === 'completed').length,
  };

  const filteredAppointments = (appointments || []).filter((apt) => {
    const status = apt.status.toLowerCase();
    
    // Tab filtering
    if (activeTab === 'active' && status === 'completed') return false;
    if (activeTab === 'completed' && status !== 'completed') return false;

    const matchesStatus = selectedStatus === 'all' || status === selectedStatus.toLowerCase();
    const matchesSearch =
      searchTerm === '' ||
      apt.client?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.client?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.serviceName || apt.service?.treatment?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = selectedDate === '' || apt.startTime.split('T')[0] === selectedDate;

    return matchesStatus && matchesSearch && matchesDate;
  });

  const handleConfirm = async (id: string) => {
    await dispatch(
      updateAppointmentStatus({
        id,
        status: AppointmentStatus.CONFIRMED,
      })
    );
  };

  const handleCancel = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      await dispatch(
        updateAppointmentStatus({
          id,
          status: AppointmentStatus.CANCELLED,
        })
      );
    }
  };

  const handleExecute = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowExecutionModal(true);
  };

  // (Removed unused statusColors)


  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Refined Minimal Header */}
      <div className="relative pt-8 pb-16 px-6 md:px-10 border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                <div className="size-1.5 rounded-full bg-green-500" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Live Operations</span>
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none text-gray-900">Appointments</h1>
                <p className="text-gray-500 font-medium max-w-md text-sm">Real-time clinical scheduling and management engine.</p>
              </div>
            </div>
            {activeClinicId && (
              <button
                onClick={() => setShowBookingModal(true)}
                className="group h-12 px-6 bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#CBFF38] hover:text-black transition-all shadow-lg flex items-center gap-3"
              >
                <Calendar className="transition-transform" size={16} />
                Book Appointment
              </button>
            )}
          </div>

          {/* Tabs Section moved here from the incorrect location */}
          <div className="mt-12 flex items-center gap-2 p-1.5 bg-gray-50 rounded-2xl w-fit border border-gray-100">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === 'active' 
                  ? 'bg-black text-white shadow-xl shadow-black/10' 
                  : 'text-gray-400 hover:text-gray-900'
              }`}
            >
              Active Appointments
              <span className={`px-1.5 py-0.5 rounded-md text-[8px] ${activeTab === 'active' ? 'bg-[#CBFF38] text-black' : 'bg-gray-100 text-gray-400'}`}>
                {counts.active}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === 'completed' 
                  ? 'bg-black text-white shadow-xl shadow-black/10' 
                  : 'text-gray-400 hover:text-gray-900'
              }`}
            >
              Completed History
              <span className={`px-1.5 py-0.5 rounded-md text-[8px] ${activeTab === 'completed' ? 'bg-[#CBFF38] text-black' : 'bg-gray-100 text-gray-400'}`}>
                {counts.completed}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 mt-8 relative z-20 space-y-8 pb-16">
        <div className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-wrap items-center gap-3 shadow-sm">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 h-11 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-black font-semibold text-xs"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-11 px-4 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-black font-black uppercase italic text-[9px] tracking-widest appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="all">Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-11 px-4 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-black font-black uppercase text-[9px] tracking-widest cursor-pointer"
          />

          <button
            onClick={() => {
              setSelectedStatus('all');
              setSearchTerm('');
              setSelectedDate(new Date().toISOString().split('T')[0]);
            }}
            className="h-11 px-5 border border-gray-100 text-gray-400 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-black hover:text-[#CBFF38] transition-all"
          >
            Reset
          </button>
        </div>

        {/* Appointments List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4 bg-white rounded-[48px] shadow-sm border border-gray-100">
            <div className="size-10 border-4 border-[#CBFF38] border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Loading appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-[40px] p-20 text-center border border-gray-100 shadow-sm">
            <div className="size-20 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-gray-200">
              <Calendar size={32} />
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-gray-900 mb-2">No Appointments</h3>
            <p className="text-gray-400 font-medium mb-4">No appointments match your current filters.</p>
            {activeTab === 'active' && counts.completed > 0 && (
              <button 
                onClick={() => setActiveTab('completed')}
                className="px-6 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#CBFF38] hover:text-black transition-all"
              >
                View {counts.completed} Completed Procedures
              </button>
            )}
            {activeTab === 'completed' && counts.active > 0 && (
              <button 
                onClick={() => setActiveTab('active')}
                className="px-6 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#CBFF38] hover:text-black transition-all"
              >
                View {counts.active} Active Entries
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                user={user}
                onConfirm={() => handleConfirm(appointment.id)}
                onCancel={() => handleCancel(appointment.id)}
                onExecute={() => handleExecute(appointment)}
                onReschedule={() => {
                  setSelectedAppointment(appointment);
                  setShowRescheduleModal(true);
                }}
                onOverview={() => {
                   setSelectedAppointment(appointment);
                   setShowDetailModal(true);
                }}
                onNoShow={async () => {
                  if (window.confirm('Mark this client as No Show?')) {
                    await dispatch(updateAppointmentStatus({ id: appointment.id, status: AppointmentStatus.NO_SHOW }));
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals remain the same but ensure they match later if needed */}
      {showExecutionModal && selectedAppointment && (
        <AppointmentExecutionModal
          appointment={selectedAppointment}
          onClose={() => setShowExecutionModal(false)}
          onComplete={() => {
            setShowExecutionModal(false);
            refreshAppointments();
          }}
        />
      )}

      {showDetailModal && selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {showRescheduleModal && selectedAppointment && (
        <RescheduleModal
          appointment={selectedAppointment}
          onClose={() => setShowRescheduleModal(false)}
          onReschedule={async (startTime, endTime, reason) => {
            await dispatch(rescheduleAppointment({
              id: selectedAppointment.id,
              startTime,
              endTime,
              reason
            })).unwrap();
            setShowRescheduleModal(false);
            refreshAppointments();
          }}
        />
      )}

      {showBookingModal && activeClinicId && (
        <ClinicBookingModal
          isOpen={showBookingModal}
          clinicId={activeClinicId}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false);
            refreshAppointments();
          }}
        />
      )}
    </div>
  );
};

/* --- Sub-Components --- */

const AppointmentCard = ({ appointment, user, onConfirm, onCancel, onExecute, onReschedule, onNoShow, onOverview }: any) => {
  const isPlatform = appointment.appointmentSource === 'platform_broker';
  const status = appointment.status.toLowerCase();
  const isBlocked = !!appointment.isBlocked;

  // ── Blocked Time Card ────────────────────────────────────────────────────
  if (isBlocked) {
    const startTime = new Date(appointment.startTime);
    const endTime = new Date(appointment.endTime || appointment.startTime);
    const fmt = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl flex flex-col md:flex-row md:items-center gap-6 overflow-hidden relative">
        {/* Red left stripe */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500" />

        {/* Time node */}
        <div className="flex flex-col items-center justify-center size-16 bg-red-500 rounded-xl text-white shrink-0 ml-4 my-5">
          <span className="text-[7px] font-black uppercase tracking-widest opacity-70">
            {startTime.toLocaleDateString([], { month: 'short' })}
          </span>
          <span className="text-xl font-black italic tracking-tighter leading-none my-0.5">
            {startTime.getDate()}
          </span>
          <span className="text-[7px] font-black italic">{fmt(startTime)}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 py-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest italic border bg-red-500 text-white border-red-500">
              Blocked
            </span>
            <span className="text-[8px] font-black text-red-300 uppercase tracking-widest">
              #{appointment.id.slice(0, 8)}
            </span>
          </div>

          <h4 className="text-base font-black uppercase italic tracking-tighter text-red-700 mb-1">
            🚫 Blocked Time
          </h4>

          <p className="text-xs text-red-500 font-semibold">
            {fmt(startTime)} — {fmt(endTime)}
            {appointment.reason || appointment.notes
              ? <span className="ml-2 text-red-400 italic">· {appointment.reason || appointment.notes}</span>
              : null}
          </p>
        </div>

        {/* No action buttons — just overview */}
        <div className="shrink-0 md:border-l border-red-200 md:pl-6 pr-5 py-5">
          <button
            onClick={onOverview}
            className="h-9 px-4 bg-red-100 text-red-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all italic"
          >
            Details
          </button>
        </div>
      </div>
    );
  }

  // ── Normal Appointment Card ──────────────────────────────────────────────
  return (
    <div className={`bg-white rounded-2xl border transition-all duration-300 group relative flex flex-col md:flex-row md:items-center gap-6 overflow-hidden ${
      status === 'confirmed' ? 'border-green-200 shadow-sm' :
      status === 'cancelled' ? 'border-red-100 opacity-60 grayscale-[0.5]' :
      status === 'pending' ? 'border-amber-100' : 'border-gray-100 hover:border-gray-300'
    } ${isPlatform ? 'ring-1 ring-[#CBFF38]/30 shadow-md' : ''}`}>
      
      {/* Status Stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
        status === 'confirmed' ? 'bg-green-500' :
        status === 'cancelled' ? 'bg-red-500' :
        status === 'pending' ? 'bg-amber-500' :
        status === 'completed' ? 'bg-[#CBFF38]' : 'bg-gray-200'
      }`} />

      {/* Temporal Node */}
      <div className="flex flex-col items-center justify-center size-16 bg-black rounded-xl text-[#CBFF38] shrink-0 group-hover:scale-105 transition-transform ml-4 my-5">
        <span className="text-[7px] font-black uppercase tracking-widest opacity-60">
          {new Date(appointment.startTime).toLocaleDateString([], { month: 'short' })}
        </span>
        <span className="text-xl font-black italic tracking-tighter leading-none my-0.5">
          {new Date(appointment.startTime).getDate()}
        </span>
        <span className="text-[7px] font-black italic">
          {new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
        </span>
      </div>

      {/* Content Cluster */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest italic border ${
            status === 'confirmed' ? 'bg-[#CBFF38] text-black border-[#CBFF38]' :
            status === 'pending' ? 'bg-black text-[#CBFF38] border-black' : 'bg-gray-50 text-gray-400 border-gray-100'
          }`}>
            {appointment.status.replace('_', ' ')}
          </span>
          {isPlatform && (
            <span className="px-2 py-0.5 bg-gray-900 text-[#CBFF38] text-[7px] font-black rounded-full uppercase tracking-widest italic">
              Diamond
            </span>
          )}
          <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">
            #{appointment.id.slice(0, 8)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-0.5">
            <p className="text-[7px] font-black uppercase tracking-widest text-gray-400">Client</p>
            <h4 className="text-sm font-black uppercase italic tracking-tighter text-gray-900 truncate">
              {`${appointment.client?.firstName} ${appointment.client?.lastName}`}
            </h4>
          </div>

          <div className="space-y-0.5">
            <p className="text-[7px] font-black uppercase tracking-widest text-gray-400">Service</p>
            <h4 className="text-sm font-black uppercase italic tracking-tighter text-gray-900 truncate">
              {appointment.serviceName || appointment.service?.treatment?.name}
            </h4>
            <div className="text-[9px] font-bold text-black bg-[#CBFF38] inline-block px-1 rounded-sm mt-0.5">€{appointment.totalAmount}</div>
          </div>

          <div className="space-y-0.5 hidden lg:block">
            <p className="text-[7px] font-black uppercase tracking-widest text-gray-400">Provider</p>
            <div className="flex items-center gap-1.5">
               <div className="size-4 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                  <User size={8} className="text-gray-400" />
               </div>
               <span className="text-[9px] font-black uppercase italic text-gray-600">
                 {appointment.bookedByInfo ? appointment.bookedByInfo.name : 'System'}
               </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Layer */}
      <div className="flex items-center gap-2 shrink-0 md:border-l border-gray-100 md:pl-6 pr-5 py-5">
        {!isBlocked && (
          <>
            {status === 'pending' && hasPermission(user?.role, 'canConfirmAppointments') && (
              <button onClick={onConfirm} className="h-9 px-4 bg-black text-[#CBFF38] rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#CBFF38] hover:text-black transition-all">
                Confirm
              </button>
            )}
            {status === 'confirmed' && hasPermission(user?.role, 'canCompleteAppointments') && (
              <button onClick={onExecute} className="h-9 px-4 bg-[#CBFF38] text-black rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-[#CBFF38] transition-all">
                Execute
              </button>
            )}
            {['pending', 'confirmed'].includes(status) && (
              <div className="flex gap-1.5">
                <button onClick={onReschedule} className="size-9 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center hover:bg-black hover:text-[#CBFF38] transition-all border border-gray-100">
                  <Clock size={14} />
                </button>
                <button onClick={onCancel} className="size-9 bg-gray-50 text-red-400 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border border-gray-100">
                  <X size={14} />
                </button>
              </div>
            )}
          </>
        )}
        <button onClick={onOverview} className="h-9 px-4 bg-gray-100 text-gray-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all italic">
          Overview
        </button>
      </div>
    </div>
  );
};

export default AppointmentsPage;

