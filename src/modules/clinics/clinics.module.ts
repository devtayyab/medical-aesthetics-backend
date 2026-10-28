import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicsController } from './clinics.controller';
import { ClinicManagementController } from './clinic-management.controller';
import { ClinicsService } from './clinics.service';
import { Clinic } from './entities/clinic.entity';
import { Service } from './entities/service.entity';
import { Treatment } from './entities/treatment.entity';
import { TreatmentCategory } from './entities/treatment-category.entity';
import { Review } from './entities/review.entity';
import { User } from '../users/entities/user.entity';
import { Appointment } from '../bookings/entities/appointment.entity';
import { BookingsModule } from '../bookings/bookings.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AgentClinicAccess } from '../crm/entities/agent-clinic-access.entity';
import { ClinicOwnership } from '../crm/entities/clinic-ownership.entity';
import { Lead } from '../crm/entities/lead.entity';
import { CustomerRecord } from '../crm/entities/customer-record.entity';
import { ClinicPatientsService } from './clinic-patients.service';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Clinic, Service, Treatment, TreatmentCategory, Review, User, Appointment, AgentClinicAccess, ClinicOwnership, Lead, CustomerRecord]),
    forwardRef(() => BookingsModule),
    forwardRef(() => LoyaltyModule),
    forwardRef(() => PaymentsModule),
    NotificationsModule,
  ],
  controllers: [ClinicsController, ClinicManagementController],
  providers: [ClinicsService, ClinicPatientsService],
  exports: [ClinicsService, ClinicPatientsService],
})
export class ClinicsModule { }