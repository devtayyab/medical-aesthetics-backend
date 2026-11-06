import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  @OnEvent('audit.log')
  async handleAuditLog(eventData: any) {
    console.log('AuditService: Received audit event', eventData.action);
    const auditLog = this.auditRepository.create({
      userId: eventData.userId,
      action: eventData.action,
      resource: eventData.resource,
      resourceId: eventData.resourceId,
      data: eventData.data,
      changes: eventData.changes,
      ip: eventData.ip,
      userAgent: eventData.userAgent,
    });

    await this.auditRepository.save(auditLog);
  }

  /** Appointment moved to another time (any path: calendar edit, reschedule, client reschedule). */
  @OnEvent('appointment.rescheduled')
  async handleAppointmentRescheduled(payload: any) {
    try {
      const apt = payload?.appointment;
      if (!apt?.id) return;
      const userId = payload.rescheduledById || payload.changes?.updatedById || null;
      await this.handleAuditLog({
        userId,
        action: 'APPOINTMENT_RESCHEDULE',
        resource: 'appointments',
        resourceId: apt.id,
        changes: {
          before: { startTime: payload.oldStartTime ?? null, endTime: payload.oldEndTime ?? null, clinicId: payload.oldClinicId ?? null },
          after: {
            startTime: payload.newStartTime ?? apt.startTime ?? null,
            endTime: payload.newEndTime ?? apt.endTime ?? null,
            clinicId: payload.newClinicId ?? apt.clinicId ?? null,
          },
        },
        data: {
          appointmentId: apt.id,
          reason: payload.reason ?? null,
          isClientReschedule: !!payload.isClientReschedule,
          clientName: apt.client ? `${apt.client.firstName || ''} ${apt.client.lastName || ''}`.trim() : null,
          therapyName: apt.service?.treatment?.name || null,
        },
      });
    } catch (e) {
      console.error('AuditService: failed to log appointment reschedule', e?.message);
    }
  }

  /** Appointment edited (clinic, treatments, doctor or salesperson). Time-only moves are logged as reschedules. */
  @OnEvent('appointment.updated')
  async handleAppointmentUpdated(payload: any) {
    try {
      const c = payload?.changes;
      const apt = payload?.appointment;
      if (!c || !apt?.id) return;
      const repChanged = (c.oldRepresentativeId ?? null) !== (c.newRepresentativeId ?? null);
      if (!c.clinicChanged && !c.servicesChanged && !c.providerChanged && !repChanged) return;
      const before: Record<string, any> = {};
      const after: Record<string, any> = {};
      if (c.clinicChanged) { before.clinic = c.oldClinicName || c.oldClinicId; after.clinic = c.newClinicName || c.newClinicId; }
      if (c.servicesChanged) {
        before.serviceIds = c.oldServiceIds; after.serviceIds = c.newServiceIds;
        before.totalAmount = c.oldTotalAmount; after.totalAmount = c.newTotalAmount;
      }
      if (c.providerChanged) { before.providerId = c.oldProviderId; after.providerId = c.newProviderId; }
      if (repChanged) { before.representativeId = c.oldRepresentativeId ?? null; after.representativeId = c.newRepresentativeId ?? null; }
      if (c.timeChanged) { before.startTime = c.oldStartTime; after.startTime = c.newStartTime; }
      await this.handleAuditLog({
        userId: c.updatedById || null,
        action: 'APPOINTMENT_UPDATE',
        resource: 'appointments',
        resourceId: apt.id,
        changes: { before, after },
        data: {
          appointmentId: apt.id,
          clientName: apt.client ? `${apt.client.firstName || ''} ${apt.client.lastName || ''}`.trim() : null,
          therapyName: apt.service?.treatment?.name || null,
        },
      });
    } catch (e) {
      console.error('AuditService: failed to log appointment update', e?.message);
    }
  }

  async getAuditLogs(
    filters: { resource?: string; action?: string; userId?: string; resourceId?: string; dateFrom?: string; dateTo?: string; limit?: number } = {},
    limit: number = 200,
  ): Promise<AuditLog[]> {
    const queryBuilder = this.auditRepository.createQueryBuilder('audit')
      .leftJoinAndSelect('audit.user', 'user');

    if (filters.userId) {
      queryBuilder.andWhere('audit.userId = :userId', { userId: filters.userId });
    }

    if (filters.resource) {
      queryBuilder.andWhere('audit.resource = :resource', { resource: filters.resource });
    }

    if (filters.action) {
      queryBuilder.andWhere('audit.action = :action', { action: filters.action });
    }

    if (filters.resourceId) {
      queryBuilder.andWhere('audit.resourceId = :resourceId', { resourceId: filters.resourceId });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('audit.createdAt >= :dateFrom', { dateFrom: new Date(filters.dateFrom) });
    }

    if (filters.dateTo) {
      const end = new Date(filters.dateTo);
      end.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('audit.createdAt <= :dateTo', { dateTo: end });
    }

    const cap = Math.min(filters.limit ?? limit, 500);
    return queryBuilder
      .orderBy('audit.createdAt', 'DESC')
      .limit(cap)
      .getMany();
  }
}