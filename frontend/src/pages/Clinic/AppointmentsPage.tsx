import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchAppointments, updateAppointmentStatus } from '../../store/slices/clinicSlice';
import { AppointmentStatus } from '../../types/clinic.types';
import { hasPermission } from '../../utils/rolePermissions';
import { Calendar, Clock, User, DollarSign, Filter, Search } from 'lucide-react';
import AppointmentExecutionModal from '../../components/clinic/AppointmentExecutionModal';

const AppointmentsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { appointments, isLoading } = useSelector((state: RootState) => state.clinic);
  const user = useSelector((state: RootState) => state.auth.user);

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showExecutionModal, setShowExecutionModal] = useState(false);

  useEffect(() => {
    dispatch(fetchAppointments());
  }, [dispatch]);

  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus = selectedStatus === 'all' || apt.status === selectedStatus;
    const matchesSearch =
      searchTerm === '' ||
      apt.client?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.client?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.service?.name?.toLowerCase().includes(searchTerm.toLowerCase());
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

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    no_show: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
        <p className="text-gray-600 mt-2">Manage and track all clinic appointments</p>
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
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-start justify-between">
                {/* Left Side - Appointment Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${
                        statusColors[appointment.status]
                      }`}
                    >
                      {appointment.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      #{appointment.id.slice(0, 8)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Client Info */}
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Client</p>
                        <p className="font-semibold text-gray-900">
                          {appointment.client?.firstName} {appointment.client?.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{appointment.client?.email}</p>
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
                        <p className="font-semibold text-gray-900">{appointment.service?.name}</p>
                        <p className="text-sm text-gray-600">${appointment.totalAmount}</p>
                      </div>
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{appointment.notes}</p>
                    </div>
                  )}
                </div>

                {/* Right Side - Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  {appointment.status === AppointmentStatus.PENDING &&
                    hasPermission(user?.role, 'canConfirmAppointments') && (
                      <button
                        onClick={() => handleConfirm(appointment.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Confirm
                      </button>
                    )}

                  {appointment.status === AppointmentStatus.CONFIRMED &&
                    hasPermission(user?.role, 'canCompleteAppointments') && (
                      <button
                        onClick={() => handleExecute(appointment)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Execute
                      </button>
                    )}

                  {(appointment.status === AppointmentStatus.PENDING ||
                    appointment.status === AppointmentStatus.CONFIRMED) &&
                    hasPermission(user?.role, 'canConfirmAppointments') && (
                      <button
                        onClick={() => handleCancel(appointment.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    )}

                  <button
                    onClick={() => {
                      /* Navigate to details */
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
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
          onClose={() => {
            setShowExecutionModal(false);
            setSelectedAppointment(null);
          }}
          onComplete={() => {
            setShowExecutionModal(false);
            setSelectedAppointment(null);
            dispatch(fetchAppointments());
          }}
        />
      )}
    </div>
  );
};

export default AppointmentsPage;
