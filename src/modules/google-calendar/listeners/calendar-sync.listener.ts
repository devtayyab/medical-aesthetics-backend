import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { GoogleCalendarConfig } from '../google-calendar.config';
import {
  CALENDAR_SYNC_QUEUE,
  JOB_OUTBOUND_APPOINTMENT,
  JOB_OUTBOUND_BLOCKED_SLOT,
} from '../calendar-sync.constants';

/**
 * Bridges appointment domain events onto the calendar-sync queue. Kept
 * intentionally thin: it only enqueues (fast, non-blocking) so booking flows are
 * never slowed or broken by Google API latency/failures.
 */
@Injectable()
export class CalendarSyncListener {
  private readonly logger = new Logger(CalendarSyncListener.name);

  constructor(
    private readonly config: GoogleCalendarConfig,
    @InjectQueue(CALENDAR_SYNC_QUEUE) private readonly syncQueue: Queue,
  ) {}

  private async enqueue(appointmentId: string): Promise<void> {
    if (!this.config.isEnabled() || !appointmentId) return;
    try {
      await this.syncQueue.add(
        JOB_OUTBOUND_APPOINTMENT,
        { appointmentId },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: 100,
        },
      );
    } catch (err) {
      this.logger.error(`Failed to enqueue calendar sync for ${appointmentId}: ${err.message}`);
    }
  }

  @OnEvent('appointment.created')
  async onCreated(appointment: any) {
    await this.enqueue(appointment?.id);
  }

  @OnEvent('appointment.rescheduled')
  async onRescheduled(payload: any) {
    // Two emit shapes exist in bookings.service.ts: the bare appointment
    // (reschedule()) and a wrapped { appointment, oldStartTime, ... }
    // (rescheduleAppointment(), the clinic-facing path). Handle both.
    await this.enqueue(payload?.id ?? payload?.appointment?.id);
  }

  @OnEvent('appointment.status.changed')
  async onStatusChanged(payload: any) {
    await this.enqueue(payload?.appointment?.id);
  }

  // Dedicated signal emitted by clinic-scoped status changes and soft-deletes
  // that don't go through the shared status.changed event.
  @OnEvent('appointment.calendar.dirty')
  async onCalendarDirty(payload: any) {
    await this.enqueue(payload?.appointmentId);
  }

  private async enqueueBlockedSlot(payload: any): Promise<void> {
    if (!this.config.isEnabled() || !payload?.slotId) return;
    try {
      await this.syncQueue.add(
        JOB_OUTBOUND_BLOCKED_SLOT,
        payload,
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: 100,
        },
      );
    } catch (err) {
      this.logger.error(`Failed to enqueue blocked slot sync for ${payload.slotId}: ${err.message}`);
    }
  }

  @OnEvent('blocked_slot.created')
  async onBlockedSlotCreated(slot: any) {
    await this.enqueueBlockedSlot({ slotId: slot?.id });
  }

  @OnEvent('blocked_slot.updated')
  async onBlockedSlotUpdated(slot: any) {
    await this.enqueueBlockedSlot({ slotId: slot?.id });
  }

  @OnEvent('blocked_slot.deleted')
  async onBlockedSlotDeleted(slot: any) {
    await this.enqueueBlockedSlot({ 
      slotId: slot?.id, 
      deleted: true, 
      clinicId: slot?.clinicId, 
      externalEventId: slot?.externalEventId 
    });
  }
}
