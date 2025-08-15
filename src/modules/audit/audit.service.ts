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

  async getAuditLogs(filters: any = {}, limit: number = 100): Promise<AuditLog[]> {
    const queryBuilder = this.auditRepository.createQueryBuilder('audit');

    if (filters.userId) {
      queryBuilder.where('audit.userId = :userId', { userId: filters.userId });
    }

    if (filters.resource) {
      queryBuilder.andWhere('audit.resource = :resource', { resource: filters.resource });
    }

    if (filters.action) {
      queryBuilder.andWhere('audit.action = :action', { action: filters.action });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('audit.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('audit.createdAt <= :dateTo', { dateTo: filters.dateTo });
    }

    return queryBuilder
      .orderBy('audit.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }
}