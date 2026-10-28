import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { AppDispatch, RootState } from '@/store';
import { fetchClinicAppointments } from '@/store/slices/bookingSlice';
import { crmAPI, adminAPI, clinicsAPI } from '@/services/api';
import type { CalendarView, StaffCalendarFilters, ProviderResource } from './types';

const sanitizeTz = (tz?: string | null): string => {
  if (!tz || tz === 'null' || tz.trim() === '') return 'UTC';
  return tz;
};

export const getClinicLocalTime = (dateStr: string, timezone?: string) => {
  const d = new Date(dateStr);
  const tz = sanitizeTz(timezone);
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    });
    const parts = fmt.formatToParts(d);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);
    return { hour: isNaN(hour) ? 0 : hour, minute: isNaN(minute) ? 0 : minute };
  } catch {
    return { hour: d.getUTCHours(), minute: d.getUTCMinutes() };
  }
};

export const getClinicLocalDate = (dateStr: string, timezone?: string): string => {
  const d = new Date(dateStr);
  const tz = sanitizeTz(timezone);
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return fmt.format(d);
  } catch {
    return d.toISOString().split('T')[0];
  }
};

export const createClinicUTCDateTime = (localDate: Date, timeStr: string, timezone: string): Date => {
  const tz = sanitizeTz(timezone);
  const yyyy = localDate.getFullYear();
  const mm = String(localDate.getMonth() + 1).padStart(2, '0');
  const dd = String(localDate.getDate()).padStart(2, '0');
  const isoString = `${yyyy}-${mm}-${dd}T${timeStr}:00`;
  let guess = new Date(isoString + 'Z');
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hourCycle: 'h23',
    });
    for (let i = 0; i < 4; i++) {
      const formatted = fmt.format(guess).replace(/, /g, 'T');
      const formattedDate = new Date(formatted + 'Z');
      const targetDate = new Date(isoString + 'Z');
      const diff = targetDate.getTime() - formattedDate.getTime();
      if (Math.abs(diff) < 1000) break;
      guess = new Date(guess.getTime() + diff);
    }
  } catch {
    guess = new Date(isoString + 'Z');
  }
  return guess;
};

interface UseStaffDiaryDataOptions {
  viewDate: Date;
  viewMode: CalendarView;
  filters: StaffCalendarFilters;
}

