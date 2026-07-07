import React, { useState, useMemo, useCallback } from 'react';
import { CheckCircle2, XCircle, Clock, Calendar, TrendingUp } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

import { CalendarToolbar } from '../AppointmentCalendar/CalendarToolbar';
import { StaffSidebar } from './StaffSidebar';
import { StaffCalendarGrid } from './StaffCalendarGrid';
// Temporarily using AppointmentCalendar modals until they need to be decoupled.
import { AppointmentModal } from '../AppointmentCalendar/AppointmentModal';
import { BlockSlotModal } from '../AppointmentCalendar/BlockSlotModal';
import { BlockDayModal } from '../AppointmentCalendar/BlockDayModal';
import { FiltersPanel } from '../AppointmentCalendar/FiltersPanel';
import { useStaffDiaryData } from './useStaffDiaryData';

import type {
  CalendarView,
  StaffCalendarFilters,
  AppointmentFormData,
  SlotClickPayload,
  CalendarAppointment,
} from './types';

const DEFAULT_FILTERS: StaffCalendarFilters = {
  clinicId: 'all',
  providerId: 'all',
  status: 'all',
  paymentStatus: 'all',
};

interface StaffDiaryProps {
  clinicId?: string;
  onNewAppointment?: () => void;
}

export const StaffDiary: React.FC<StaffDiaryProps> = ({ clinicId, onNewAppointment }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // ── View State ──────────────────────────────────────────────────────────────
  const [viewDate, setViewDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarView>('week');
  const [filters, setFilters] = useState<StaffCalendarFilters>({
    ...DEFAULT_FILTERS,
    clinicId: clinicId || 'all'
  });
  const [selectedProviderId, setSelectedProviderId] = useState<string>('all');

  // ── Modal State ─────────────────────────────────────────────────────────────
  const [isAptModalOpen, setIsAptModalOpen] = useState(false);
  const [aptModalMode, setAptModalMode] = useState<'create' | 'edit'>('create');
  const [selectedApt, setSelectedApt] = useState<CalendarAppointment | null>(null);
  const [initialAptData, setInitialAptData] = useState<Partial<AppointmentFormData> | undefined>();

  const [isBlockSlotOpen, setIsBlockSlotOpen] = useState(false);
  const [isBlockDayOpen, setIsBlockDayOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [blockInitialDate, setBlockInitialDate] = useState<string | undefined>();
  const [blockInitialTime, setBlockInitialTime] = useState<string | undefined>();

  // ── Data ────────────────────────────────────────────────────────────────────
  const filtersWithProvider = useMemo(
    () => ({
      ...filters,
      providerId: selectedProviderId !== 'all' ? selectedProviderId : filters.providerId,
    }),
    [filters, selectedProviderId],
  );

  const { appointments, clinics, providers, blockedSlots, isLoading, refreshAppointments } =
    useStaffDiaryData({
      viewDate,
      viewMode,
      filters: filtersWithProvider,
    });

  // ── Filtered appointments (by payment status, which isn't server-side) ──────
  const displayAppointments = useMemo(() => {
    if (filters.paymentStatus === 'all') return appointments;
    return appointments.filter(
      (apt: CalendarAppointment) => apt.computedPaymentStatus === filters.paymentStatus,
    );
  }, [appointments, filters.paymentStatus]);

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = appointments.length;
    const confirmed = appointments.filter((a: CalendarAppointment) => a.status === 'CONFIRMED').length;
    const completed = appointments.filter(
      (a: CalendarAppointment) => a.status === 'COMPLETED' || a.status === 'EXECUTED',
    ).length;
    const cancelled = appointments.filter((a: CalendarAppointment) => a.status === 'CANCELLED').length;
    const noShow = appointments.filter((a: CalendarAppointment) => a.status === 'NO_SHOW').length;
    return { total, confirmed, completed, cancelled, noShow };
  }, [appointments]);

  // ── Active filter count ──────────────────────────────────────────────────────
  const activeFilterCount = useMemo(
    () =>
      [
        filters.clinicId !== 'all',
        filters.providerId !== 'all',
        filters.status !== 'all',
        filters.paymentStatus !== 'all',
      ].filter(Boolean).length,
    [filters],
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSlotClick = useCallback(
    (payload: SlotClickPayload) => {
      setInitialAptData({
        date: payload.date.toISOString().split('T')[0],
        startTime: payload.timeStr,
        clinicId: filters.clinicId !== 'all' ? filters.clinicId : clinics[0]?.id || '',
        providerId: selectedProviderId !== 'all' ? selectedProviderId : user?.id || '',
      });
      setAptModalMode('create');
      setSelectedApt(null);
      setIsAptModalOpen(true);
    },
    [filters.clinicId, clinics, selectedProviderId, user?.id],
  );

  const handleAppointmentEdit = useCallback((apt: CalendarAppointment) => {
    setSelectedApt(apt);
    setAptModalMode('edit');
    setInitialAptData(undefined);
    setIsAptModalOpen(true);
  }, []);

  const handleNewAppointment = useCallback(() => {
    if (onNewAppointment) {
      onNewAppointment();
      return;
    }
    setInitialAptData({
      clinicId: filters.clinicId !== 'all' ? filters.clinicId : clinics[0]?.id || '',
      providerId: selectedProviderId !== 'all' ? selectedProviderId : user?.id || '',
    });
    setAptModalMode('create');
    setSelectedApt(null);
    setIsAptModalOpen(true);
  }, [filters.clinicId, clinics, selectedProviderId, user?.id, onNewAppointment]);

  const handleBlockSlot = useCallback(() => {
    setBlockInitialDate(undefined);
    setBlockInitialTime(undefined);
    setIsBlockSlotOpen(true);
  }, []);

  const handleBlockDay = useCallback(() => {
    setBlockInitialDate(undefined);
    setIsBlockDayOpen(true);
  }, []);

  const handleModalSuccess = useCallback(() => {
    refreshAppointments();
  }, [refreshAppointments]);

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden">
      {/* Provider / Clinic Sidebar */}
      <StaffSidebar
        providers={providers}
        selectedId={selectedProviderId}
        currentUserId={user?.id}
        currentUserName={
          user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined
        }
        isManager={isSuperAdmin}
        onSelect={setSelectedProviderId}
        clinics={clinics}
        selectedClinicId={filters.clinicId}
        onClinicChange={(clinicId) => {
           setFilters(prev => ({ ...prev, clinicId }));
           setSelectedProviderId('all');
        }}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <CalendarToolbar
          viewDate={viewDate}
          viewMode={viewMode}
          filters={filters as any}
          clinics={clinics}
          activeFilterCount={activeFilterCount}
          isLoading={isLoading}
          onViewDateChange={setViewDate}
          onViewModeChange={setViewMode}
          onTodayClick={() => setViewDate(new Date())}
          onFilterClinicChange={clinicId => setFilters(prev => ({ ...prev, clinicId }))}
          onNewAppointment={handleNewAppointment}
          onBlockSlot={handleBlockSlot}
          onBlockDay={handleBlockDay}
          onOpenFilters={() => setIsFiltersOpen(true)}
          onRefresh={refreshAppointments}
        />

        {/* Stats Strip */}
        <div className="bg-white border-b border-slate-100 px-4 py-2.5 flex items-center gap-3 overflow-x-auto">
          <StatBadge
            icon={<Calendar className="w-3.5 h-3.5" />}
            label="Total"
            value={stats.total}
            bg="bg-slate-100"
            text="text-slate-700"
          />
          <StatBadge
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            label="Confirmed"
            value={stats.confirmed}
            bg="bg-emerald-100"
            text="text-emerald-700"
          />
          <StatBadge
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            label="Completed"
            value={stats.completed}
            bg="bg-purple-100"
            text="text-purple-700"
          />
          <StatBadge
            icon={<XCircle className="w-3.5 h-3.5" />}
            label="Cancelled"
            value={stats.cancelled}
            bg="bg-red-100"
            text="text-red-700"
          />
          <StatBadge
            icon={<Clock className="w-3.5 h-3.5" />}
            label="No Show"
            value={stats.noShow}
            bg="bg-gray-100"
            text="text-gray-600"
          />
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-hidden bg-white flex flex-col">
          <StaffCalendarGrid
            viewDate={viewDate}
            viewMode={viewMode}
            appointments={displayAppointments}
            blockedSlots={blockedSlots}
            providers={providers}
            selectedProviderId={selectedProviderId}
            clinics={clinics}
            selectedClinicId={filters.clinicId}
            onSlotClick={handleSlotClick}
            onAppointmentEdit={handleAppointmentEdit}
            onRefresh={refreshAppointments}
          />
        </div>
      </div>

      {/* Modals */}
      {/* We cast to any for salespersons since the modals currently expect salespersons array. 
          We'll pass providers array to fill the same role in the dropdowns for now, 
          but if they are decoupled, they should accept providers explicitly. */}
      <AppointmentModal
        isOpen={isAptModalOpen}
        mode={aptModalMode}
        initialData={initialAptData as any}
        existingAppointment={selectedApt as any}
        clinics={clinics}
        salespersons={providers as any}
        appointments={appointments}
        blockedSlots={blockedSlots}
        currentUserId={user?.id}
        onClose={() => setIsAptModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <BlockSlotModal
        isOpen={isBlockSlotOpen}
        initialDate={blockInitialDate}
        initialTime={blockInitialTime}
        clinics={clinics}
        salespersons={providers as any}
        onClose={() => setIsBlockSlotOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <BlockDayModal
        isOpen={isBlockDayOpen}
        initialDate={blockInitialDate}
        clinics={clinics}
        onClose={() => setIsBlockDayOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <FiltersPanel
        isOpen={isFiltersOpen}
        filters={filters as any}
        clinics={clinics}
        salespersons={providers as any}
        onFiltersChange={setFilters as any}
        onClose={() => setIsFiltersOpen(false)}
      />
    </div>
  );
};

// ── Stat Badge Component ───────────────────────────────────────────────────────

interface StatBadgeProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
  text: string;
}

const StatBadge: React.FC<StatBadgeProps> = ({ icon, label, value, bg, text }) => (
  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${bg} flex-shrink-0`}>
    <span className={text}>{icon}</span>
    <div>
      <span className={`text-[10px] font-black leading-none ${text}`}>{value}</span>
      <span className={`text-[9px] font-semibold ml-1 ${text} opacity-70`}>{label}</span>
    </div>
  </div>
);

export default StaffDiary;
