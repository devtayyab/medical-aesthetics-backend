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

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, AppointmentHold, BlockedTimeSlot, User]),
    forwardRef(() => ClinicsModule),
    UsersModule,
    forwardRef(() => CrmModule),
  ],
  controllers: [BookingsController],
  providers: [BookingsService, AvailabilityService],
  exports: [BookingsService, AvailabilityService],
})
export class BookingsModule { }