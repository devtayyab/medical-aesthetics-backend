import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchClinicProfile, fetchAppointments } from '../../store/slices/clinicSlice';
import { canAccessClinicDashboard, hasPermission } from '../../utils/rolePermissions';
import { UserRole, AppointmentStatus } from '../../types/clinic.types';
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

const ClinicDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const { profile, appointments, isLoading } = useSelector((state: RootState) => state.clinic);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    // Check if user has access
    if (!user || !canAccessClinicDashboard(user.role)) {
      navigate('/');
      return;
    }

    // Fetch data
    dispatch(fetchClinicProfile());
    dispatch(fetchAppointments());
  }, [dispatch, user, navigate]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(
      (apt) => apt.startTime.split('T')[0] === today
    );

    return {
      totalToday: todayAppointments.length,
      pending: appointments.filter((apt) => apt.status === AppointmentStatus.PENDING).length,
      confirmed: appointments.filter((apt) => apt.status === AppointmentStatus.CONFIRMED).length,
      completed: appointments.filter((apt) => apt.status === AppointmentStatus.COMPLETED).length,
      totalRevenue: appointments
        .filter((apt) => apt.status === AppointmentStatus.COMPLETED)
        .reduce((sum, apt) => sum + apt.totalAmount, 0),
    };
  }, [appointments]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {profile?.name || 'Clinic'}
        </h1>
        <p className="text-gray-600 mt-2">Here's what's happening today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Today's Appointments"
          value={stats.totalToday}
          icon={<Calendar className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={<Clock className="w-6 h-6" />}
          color="yellow"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={<CheckCircle className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          icon={<DollarSign className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Today's Appointments */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Today's Appointments</h2>
            <button
              onClick={() => navigate('/clinic/appointments')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {appointments
              .filter((apt) => apt.startTime.split('T')[0] === new Date().toISOString().split('T')[0])
              .slice(0, 5)
              .map((appointment) => (
                <AppointmentItem key={appointment.id} appointment={appointment} />
              ))}
            {appointments.filter(
              (apt) => apt.startTime.split('T')[0] === new Date().toISOString().split('T')[0]
            ).length === 0 && (
              <p className="text-gray-500 text-center py-4">No appointments today</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {hasPermission(user?.role as UserRole, 'canViewAppointments') && (
              <ActionButton
                label="Appointments"
                icon={<Calendar />}
                onClick={() => navigate('/clinic/appointments')}
              />
            )}
            {hasPermission(user?.role as UserRole, 'canViewClients') && (
              <ActionButton
                label="Clients"
                icon={<Users />}
                onClick={() => navigate('/clinic/clients')}
              />
            )}
            {hasPermission(user?.role as UserRole, 'canViewServices') && (
              <ActionButton
                label="Services"
                icon={<DollarSign />}
                onClick={() => navigate('/clinic/services')}
              />
            )}
            {hasPermission(user?.role as UserRole, 'canViewAnalytics') && (
              <ActionButton
                label="Analytics"
                icon={<TrendingUp />}
                onClick={() => navigate('/clinic/analytics')}
              />
            )}
          </div>
        </div>
      </div>

      {/* Pending Actions */}
      {stats.pending > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
          <div>
            <h3 className="font-semibold text-yellow-900">Pending Confirmations</h3>
            <p className="text-yellow-700 text-sm mt-1">
              You have {stats.pending} appointment{stats.pending > 1 ? 's' : ''} waiting for confirmation
            </p>
            <button
              onClick={() => navigate('/clinic/appointments?status=pending')}
              className="mt-2 text-sm font-medium text-yellow-600 hover:text-yellow-700"
            >
              Review Now →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'yellow' | 'green' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
};

// Appointment Item Component
interface AppointmentItemProps {
  appointment: any;
}

const AppointmentItem: React.FC<AppointmentItemProps> = ({ appointment }) => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-1">
        <p className="font-medium text-gray-900">
          {appointment.client?.firstName} {appointment.client?.lastName}
        </p>
        <p className="text-sm text-gray-600">{appointment.service?.name}</p>
        <p className="text-xs text-gray-500">
          {new Date(appointment.startTime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusColors[appointment.status as keyof typeof statusColors]
        }`}
      >
        {appointment.status}
      </span>
    </div>
  );
};

// Action Button Component
interface ActionButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ label, icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <div className="text-blue-600 mb-2">{icon}</div>
      <span className="text-sm font-medium text-gray-900">{label}</span>
    </button>
  );
};

export default ClinicDashboard;
