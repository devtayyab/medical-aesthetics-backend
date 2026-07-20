import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { CalendarOutboundService } from '../services/calendar-outbound.service';
import { CalendarInboundService } from '../services/calendar-inbound.service';
import {
  CALENDAR_SYNC_QUEUE,
  JOB_OUTBOUND_APPOINTMENT,
  JOB_OUTBOUND_BLOCKED_SLOT,
  JOB_INBOUND_CLINIC,
  JOB_BACKFILL_CLINIC,
} from '../calendar-sync.constants';

@Processor(CALENDAR_SYNC_QUEUE)
export class CalendarSyncProcessor {
  private readonly logger = new Logger(CalendarSyncProcessor.name);

  constructor(
    private readonly outbound: CalendarOutboundService,
    private readonly inbound: CalendarInboundService,
  ) {}

  @Process(JOB_OUTBOUND_APPOINTMENT)
  async handleOutbound(job: Job<{ appointmentId: string }>) {
    await this.outbound.syncAppointment(job.data.appointmentId);
  }

  @Process(JOB_INBOUND_CLINIC)
  async handleInbound(job: Job<{ clinicId: string }>) {
    await this.inbound.syncClinic(job.data.clinicId);
  }

  @Process(JOB_BACKFILL_CLINIC)
  async handleBackfill(job: Job<{ clinicId: string }>) {
    await this.outbound.backfillClinic(job.data.clinicId);
  }

  @Process(JOB_OUTBOUND_BLOCKED_SLOT)
  async handleOutboundBlockedSlot(job: Job<{ slotId?: string, deleted?: boolean, clinicId?: string, externalEventId?: string }>) {
    await this.outbound.syncBlockedSlot(
      job.data.slotId || '',
      job.data.deleted,
      job.data.clinicId,
      job.data.externalEventId,
    );
  }
}
