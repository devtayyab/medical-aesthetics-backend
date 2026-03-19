import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchAppointments, updateAppointmentStatus } from '../../store/slices/clinicSlice';
import { AppointmentStatus } from '../../types/clinic.types';
import { hasPermission } from '../../utils/rolePermissions';
import { Calendar, Clock, User, DollarSign, Search } from 'lucide-react';
import AppointmentExecutionModal from '../../components/clinic/AppointmentExecutionModal';
import ClinicBookingModal from '../../components/clinic/ClinicBookingModal';
import RescheduleModal from '../../components/clinic/RescheduleModal';
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

  // Get clinicId from first appointment or user context
  const clinicId = user?.role === 'clinic_owner' ? (user as any).ownedClinics?.[0]?.id : (user as any).associatedClinicId;
  const activeClinicId = clinicId || appointments[0]?.clinicId;

  useEffect(() => {
    dispatch(fetchAppointments(undefined));
  }, [dispatch]);

  const isDoctor = user?.role === 'doctor';
  const filteredAppointments = appointments.filter((apt) => {
    const matchesProvider = !isDoctor || apt.providerId === user?.id;
    const matchesStatus = selectedStatus === 'all' || apt.status === selectedStatus;
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

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    no_show: 'bg-orange-100 text-orange-800 border-orange-200',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{isDoctor ? 'My Appointments' : 'Appointments'}</h1>
          <p className="text-gray-600 mt-2">{isDoctor ? 'Manage and track your appointments' : 'Manage and track all clinic appointments'}</p>
        </div>
        {activeClinicId && (
          <button
            onClick={() => setShowBookingModal(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Calendar className="w-5 h-5" />
            Book Appointment
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search client or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>

          {/* Date Filter */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSelectedStatus('all');
              setSearchTerm('');
              setSelectedDate('');
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments found</h3>
          <p className="text-gray-600">Try adjusting your filters or search criteria</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className={`rounded-lg shadow hover:shadow-md transition-shadow p-6 border-l-4 ${appointment.appointmentSource === 'platform_broker'
                ? 'bg-blue-50 border-blue-500 shadow-blue-100'
                : 'bg-white border-white'
                }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between">
                {/* Left Side - Appointment Info */}
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-4 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium border capitalize ${statusColors[appointment.status]
                        }`}
                    >
                      {appointment.status.replace('_', ' ')}
                    </span>
                    {appointment.appointmentSource === 'platform_broker' ? (
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded uppercase tracking-wider">
                        Beauty Doctors
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-600 text-white text-[10px] font-bold rounded uppercase tracking-wider">
                        Clinic Direct
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      #{appointment.id.slice(0, 8)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {/* Client Info */}
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Client</p>
                        <p className="font-semibold text-gray-900">
                          {appointment.isBlocked ? 'Blocked Time' : `${appointment.client?.firstName} ${appointment.client?.lastName}`}
                        </p>
                        {!appointment.isBlocked && (
                          <p className="text-sm text-gray-600 truncate max-w-[150px]">{appointment.client?.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Time Info */}
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Date & Time</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(appointment.startTime).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(appointment.startTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Service & Amount */}
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Service</p>
                        <p className="font-semibold text-gray-900">{appointment.serviceName || appointment.service?.treatment?.name}</p>
                        {!appointment.isBlocked && (
                          <p className="text-sm text-gray-600">${appointment.service?.price}</p>
                        )}
                      </div>
                    </div>

                    {/* Sales Rep Info */}
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Sales Rep</p>
                        <p className="font-semibold text-gray-900">
                          {appointment.bookedByInfo ? appointment.bookedByInfo.name : 'Clinic Direct'}
                        </p>
                        {appointment.bookedByInfo && (
                          <p className="text-xs text-gray-500 capitalize">{appointment.bookedByInfo.role?.replace('_', ' ')}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {!appointment.isBlocked && appointment.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{appointment.notes}</p>
                    </div>
                  )}
                </div>

                {/* Right Side - Actions */}
                <div className="flex flex-row md:flex-col gap-2 mt-4 md:mt-0 md:ml-4 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                  {!appointment.isBlocked && (
                    <>
                      {appointment.status === AppointmentStatus.PENDING &&
                        hasPermission(user?.role, 'canConfirmAppointments') && (
                          <button
                            onClick={() => handleConfirm(appointment.id)}
                            className="flex-1 md:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                          >
                            Confirm
                          </button>
                        )}

                      {appointment.status === AppointmentStatus.CONFIRMED &&
                        hasPermission(user?.role, 'canCompleteAppointments') && (
                          <button
                            onClick={() => handleExecute(appointment)}
                            className="flex-1 md:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium whitespace-nowrap"
                          >
                            Execute
                          </button>
                        )}

                      {(appointment.status === AppointmentStatus.PENDING ||
                        appointment.status === AppointmentStatus.CONFIRMED) &&
                        hasPermission(user?.role, 'canMarkNoShow') && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowRescheduleModal(true);
                              }}
                              className="flex-1 md:flex-none px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium whitespace-nowrap"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => handleCancel(appointment.id)}
                              className="flex-1 md:flex-none px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium whitespace-nowrap"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm('Mark this client as No Show?')) {
                                  await dispatch(updateAppointmentStatus({ id: appointment.id, status: AppointmentStatus.NO_SHOW }));
                                }
                              }}
                              className="flex-1 md:flex-none px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium whitespace-nowrap"
                            >
                              No Show
                            </button>
                          </>
                        )}
                    </>
                  )}

                  <button
                    onClick={() => {
                      /* Navigate to details */
                    }}
                    className="flex-1 md:flex-none px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Appointment Execution Modal */}
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

      {/* Direct Booking Modal */}
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

export default AppointmentsPage;
