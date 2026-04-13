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
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Get clinicId from first appointment or user context
  const clinicId = user?.role === 'clinic_owner' ? (user as any).ownedClinics?.[0]?.id : (user as any).associatedClinicId;
  const activeClinicId = clinicId || appointments[0]?.clinicId;

  useEffect(() => {
    dispatch(fetchAppointments(undefined));
  }, [dispatch]);

  const isDoctor = user?.role === 'doctor';
  const filteredAppointments = appointments.filter((apt) => {
    const matchesProvider = !isDoctor || apt.providerId === user?.id;
    const matchesStatus = selectedStatus === 'all' || apt.status.toLowerCase() === selectedStatus.toLowerCase();
    const matchesSearch =
      searchTerm === '' ||
      apt.client?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.client?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.serviceName || apt.service?.treatment?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = selectedDate === '' || apt.startTime.split('T')[0] === selectedDate;

    return matchesProvider && matchesStatus && matchesSearch && matchesDate;
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
              setSelectedDate('');
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
            <p className="text-gray-400 font-medium mb-8">No appointments match your current filters.</p>
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
            dispatch(fetchAppointments(undefined));
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
            dispatch(fetchAppointments(undefined));
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
            dispatch(fetchAppointments(undefined));
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

  return (
    <div className={`bg-white rounded-2xl border p-5 transition-all duration-300 group relative flex flex-col md:flex-row md:items-center gap-6 ${
      isPlatform ? 'border-[#CBFF38] shadow-sm' : 'border-gray-100 hover:border-gray-300'
    }`}>
      {/* Temporal Node */}
      <div className="flex flex-col items-center justify-center size-16 bg-black rounded-xl text-[#CBFF38] shrink-0 group-hover:scale-105 transition-transform">
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
              {appointment.isBlocked ? 'Blocked Time' : `${appointment.client?.firstName} ${appointment.client?.lastName}`}
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
      <div className="flex items-center gap-2 shrink-0 md:border-l border-gray-100 md:pl-6">
        {!appointment.isBlocked && (
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
