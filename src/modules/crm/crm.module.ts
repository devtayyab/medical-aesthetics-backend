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
import { CommunicationLog } from './entities/communication-log.entity';
import { CustomerTag } from './entities/customer-tag.entity';
import { CrmAction } from './entities/crm-action.entity';
import { CustomerRecord } from './entities/customer-record.entity';
import { AdCampaign } from './entities/ad-campaign.entity';
import { AdSpendLog } from './entities/ad-spend-log.entity';
import { AdAttribution } from './entities/ad-attribution.entity';
import { AgentClinicAccess } from './entities/agent-clinic-access.entity';
import { ClinicOwnership } from './entities/clinic-ownership.entity';
import { TasksModule } from '../tasks/tasks.module';
import { BookingsModule } from '../bookings/bookings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';
import { Clinic } from '../clinics/entities/clinic.entity';
import { Appointment } from '../bookings/entities/appointment.entity';
import { CrmScheduler } from './crm.scheduler';
import { AdAttributionController } from './controllers/ad-attribution.controller';
import { AdAttributionService } from './services/ad-attribution.service';

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
      AgentClinicAccess,
      ClinicOwnership,
      AdCampaign,
      AdSpendLog,
      AdAttribution,
    ]),
    TasksModule,
    BookingsModule,
    NotificationsModule,
    UsersModule,
  ],
  controllers: [CrmController, AdAttributionController],
  providers: [
    CrmService, 
    FacebookService, 
    DuplicateDetectionService, 
    CustomerAffiliationService, 
    MandatoryFieldValidationService, 
    TaskAutomationService, 
    AdAttributionService, 
    CrmScheduler
  ],
  exports: [
    CrmService, 
    FacebookService, 
    DuplicateDetectionService, 
    CustomerAffiliationService, 
    MandatoryFieldValidationService, 
    TaskAutomationService, 
    AdAttributionService
  ],
})
export class CrmModule { }