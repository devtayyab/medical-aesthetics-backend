import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

// Import all entities
import { User } from '../modules/users/entities/user.entity';
import { Clinic } from '../modules/clinics/entities/clinic.entity';
import { Service } from '../modules/clinics/entities/service.entity';
import { Lead } from '../modules/crm/entities/lead.entity';
import { Task } from '../modules/tasks/entities/task.entity';
import { Appointment } from '../modules/bookings/entities/appointment.entity';
import { AppointmentHold } from '../modules/bookings/entities/appointment-hold.entity';
import { LoyaltyLedger } from '../modules/loyalty/entities/loyalty-ledger.entity';
import { Notification } from '../modules/notifications/entities/notification.entity';
import { Tag } from '../modules/admin/entities/tag.entity';
import { AuditLog } from '../modules/audit/entities/audit-log.entity';
import { ConsentRecord } from '../modules/users/entities/consent-record.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

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
        Task,
        Appointment,
        AppointmentHold,
        LoyaltyLedger,
        Notification,
        Tag,
        AuditLog,
        ConsentRecord,
      ],
      ssl: this.configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      migrations: ['dist/migrations/*.js'],
      migrationsRun: true,
    };
  }
}