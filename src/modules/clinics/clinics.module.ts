import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicsController } from './clinics.controller';
import { ClinicManagementController } from './clinic-management.controller';
import { ClinicsService } from './clinics.service';
import { Clinic } from './entities/clinic.entity';
import { Service } from './entities/service.entity';
import { Review } from './entities/review.entity';
import { BookingsModule } from '../bookings/bookings.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Clinic, Service, Review]),
    forwardRef(() => BookingsModule),
    forwardRef(() => LoyaltyModule),
    NotificationsModule,
  ],
  controllers: [ClinicsController, ClinicManagementController],
  providers: [ClinicsService],
  exports: [ClinicsService],
})
export class ClinicsModule {}