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
      {/* Premium Header */}
      <div className="bg-black text-white pt-16 pb-24 px-6 md:px-10 rounded-b-[48px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] size-[500px] bg-[#CBFF38]/10 blur-[120px] rounded-full" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
              <div className="size-1.5 rounded-full bg-[#CBFF38] animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CBFF38] italic">Live Operations</span>
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Appointments</h1>
              <p className="text-gray-400 font-medium max-w-md">Manage and track your clinic appointments in real-time.</p>
            </div>
          </div>
          {activeClinicId && (
            <button
              onClick={() => setShowBookingModal(true)}
              className="group h-14 px-8 bg-[#CBFF38] text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white transition-all shadow-xl shadow-lime-500/10 flex items-center gap-3"
            >
              <Calendar className="group-hover:scale-110 transition-transform" size={18} />
              Book Appointment
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 -mt-10 relative z-20 space-y-8 pb-20">
        <div className="bg-white p-4 rounded-[32px] shadow-xl border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search client or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 h-14 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black font-bold text-sm"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-14 px-6 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black font-black uppercase italic text-xs tracking-widest appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-14 px-6 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black font-black uppercase text-xs tracking-widest cursor-pointer"
          />

          <button
            onClick={() => {
              setSelectedStatus('all');
              setSearchTerm('');
              setSelectedDate('');
            }}
            className="h-14 px-6 bg-black text-[#CBFF38] rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-800 transition-all"
          >
            Clear Filters
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
    <div className={`bg-white rounded-[40px] border p-8 transition-all duration-500 group relative overflow-hidden flex flex-col md:flex-row md:items-center gap-8 ${isPlatform ? 'border-[#CBFF38] shadow-lime-500/5' : 'border-gray-100 shadow-sm hover:border-black'
      }`}>
      {/* Temporal Node */}
      <div className="flex flex-col items-center justify-center size-24 bg-black rounded-[32px] text-[#CBFF38] shrink-0 shadow-lg group-hover:rotate-6 transition-transform">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
          {new Date(appointment.startTime).toLocaleDateString([], { month: 'short' })}
        </span>
        <span className="text-3xl font-black italic tracking-tighter">
          {new Date(appointment.startTime).getDate()}
        </span>
        <span className="text-[10px] font-black italic">
          {new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
        </span>
      </div>

      {/* Content Cluster */}
      <div className="flex-1 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest italic border ${status === 'confirmed' ? 'bg-[#CBFF38] text-black border-[#CBFF38]' :
              status === 'pending' ? 'bg-black text-[#CBFF38] border-black' : 'bg-gray-100 text-gray-400 border-gray-100'
            }`}>
            {appointment.status.replace('_', ' ')}
          </span>
          {isPlatform && (
            <span className="px-3 py-1 bg-black text-[#CBFF38] text-[8px] font-black rounded-full uppercase tracking-widest italic animate-pulse">
              Diamond Client
            </span>
          )}
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
            ID: {appointment.id.slice(0, 8)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-1">
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Client</p>
            <h4 className="text-xl font-black uppercase italic tracking-tighter text-gray-900 leading-none">
              {appointment.isBlocked ? 'Blocked Time' : `${appointment.client?.firstName} ${appointment.client?.lastName}`}
            </h4>
            <p className="text-xs font-bold text-gray-400 italic">{appointment.client?.email || 'N/A'}</p>
          </div>

          <div className="space-y-1">
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Service</p>
            <h4 className="text-xl font-black uppercase italic tracking-tighter text-gray-900 leading-none">
              {appointment.serviceName || appointment.service?.treatment?.name}
            </h4>
            <p className="text-xs font-bold text-[#CBFF38] bg-black inline-block px-1.5 rounded italic">€{appointment.totalAmount || appointment.service?.price}</p>
          </div>

          <div className="space-y-1 hidden lg:block">
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Booked By</p>
            <div className="flex items-center gap-2">
              <div className="size-4 bg-gray-100 rounded-full flex items-center justify-center">
                <User size={8} />
              </div>
              <span className="text-xs font-black uppercase italic text-gray-900">
                {appointment.bookedByInfo ? appointment.bookedByInfo.name : 'System'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Layer */}
      <div className="flex md:flex-col gap-2 shrink-0">
        {!appointment.isBlocked && (
          <>
            {status === 'pending' && hasPermission(user?.role, 'canConfirmAppointments') && (
              <button onClick={onConfirm} className="h-10 px-6 bg-black text-[#CBFF38] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#CBFF38] hover:text-black transition-all border border-black group-hover:border-transparent">
                Confirm
              </button>
            )}
            {status === 'confirmed' && hasPermission(user?.role, 'canCompleteAppointments') && (
              <button onClick={onExecute} className="h-10 px-6 bg-[#CBFF38] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-[#CBFF38] transition-all shadow-lg shadow-lime-500/20">
                Execute
              </button>
            )}
            {['pending', 'confirmed'].includes(status) && (
              <div className="flex gap-2">
                {hasPermission(user?.role, 'canMarkNoShow') && (
                   <button onClick={onNoShow} className="h-10 px-4 bg-orange-50 text-orange-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all border border-orange-100 italic">
                      No Show
                   </button>
                )}
                <button onClick={onReschedule} className="size-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-black hover:text-[#CBFF38] transition-all border border-gray-100 hover:border-black">
                  <Clock size={16} />
                </button>
                <button onClick={onCancel} className="size-10 bg-gray-50 text-red-100 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border border-red-500 hover:border-red-500">
                  <X size={16} />
                </button>
              </div>
            )}
          </>
        )}
        <button onClick={onOverview} className="h-10 px-6 bg-gray-50 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all border border-gray-100 hover:border-black italic">
          Overview
        </button>
      </div>
    </div>
  );
};

export default AppointmentsPage;
