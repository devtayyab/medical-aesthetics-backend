import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Calendar, TrendingUp } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { RootState } from '@/store';
import { bookingAPI } from '@/services/api';
import { promptDialog } from '@/components/molecules/ConfirmDialog';
import { LEGEND_STYLES, STRIPED_BACKGROUND } from './calendarRows';
import { PendingList } from './PendingList';
import { downloadXlsx, athensDateTime } from '@/utils/exportXlsx';

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
  const canSeeAll = isSuperAdmin || user?.role === 'admin' || user?.role === 'manager' || user?.role === 'salesperson';

  // ── View State ──────────────────────────────────────────────────────────────
  const [viewDate, setViewDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarView>('week');
  // A salesperson opens on one clinic (the last one they viewed), not "All Clinics"; they can
  // still widen the view. Everyone sees every salesperson's row: all appointments are visible
  // to the whole team, each in the row of the salesperson it belongs to.
  const isSalesperson = user?.role === 'salesperson';
  const lastClinicKey = `calendar.lastClinicId:${user?.id || ''}`;
  const [filters, setFilters] = useState<CalendarFilters>(() => {
    if (!isSalesperson) return DEFAULT_FILTERS;
    let last = '';
    try {
      last = localStorage.getItem(lastClinicKey) || '';
    } catch {
      // storage unavailable
    }
    return { ...DEFAULT_FILTERS, clinicId: last || 'all' };
  });
  const [selectedSalesPersonId, setSelectedSalesPersonId] = useState<string>(
    canSeeAll ? 'all' : user?.id || 'all',
  );
  // Cancelled appointments are hidden unless the user asks for them
  const [hideCancelled, setHideCancelled] = useState(true);

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

  // Remember the clinic being viewed so Availability opens on it too.
  React.useEffect(() => {
    try {
      if (filters.clinicId && filters.clinicId !== 'all') {
        sessionStorage.setItem('calendar.viewedClinicId', filters.clinicId);
        localStorage.setItem(lastClinicKey, filters.clinicId);
      }
    } catch {
      // storage unavailable: nothing to remember
    }
  }, [filters.clinicId, lastClinicKey]);

  // ── Data ────────────────────────────────────────────────────────────────────
  // The salesperson picked in the sidebar / filters only narrows which ROW is shown. It is not
  // sent to the API, which would return everyone else's appointments masked as "Busy".
  const rowSalesPersonId = selectedSalesPersonId !== 'all' ? selectedSalesPersonId : filters.salesPersonId;
  const filtersWithSalesPerson = useMemo(() => ({ ...filters, salesPersonId: 'all' }), [filters]);

  const { appointments, clinics, salespersons, blockedSlots, isLoading, refreshAppointments } =
    useCalendarData({
      viewDate,
      viewMode,
      filters: filtersWithSalesPerson,
    });

  // Filter salespersons for sidebar based on role
  const visibleSalespersons = useMemo(() => {
    if (canSeeAll) return salespersons;
    return salespersons.filter((sp: any) => sp.id === user?.id);
  }, [salespersons, canSeeAll, user?.id]);

  // ── Filtered appointments (by payment status, which isn't server-side) ──────
  const displayAppointments = useMemo(() => {
    // Asking for the CANCELLED status explicitly shows them regardless of the toggle
    const dropCancelled = hideCancelled && filters.status !== 'CANCELLED';
    return appointments.filter((apt: CalendarAppointment) => {
      if (dropCancelled && String(apt.status || '').toUpperCase() === 'CANCELLED') return false;
      return filters.paymentStatus === 'all' || apt.computedPaymentStatus === filters.paymentStatus;
    });
  }, [appointments, filters.paymentStatus, filters.status, hideCancelled]);

  // Salesperson's first visit (no last clinic yet) or a remembered clinic that no longer
  // exists: open on the first clinic of the list instead of all clinics at once.
  const defaultClinicApplied = React.useRef(false);
  useEffect(() => {
    if (!isSalesperson || defaultClinicApplied.current || clinics.length === 0) return;
    defaultClinicApplied.current = true;
    const known = filters.clinicId !== 'all' && clinics.some((c: any) => c.id === filters.clinicId);
    if (!known) setFilters(prev => ({ ...prev, clinicId: clinics[0].id }));
  }, [isSalesperson, clinics, filters.clinicId]);

  // ── Effective clinic timezone for the current time red line ─────────────────
  // When a specific clinic is selected, use its timezone so the red line
  // aligns with appointment positions. Fall back to the first available
  // clinic's timezone, or undefined (which will use browser local time).
  const effectiveClinicTimezone = useMemo(() => {
    if (filters.clinicId !== 'all') {
      const c = clinics.find((cl: any) => cl.id === filters.clinicId);
      return c?.timezone || 'Europe/Athens';
    }
    // "all" mode: the platform timezone, not whichever clinic sorts first or the browser's
    return 'Europe/Athens';
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
      // Use LOCAL date parts, not toISOString() — the latter converts a local-midnight Date to
      // UTC and can roll back to the previous day for positive-UTC-offset users (e.g. Berlin).
      const d = payload.date;
      const localDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      setInitialAptData({
        date: localDateStr,
        startTime: payload.timeStr,
        clinicId: filters.clinicId !== 'all' ? filters.clinicId : clinics[0]?.id || '',
        // Clicked inside a salesperson's row / column: that salesperson.
        salesPersonId:
          payload.salesPersonId || (rowSalesPersonId !== 'all' ? rowSalesPersonId : user?.id || ''),
      });
      setAptModalMode('create');
      setSelectedApt(null);
      setIsAptModalOpen(true);
    },
    [filters.clinicId, clinics, rowSalesPersonId, user?.id],
  );

  const handleAppointmentEdit = useCallback((apt: CalendarAppointment) => {
    setSelectedApt(apt);
    setAptModalMode('edit');
    setInitialAptData(undefined);
    setIsAptModalOpen(true);
  }, []);

  const handleNewAppointment = useCallback(() => {
    setInitialAptData({
      // Only prefill a clinic the user explicitly filtered on — never guess one.
      clinicId: filters.clinicId !== 'all' ? filters.clinicId : '',
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

  // ── Pending Only (PENDING): everything awaiting confirmation, all clinics & dates ──
  const [pendingOnly, setPendingOnly] = useState(false);
  const [pendingAppointments, setPendingAppointments] = useState<CalendarAppointment[]>([]);
  const [isPendingLoading, setIsPendingLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    setIsPendingLoading(true);
    try {
      const res: any = await bookingAPI.getClinicAppointments({ status: 'PENDING' });
      const list = (Array.isArray(res?.data) ? res.data : [])
        .filter((a: any) => !a.isBlocked && !a.isMaskedPrivate && String(a.status || '').toUpperCase() === 'PENDING')
        .map((a: any) => ({ computedPaymentStatus: 'UNPAID', colorIndex: 0, ...a }));
      setPendingAppointments(list);
    } catch (err) {
      console.error('Failed to load pending appointments', err);
    } finally {
      setIsPendingLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const visiblePending = useMemo(
    () =>
      filters.clinicId === 'all'
        ? pendingAppointments
        : pendingAppointments.filter(a => (a.clinicId || a.clinic?.id) === filters.clinicId),
    [pendingAppointments, filters.clinicId],
  );

  const handleRefresh = useCallback(() => {
    refreshAppointments();
    loadPending();
  }, [refreshAppointments, loadPending]);

  const handleConfirmPending = useCallback(
    async (apt: CalendarAppointment) => {
      setConfirmingId(apt.id);
      try {
        await bookingAPI.updateStatus(apt.id, 'CONFIRMED');
        toast.success('Appointment confirmed.');
        handleRefresh();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to confirm appointment.');
      } finally {
        setConfirmingId(null);
      }
    },
    [handleRefresh],
  );

  // ── Card pop-up actions: Confirm · Cancel (Reschedule opens the appointment form) ──
  const [popoverAction, setPopoverAction] = useState<'confirm' | 'cancel' | null>(null);

  const handlePopoverConfirm = useCallback(
    async (apt: CalendarAppointment) => {
      setPopoverAction('confirm');
      try {
        await bookingAPI.updateStatus(apt.id, 'CONFIRMED');
        toast.success('Appointment confirmed.');
        handleRefresh();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to confirm appointment.');
      } finally {
        setPopoverAction(null);
      }
    },
    [handleRefresh],
  );

  const handlePopoverCancel = useCallback(
    async (apt: CalendarAppointment) => {
      // A paid appointment needs the refund decision, which lives in the appointment form.
      const paid = Number(apt.amountPaid || 0) || Number(apt.advancePaymentAmount || 0);
      if (paid > 0) {
        handleAppointmentEdit(apt);
        toast('This appointment is paid: cancel it from the form to decide about the refund.');
        return;
      }
      const reason = await promptDialog({
        message: 'Cancellation reason (optional, visible to the client):',
        multiline: true,
      });
      if (reason === null) return;
      setPopoverAction('cancel');
      try {
        await bookingAPI.updateStatus(apt.id, 'CANCELLED', reason.trim() ? { reason: reason.trim() } : undefined);
        toast.success('Appointment cancelled.');
        handleRefresh();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to cancel appointment.');
      } finally {
        setPopoverAction(null);
      }
    },
    [handleRefresh, handleAppointmentEdit],
  );

  const handleModalSuccess = useCallback(() => {
    handleRefresh();
  }, [handleRefresh]);

  // ── Admin backup: all appointments (every clinic, all dates) as an Excel file ──
  const isAdminUser = isSuperAdmin || user?.role === 'admin';
  const [isExporting, setIsExporting] = useState(false);
  const handleExportExcel = useCallback(async () => {
    setIsExporting(true);
    try {
      const res: any = await bookingAPI.getClinicAppointments({});
      const list: any[] = (Array.isArray(res?.data) ? res.data : []).filter((a: any) => !a.isBlocked);
      const fullName = (u: any) => (u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '');
      downloadXlsx(
        `appointments_${new Date().toISOString().slice(0, 10)}`,
        'Appointments',
        ['Date / time', 'End', 'Status', 'Client', 'Phone', 'Email', 'Treatment', 'Clinic', 'Doctor', 'Representative', 'Booked by', 'Total', 'Paid', 'Payment method', 'Source', 'Notes', 'Created', 'ID'],
        list.map((a: any) => [
          athensDateTime(a.startTime),
          athensDateTime(a.endTime),
          a.status,
          fullName(a.client) || a.clientDetails?.fullName || a.displayName || '',
          a.client?.phone || a.clientDetails?.phone || '',
          a.client?.email || a.clientDetails?.email || '',
          [a.serviceName || a.service?.treatment?.name || a.service?.name, ...(a.additionalServices || []).map((s: any) => s?.name || s?.treatment?.name)].filter(Boolean).join(' + '),
          a.clinic?.name || '',
          a.doctorName || a.providerName || '',
          fullName(a.representative),
          fullName(a.bookedBy),
          Number(a.totalAmount || 0),
          Number(a.amountPaid || 0),
          a.paymentMethod || '',
          a.appointmentSource || '',
          a.notes || '',
          athensDateTime(a.createdAt),
          a.id,
        ]),
      );
      toast.success(`${list.length} appointments exported`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  }, []);

  // ── Deep link from a notification / email: /crm/calendar?appointmentId=... ──
  // Jumps to the appointment's date and opens it (with the Confirm button when pending).
  const [searchParams, setSearchParams] = useSearchParams();
  const linkedAppointmentId = searchParams.get('appointmentId');
  const [linkedAppointment, setLinkedAppointment] = useState<CalendarAppointment | null>(null);

  useEffect(() => {
    if (!linkedAppointmentId) return;
    let cancelled = false;
    (async () => {
      try {
        const res: any = await bookingAPI.getAppointment(linkedAppointmentId);
        if (cancelled || !res?.data?.id) return;
        setViewDate(new Date(res.data.startTime));
        setLinkedAppointment({ computedPaymentStatus: 'UNPAID', colorIndex: 0, ...res.data });
      } catch (err: any) {
        if (!cancelled) toast.error(err?.response?.data?.message || 'Appointment not found.');
      } finally {
        if (!cancelled) {
          const next = new URLSearchParams(searchParams);
          next.delete('appointmentId');
          setSearchParams(next, { replace: true });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedAppointmentId]);

  useEffect(() => {
    if (!linkedAppointment) return;
    // Prefer the calendar's own (enriched) copy once its week has loaded; if it is not in
    // the list (e.g. hidden by a filter), open what was fetched directly.
    const inCalendar = appointments.find((a: CalendarAppointment) => a.id === linkedAppointment.id);
    if (inCalendar) {
      handleAppointmentEdit(inCalendar);
      setLinkedAppointment(null);
      return;
    }
    const timer = setTimeout(() => {
      handleAppointmentEdit(linkedAppointment);
      setLinkedAppointment(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [linkedAppointment, appointments, handleAppointmentEdit]);

  return (
    <div className="flex flex-1 h-full w-full min-h-0 bg-slate-50 overflow-hidden">
      {/* Salesperson Sidebar */}
      <SalesPersonSidebar
        salespersons={visibleSalespersons}
        selectedId={selectedSalesPersonId}
        currentUserId={user?.id}
        currentUserName={
          user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined
        }
        isManager={canSeeAll}
        onSelect={setSelectedSalesPersonId}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0 h-full overflow-hidden">
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
          onRefresh={handleRefresh}
          pendingOnly={pendingOnly}
          pendingCount={pendingAppointments.length}
          onTogglePendingOnly={() => setPendingOnly(v => !v)}
          onExportExcel={isAdminUser ? handleExportExcel : undefined}
          isExporting={isExporting}
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

        {/* Legend: card colour = appointment status */}
        {!pendingOnly && (
          <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-x-4 gap-y-2 flex-wrap">
            {LEGEND_STYLES.map(s => (
              <span key={s.key} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                <span
                  className="w-4 h-4 rounded"
                  style={{ background: s.bg, border: `1px ${s.dashed ? 'dashed' : 'solid'} ${s.border}` }}
                />
                {s.label}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <span className="w-4 h-4 rounded border border-slate-200" style={STRIPED_BACKGROUND} />
              Blocked / Closed
            </span>

            <label className="ml-auto flex items-center gap-2 cursor-pointer select-none">
              <span className="text-[11px] font-bold text-slate-700">Show Cancelled</span>
              <input
                type="checkbox"
                className="sr-only peer"
                checked={!hideCancelled}
                onChange={e => setHideCancelled(!e.target.checked)}
              />
              <span className="relative w-9 h-5 rounded-full bg-slate-300 peer-checked:bg-indigo-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-400" />
            </label>
          </div>
        )}

        {/* Calendar Grid */}
        {pendingOnly && (
          <div className="flex-1 min-h-0 overflow-hidden bg-slate-50 flex flex-col">
            <PendingList
              appointments={visiblePending}
              isLoading={isPendingLoading}
              confirmingId={confirmingId}
              onOpen={handleAppointmentEdit}
              onConfirm={handleConfirmPending}
            />
          </div>
        )}
        <div className={`flex-1 min-h-0 overflow-hidden bg-white flex-col ${pendingOnly ? 'hidden' : 'flex'}`}>
          <CalendarGrid
            viewDate={viewDate}
            viewMode={viewMode}
            appointments={displayAppointments}
            blockedSlots={blockedSlots}
            salespersons={salespersons}
            selectedSalesPersonId={rowSalesPersonId}
            clinics={clinics}
            selectedClinicId={filters.clinicId}
            clinicTimezone={effectiveClinicTimezone}
            busyAction={popoverAction}
            onSlotClick={handleSlotClick}
            onAppointmentEdit={handleAppointmentEdit}
            onAppointmentConfirm={handlePopoverConfirm}
            onAppointmentCancel={handlePopoverCancel}
            onRefresh={handleRefresh}
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
        initialClinicId={filters.clinicId}
        clinics={clinics}
        salespersons={salespersons}
        onClose={() => setIsBlockSlotOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <BlockDayModal
        isOpen={isBlockDayOpen}
        initialDate={blockInitialDate}
        initialClinicId={filters.clinicId}
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
        hideCancelled={hideCancelled}
        onHideCancelledChange={setHideCancelled}
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
