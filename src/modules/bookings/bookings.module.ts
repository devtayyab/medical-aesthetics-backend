import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { AvailabilityService } from './availability.service';
import { Appointment } from './entities/appointment.entity';
import { AppointmentHold } from './entities/appointment-hold.entity';
import { ClinicsModule } from '../clinics/clinics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, AppointmentHold]),
    ClinicsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, AvailabilityService],
  exports: [BookingsService],
})
export class BookingsModule {}