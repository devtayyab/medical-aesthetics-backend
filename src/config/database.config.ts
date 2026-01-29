import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';


import { User } from '../modules/users/entities/user.entity';
import { Clinic } from '../modules/clinics/entities/clinic.entity';
import { Service } from '../modules/clinics/entities/service.entity';
import { Review } from '../modules/clinics/entities/review.entity';
import { Lead, CrmAction, CustomerRecord } from '../modules/crm/entities';
import { Tag } from '../modules/admin/entities/tag.entity';
import { AuditLog } from '../modules/audit/entities/audit-log.entity';
import { ConsentRecord } from '../modules/users/entities/consent-record.entity';
import { CommunicationLog } from '../modules/crm/entities/communication-log.entity';
import { CustomerTag } from '../modules/crm/entities/customer-tag.entity';
import { AdAttribution } from '../modules/crm/entities/ad-attribution.entity';
import { AdCampaign } from '../modules/crm/entities/ad-campaign.entity';
import { Task } from '@/modules/tasks/entities/task.entity';
import { Appointment } from '@/modules/bookings/entities/appointment.entity';
import { AppointmentHold } from '@/modules/bookings/entities/appointment-hold.entity';
import { LoyaltyLedger } from '@/modules/loyalty/entities/loyalty-ledger.entity';
import { Notification } from '@/modules/notifications/entities/notification.entity';
import { BlockedTimeSlot } from '@/modules/bookings/entities/blocked-time-slot.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) { }

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get('DATABASE_HOST', 'localhost'),
      port: this.configService.get('DATABASE_PORT', 5432),
      username: this.configService.get('DATABASE_USERNAME', 'postgres'),
      password: this.configService.get('DATABASE_PASSWORD', 'postgres'),
      database: this.configService.get('DATABASE_NAME', 'medical_aesthetics'),
      entities: [
        User,
        Clinic,
        Service,
        Lead,
        CommunicationLog,
        CustomerRecord,
        CrmAction,
        CustomerTag,
        Task,
        Appointment,
        AppointmentHold,
        LoyaltyLedger,
        Notification,
        Tag,
        AuditLog,
        ConsentRecord,
        AdAttribution,
        AdCampaign,
        BlockedTimeSlot,
        Review,
      ],
      // Since we are running in Docker on the same network, we don't need SSL
      // If using a managed database like AWS RDS in the future, we might need to enable this again
      ssl: false,
      synchronize: true, // Enable auto-creation of tables for dev
    };
  }
}