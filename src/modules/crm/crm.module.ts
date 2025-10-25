import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { FacebookService } from './facebook.service';
import { DuplicateDetectionService } from './duplicate-detection.service';
import { CustomerAffiliationService } from './customer-affiliation.service';
import { MandatoryFieldValidationService } from './mandatory-field-validation.service';
import { TaskAutomationService } from './task-automation.service';
import { Lead } from './entities/lead.entity';
import { CustomerRecord } from './entities/customer-record.entity';
import { CommunicationLog } from './entities/communication-log.entity';
import { CrmAction } from './entities/crm-action.entity';
import { CustomerTag } from './entities/customer-tag.entity';
import { TasksModule } from '../tasks/tasks.module';
import { BookingsModule } from '../bookings/bookings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';
import { Clinic } from '../clinics/entities/clinic.entity';
import { Appointment } from '../bookings/entities/appointment.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Lead,
      CustomerRecord,
      CommunicationLog,
      CrmAction,
      CustomerTag,
      Appointment,
      User,
      Clinic,
    ]),
    TasksModule,
    BookingsModule,
    NotificationsModule,
    UsersModule,
  ],
  controllers: [CrmController],
  providers: [CrmService, FacebookService, DuplicateDetectionService, CustomerAffiliationService, MandatoryFieldValidationService, TaskAutomationService],
  exports: [CrmService, FacebookService, DuplicateDetectionService, CustomerAffiliationService, MandatoryFieldValidationService, TaskAutomationService],
})
export class CrmModule {}