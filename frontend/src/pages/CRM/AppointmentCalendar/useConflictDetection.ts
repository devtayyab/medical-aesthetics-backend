import { useCallback } from 'react';
import type { ConflictInfo } from './types';

interface ConflictCheckParams {
  startTime: string;
  endTime: string;
  salesPersonId: string;
  clinicId: string;
  excludeAppointmentId?: string;
}

export function useConflictDetection(
  appointments: any[],
  blockedSlots: any[],
) {
  const checkConflict = useCallback(
    (params: ConflictCheckParams): ConflictInfo => {
      const { startTime, endTime, salesPersonId, clinicId, excludeAppointmentId } = params;
      const newStart = new Date(startTime).getTime();
      const newEnd = new Date(endTime).getTime();

      // 1. Check blocked slots
      for (const slot of blockedSlots) {
        const slotStart = new Date(slot.startTime).getTime();
        const slotEnd = new Date(slot.endTime).getTime();
        const slotClinic = slot.clinicId;
        const slotProvider = slot.providerId;

        const clinicMatch = !slotClinic || slotClinic === clinicId;
        const providerMatch = !slotProvider || slotProvider === salesPersonId;

        if (clinicMatch && providerMatch) {
          // Check overlap
          if (newStart < slotEnd && newEnd > slotStart) {
            return {
              hasConflict: true,
              message: `This time slot is blocked${slot.reason ? ` (${slot.reason})` : ''}. Please choose a different time.`,
            };
          }
        }
      }

      // 2. Check appointment conflicts (same provider, overlapping time)
      const activeStatuses = ['PENDING', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS'];
      for (const apt of appointments) {
        if (excludeAppointmentId && apt.id === excludeAppointmentId) continue;
        if (!activeStatuses.includes(apt.status)) continue;

        const aptProviderId = apt.providerId || (apt.provider as any)?.id;
        // Check removed to prevent any double bookings at the clinic, regardless of provider
        // if (aptProviderId !== salesPersonId) continue;
        if (apt.clinicId !== clinicId) continue;

        const aptStart = new Date(apt.startTime).getTime();
        const aptEnd = new Date(apt.endTime).getTime();

        if (newStart < aptEnd && newEnd > aptStart) {
          const clientName =
            (apt as any).client?.firstName
              ? `${(apt as any).client.firstName} ${(apt as any).client.lastName}`
              : (apt as any).clientDetails?.fullName || 'Another client';
          return {
            hasConflict: true,
            message: `Double booking detected! ${clientName} already has an appointment during this time.`,
            conflictingAppointment: apt,
          };
        }
      }

      return { hasConflict: false, message: '' };
    },
    [appointments, blockedSlots],
  );

  const isDateBlocked = useCallback(
    (date: Date, clinicId: string): boolean => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayStartMs = dayStart.getTime();
      const dayEndMs = dayEnd.getTime();

      return blockedSlots.some(slot => {
        if (slot.clinicId && slot.clinicId !== clinicId) return false;
        const slotStart = new Date(slot.startTime).getTime();
        const slotEnd = new Date(slot.endTime).getTime();
        // Entire day is blocked if the slot covers the full day
        return slotStart <= dayStartMs && slotEnd >= dayEndMs;
      });
    },
    [blockedSlots],
  );

  return { checkConflict, isDateBlocked };
}