export function useStaffDiaryData({ viewDate, viewMode, filters }: UseStaffDiaryDataOptions) {
  const dispatch = useDispatch<AppDispatch>();
  const { appointments, isLoading } = useSelector((state: RootState) => state.booking);
  const { user } = useSelector((state: RootState) => state.auth);

  const [clinics, setClinics] = useState<any[]>([]);
  const [providers, setProviders] = useState<ProviderResource[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);

  // Fetch clinics once
  useEffect(() => {
    const fetchClinics = async () => {
      setIsLoadingMeta(true);
      try {
        const clinicRes = await crmAPI.getAccessibleClinics();
        setClinics(clinicRes.data || []);
      } catch (err) {
        console.error('Failed to fetch clinics metadata', err);
      } finally {
        setIsLoadingMeta(false);
      }
    };
    fetchClinics();
  }, []);

  // Fetch providers whenever clinicId changes
  useEffect(() => {
    const fetchProvidersForClinic = async () => {
      let targetClinicId = filters.clinicId;
      if (!targetClinicId || targetClinicId === 'all') {
        if (clinics && clinics.length > 0) {
          targetClinicId = clinics[0].id;
        } else {
          setProviders([]);
          return;
        }
      }
      setIsLoadingMeta(true);
      try {
        const res = await clinicsAPI.getProviders(targetClinicId);
        const pList = (res.data || []).map((p: any, idx: number) => ({
          id: p.id,
          name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email || 'Staff Member',
          initials: (`${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}`.toUpperCase()) || 'ST',
          role: p.role,
          colorIndex: idx,
        }));
        setProviders(pList);
      } catch (err) {
        console.error('Failed to fetch providers', err);
      } finally {
        setIsLoadingMeta(false);
      }
    };
    fetchProvidersForClinic();
  }, [filters.clinicId, clinics]);

  // Build fetch params from view + filters
  const fetchParams = useMemo(() => {
    const params: any = {};
    if (filters.clinicId && filters.clinicId !== 'all') params.clinicId = filters.clinicId;
    if (filters.providerId && filters.providerId !== 'all') params.providerId = filters.providerId;
    if (filters.status && filters.status !== 'all') params.status = filters.status;

    if (viewMode === 'month-list') {
      params.startDate = format(startOfMonth(viewDate), 'yyyy-MM-dd');
      params.endDate = format(endOfMonth(viewDate), 'yyyy-MM-dd');
    } else if (viewMode === 'week') {
      params.startDate = format(startOfWeek(viewDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      params.endDate = format(endOfWeek(viewDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    } else {
      params.date = format(viewDate, 'yyyy-MM-dd');
    }
    return params;
  }, [viewDate, viewMode, filters]);

  // Fetch appointments whenever params change
  const refreshAppointments = useCallback(() => {
    dispatch(fetchClinicAppointments(fetchParams));
  }, [dispatch, fetchParams]);

  useEffect(() => {
    refreshAppointments();
  }, [refreshAppointments]);

  // Fetch blocked slots for selected clinic
  useEffect(() => {
    const clinicIds = filters.clinicId !== 'all'
      ? [filters.clinicId]
      : clinics.map((c: any) => c.id);
    if (!clinicIds.length) { setBlockedSlots([]); return; }
    Promise.all(
      clinicIds.map((id: string) =>
        adminAPI.getBlockedSlots(id).then((r: any) => r.data || []).catch(() => [])
      )
    ).then((results) => setBlockedSlots(results.flat()));
  }, [filters.clinicId, clinics]);

  // Enrich appointments with computed fields
  const enrichedAppointments = useMemo(() => {
    return appointments.filter((apt: any) => !apt.isBlocked).map((apt: any) => {
      const primaryPrice = parseFloat(String(apt.service?.price || 0));
      const additionalServicesTotal = (apt.additionalServices || []).reduce(
        (sum: number, s: any) => sum + parseFloat(String(s.price || 0)),
        0
      );
      const total =
        parseFloat(String(apt.totalAmount || 0)) ||
        (primaryPrice + additionalServicesTotal) ||
        parseFloat(String(apt.amount || 0));

      const paid =
        parseFloat(String(apt.amountPaid || 0)) ||
        parseFloat(String(apt.appointmentCompletionReport?.amountPaid || 0)) ||
        parseFloat(String(apt.advancePaymentAmount || 0));

      const hasPaymentMethod = Boolean(apt.paymentMethod && apt.paymentMethod !== '');
      const isCompleted = ['COMPLETED', 'EXECUTED'].includes(String(apt.status || '').toUpperCase());
      const isCancelled = String(apt.status || '').toUpperCase() === 'CANCELLED';

      let computedPaymentStatus: 'UNPAID' | 'PAID' | 'PARTIALLY_PAID' = 'UNPAID';

      if (!isCancelled) {
        if (paid > 0 && total > 0 && paid >= total) {
          computedPaymentStatus = 'PAID';
        } else if (paid > 0 && total > 0 && paid < total) {
          computedPaymentStatus = 'PARTIALLY_PAID';
        } else if (paid > 0 && total <= 0) {
          computedPaymentStatus = 'PAID';
        } else if (hasPaymentMethod || (isCompleted && (Number(apt.appointmentCompletionReport?.amountPaid || 0) > 0 || hasPaymentMethod))) {
          computedPaymentStatus = 'PAID';
        } else if (apt.paymentStatus === 'PAID') {
          computedPaymentStatus = 'PAID';
        }
      }

      const spIdx = providers.findIndex(p => p.id === (apt.providerId || apt.provider?.id));
      return { ...apt, computedPaymentStatus, colorIndex: spIdx >= 0 ? spIdx : 0 };
    });
  }, [appointments, providers]);

  return {
    appointments: enrichedAppointments,
    clinics,
    providers,
    blockedSlots,
    isLoading: isLoading || isLoadingMeta,
    refreshAppointments,
    user,
  };
}
