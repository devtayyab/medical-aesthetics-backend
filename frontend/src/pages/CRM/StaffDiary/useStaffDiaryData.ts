import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format, startOfWeek, endOfWeek } from 'date-fns';
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
      if (!filters.clinicId || filters.clinicId === 'all') {
        setProviders([]);
        return;
      }
      setIsLoadingMeta(true);
      try {
        const res = await clinicsAPI.getProviders(filters.clinicId);
        const pList = (res.data || []).map((p: any, idx: number) => ({
          id: p.id,
          name: `${p.firstName || ''} ${p.lastName || ''}`.trim(),
          initials: `${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}`.toUpperCase() || '?',
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
  }, [filters.clinicId]);

  // Build fetch params from view + filters
  const fetchParams = useMemo(() => {
    const params: any = {};
    if (filters.clinicId && filters.clinicId !== 'all') params.clinicId = filters.clinicId;
    if (filters.providerId && filters.providerId !== 'all') params.providerId = filters.providerId;
    if (filters.status && filters.status !== 'all') params.status = filters.status;

    if (viewMode === 'week') {
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
    const clinicId = filters.clinicId !== 'all' ? filters.clinicId : clinics[0]?.id;
    if (!clinicId) return;
    adminAPI.getBlockedSlots(clinicId)
      .then((res: any) => setBlockedSlots(res.data || []))
      .catch(() => setBlockedSlots([]));
  }, [filters.clinicId, clinics]);

  // Enrich appointments with computed fields
  const enrichedAppointments = useMemo(() => {
    return appointments.map((apt: any) => {
      const paid = parseFloat(apt.amountPaid) || 0;
      const total = parseFloat(apt.totalAmount) || 0;
      let computedPaymentStatus: 'UNPAID' | 'PAID' | 'PARTIALLY_PAID' = 'UNPAID';
      if (paid > 0 && paid >= total && total > 0) computedPaymentStatus = 'PAID';
      else if (paid > 0 && paid < total) computedPaymentStatus = 'PARTIALLY_PAID';

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
