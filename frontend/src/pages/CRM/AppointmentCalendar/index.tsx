import React, { useState, useMemo, useCallback } from 'react';
import { CheckCircle2, XCircle, Clock, Calendar, TrendingUp } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

import { CalendarToolbar } from './CalendarToolbar';
import { SalesPersonSidebar } from './SalesPersonSidebar';
import { CalendarGrid } from './CalendarGrid';
import { AppointmentModal } from './AppointmentModal';
import { BlockSlotModal } from './BlockSlotModal';
import { BlockDayModal } from './BlockDayModal';
import { FiltersPanel } from './FiltersPanel';
import { useCalendarData } from './useCalendarData';

import type {
  CalendarView,
  CalendarFilters,
  AppointmentFormData,
  SlotClickPayload,
  CalendarAppointment,
} from './types';

const DEFAULT_FILTERS: CalendarFilters = {
  clinicId: 'all',
  salesPersonId: 'all',
  status: 'all',
  paymentStatus: 'all',
};

export const AppointmentCalendar: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // ── View State ──────────────────────────────────────────────────────────────
  const [viewDate, setViewDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarView>('week');
  const [filters, setFilters] = useState<CalendarFilters>(DEFAULT_FILTERS);
  const [selectedSalesPersonId, setSelectedSalesPersonId] = useState<string>(
    isSuperAdmin ? 'all' : user?.id || 'all',
  );

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
  const filtersWithSalesPerson = useMemo(
    () => ({
      ...filters,
      salesPersonId:
        selectedSalesPersonId !== 'all'
          ? selectedSalesPersonId
          : filters.salesPersonId,
    }),
    [filters, selectedSalesPersonId],
  );

  const { appointments, clinics, salespersons, blockedSlots, isLoading, refreshAppointments } =
    useCalendarData({
      viewDate,
      viewMode,
      filters: filtersWithSalesPerson,
    });

  // Filter salespersons for sidebar based on role
  const visibleSalespersons = useMemo(() => {
    if (isSuperAdmin) return salespersons;
    return salespersons.filter((sp: any) => sp.id === user?.id);
  }, [salespersons, isSuperAdmin, user?.id]);

  // ── Filtered appointments (by payment status, which isn't server-side) ──────
  const displayAppointments = useMemo(() => {
    if (filters.paymentStatus === 'all') return appointments;
    return appointments.filter(
      (apt: CalendarAppointment) => apt.computedPaymentStatus === filters.paymentStatus,
    );
  }, [appointments, filters.paymentStatus]);

  // ── Effective clinic timezone for the current time red line ─────────────────
  // When a specific clinic is selected, use its timezone so the red line
  // aligns with appointment positions. Fall back to the first available
  // clinic's timezone, or undefined (which will use browser local time).
  const effectiveClinicTimezone = useMemo(() => {
    if (filters.clinicId !== 'all') {
      const c = clinics.find((cl: any) => cl.id === filters.clinicId);
      return c?.timezone || undefined;
    }
    // "all" mode: use the first clinic's timezone as a reasonable default
    return clinics[0]?.timezone || undefined;
  }, [filters.clinicId, clinics]);

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
        filters.salesPersonId !== 'all',
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
        salesPersonId:
          selectedSalesPersonId !== 'all' ? selectedSalesPersonId : user?.id || '',
      });
      setAptModalMode('create');
      setSelectedApt(null);
      setIsAptModalOpen(true);
    },
    [filters.clinicId, clinics, selectedSalesPersonId, user?.id],
  );

  const handleAppointmentEdit = useCallback((apt: CalendarAppointment) => {
    setSelectedApt(apt);
    setAptModalMode('edit');
    setInitialAptData(undefined);
    setIsAptModalOpen(true);
  }, []);

  const handleNewAppointment = useCallback(() => {
    setInitialAptData({
      clinicId: filters.clinicId !== 'all' ? filters.clinicId : clinics[0]?.id || '',
      salesPersonId: selectedSalesPersonId !== 'all' ? selectedSalesPersonId : user?.id || '',
    });
    setAptModalMode('create');
    setSelectedApt(null);
    setIsAptModalOpen(true);
  }, [filters.clinicId, clinics, selectedSalesPersonId, user?.id]);

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
      {/* Salesperson Sidebar */}
      <SalesPersonSidebar
        salespersons={visibleSalespersons}
        selectedId={selectedSalesPersonId}
        currentUserId={user?.id}
        currentUserName={
          user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined
        }
        isManager={isSuperAdmin}
        onSelect={setSelectedSalesPersonId}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <CalendarToolbar
          viewDate={viewDate}
          viewMode={viewMode}
          filters={filters}
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
          <CalendarGrid
            viewDate={viewDate}
            viewMode={viewMode}
            appointments={displayAppointments}
            blockedSlots={blockedSlots}
            salespersons={salespersons}
            selectedSalesPersonId={selectedSalesPersonId}
            clinics={clinics}
            selectedClinicId={filters.clinicId}
            clinicTimezone={effectiveClinicTimezone}
            onSlotClick={handleSlotClick}
            onAppointmentEdit={handleAppointmentEdit}
            onRefresh={refreshAppointments}
          />
        </div>
      </div>

      {/* Modals */}
      <AppointmentModal
        isOpen={isAptModalOpen}
        mode={aptModalMode}
        initialData={initialAptData}
        existingAppointment={selectedApt}
        clinics={clinics}
        salespersons={salespersons}
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
        salespersons={salespersons}
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
        filters={filters}
        clinics={clinics}
        salespersons={salespersons}
        onFiltersChange={setFilters}
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

export default AppointmentCalendar;
