import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentHold } from './entities/appointment-hold.entity';
import { ClinicsService } from '../clinics/clinics.service';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import * as moment from 'moment-timezone';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(AppointmentHold)
    private holdsRepository: Repository<AppointmentHold>,
    private clinicsService: ClinicsService,
  ) {}

  async getAvailableSlots(
    clinicId: string,
    serviceId: string,
    providerId: string,
    date: string,
  ): Promise<any[]> {
    const clinic = await this.clinicsService.findById(clinicId);
    const services = await this.clinicsService.findServices(clinicId);
    
    const service = services.find(s => s.id === serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    const timezone = clinic.timezone || 'UTC';
    const startOfDay = moment.tz(date, timezone).startOf('day');
    const endOfDay = moment.tz(date, timezone).endOf('day');

    // Get business hours for the day
    const dayOfWeek = startOfDay.format('dddd').toLowerCase();
    const businessHours = clinic.businessHours?.[dayOfWeek];
    
    if (!businessHours || !businessHours.isOpen) {
      return []; // Clinic is closed
    }

    // Get existing appointments
    const existingAppointments = await this.appointmentsRepository.find({
      where: {
        providerId,
        startTime: Between(startOfDay.toDate(), endOfDay.toDate()),
        status: AppointmentStatus.CONFIRMED,
      },
    });

    // Get active holds
    const activeHolds = await this.holdsRepository.find({
      where: {
        providerId,
        startTime: Between(startOfDay.toDate(), endOfDay.toDate()),
        expiresAt: new Date(),
      },
    });

    // Generate available slots
    const slots = [];
    const openTime = moment.tz(`${date} ${businessHours.open}`, timezone);
    const closeTime = moment.tz(`${date} ${businessHours.close}`, timezone);
    
    let currentSlot = openTime.clone();
    
    while (currentSlot.clone().add(service.durationMinutes, 'minutes').isSameOrBefore(closeTime)) {
      const slotStart = currentSlot.clone();
      const slotEnd = currentSlot.clone().add(service.durationMinutes, 'minutes');
      
      // Check if slot conflicts with existing appointments or holds
      const hasConflict = existingAppointments.some(apt => {
        const aptStart = moment(apt.startTime);
        const aptEnd = moment(apt.endTime);
        return slotStart.isBefore(aptEnd) && slotEnd.isAfter(aptStart);
      }) || activeHolds.some(hold => {
        const holdStart = moment(hold.startTime);
        const holdEnd = moment(hold.endTime);
        return slotStart.isBefore(holdEnd) && slotEnd.isAfter(holdStart);
      });

      if (!hasConflict && slotStart.isAfter(moment())) { // Future slots only
        slots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          available: true,
        });
      }

      currentSlot.add(30, 'minutes'); // 30-minute intervals
    }

    return slots;
  }
}