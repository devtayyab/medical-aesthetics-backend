import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { AvailabilityService } from './availability.service';
import { Appointment } from './entities/appointment.entity';
import { AppointmentHold } from './entities/appointment-hold.entity';
import { BlockedTimeSlot } from './entities/blocked-time-slot.entity';
import { ClinicsModule } from '../clinics/clinics.module';
import { UsersModule } from '../users/users.module';
import { CrmModule } from '../crm/crm.module';
import { User } from '../users/entities/user.entity';
import { CustomerRecord } from '../crm/entities/customer-record.entity';
import { Lead } from '../crm/entities/lead.entity';
import { Service } from '../clinics/entities/service.entity';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      AppointmentHold,
      BlockedTimeSlot,
      User,
      CustomerRecord,
      Lead,
      Service,
    ]),

    forwardRef(() => ClinicsModule),
    UsersModule,
    forwardRef(() => CrmModule),
    PaymentsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, AvailabilityService],
  exports: [BookingsService, AvailabilityService],
})
export class BookingsModule { }