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

  async getAuditLogs(
    filters: { resource?: string; action?: string; userId?: string; resourceId?: string; dateFrom?: string; dateTo?: string; limit?: number } = {},
    limit: number = 200,
  ): Promise<AuditLog[]> {
    const queryBuilder = this.auditRepository.createQueryBuilder('audit');

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