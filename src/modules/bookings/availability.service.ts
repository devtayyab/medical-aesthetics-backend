import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentHold } from './entities/appointment-hold.entity';
import { ClinicsService } from '../clinics/clinics.service';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';

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
    providerId?: string | null,
    date?: string,
  ): Promise<any[]> {
    console.log('🔵 Availability Request:', { clinicId, serviceId, providerId, date });
    
    // Validate required parameters
    if (!clinicId || !serviceId) {
      throw new Error('Clinic ID and Service ID are required');
    }
    
    // Default to today if no date provided
    const targetDate = date || new Date().toISOString().split('T')[0];
    console.log('🔵 Using date:', targetDate);
    
    const clinic = await this.clinicsService.findById(clinicId);
    if (!clinic) {
      throw new Error('Clinic not found');
    }
    

    console.log('🔵 Clinic:', clinic);

    const services = await this.clinicsService.findServices(clinicId);
    if (!services || services.length === 0) {
      throw new Error('No services found for this clinic');
    }
    
    const service = services.find(s => s.id === serviceId);
    if (!service) {
      throw new Error('Service not found');
    }

    const timezone = clinic.timezone || 'UTC';
    console.log('🔵 Using timezone:', timezone);
    
    // Create date objects for start and end of day (simplified - ignoring timezone for now)
    const targetDateObj = new Date(targetDate + 'T00:00:00.000Z');
    const startOfDay = new Date(targetDateObj);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDateObj);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Get business hours for the day
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = daysOfWeek[targetDateObj.getUTCDay()];
    const businessHours = clinic.businessHours?.[dayOfWeek];
    
    if (!businessHours || !businessHours.isOpen) {
      return []; // Clinic is closed
    }

    // Get existing appointments
    const existingAppointments = await this.appointmentsRepository.find({
      where: {
        providerId,
        startTime: Between(startOfDay, endOfDay),
        status: AppointmentStatus.CONFIRMED,
      },
    });

    // Get active holds
    const activeHolds = await this.holdsRepository.find({
      where: {
        providerId,
        startTime: Between(startOfDay, endOfDay),
        expiresAt: new Date(),
      },
    });

    // Generate available slots
    const slots = [];
    
    // Parse business hours
    const [openHour, openMinute] = businessHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = businessHours.close.split(':').map(Number);
    
    // Create open and close times
    const openTime = new Date(targetDateObj);
    openTime.setUTCHours(openHour, openMinute, 0, 0);
    
    const closeTime = new Date(targetDateObj);
    closeTime.setUTCHours(closeHour, closeMinute, 0, 0);
    
    let currentSlot = new Date(openTime);
    
    // Generate slots in 30-minute intervals
    while (currentSlot.getTime() + (service.durationMinutes * 60000) <= closeTime.getTime()) {
      const slotStart = new Date(currentSlot);
      const slotEnd = new Date(currentSlot.getTime() + (service.durationMinutes * 60000));
      
      // Check if slot conflicts with existing appointments or holds
      const hasConflict = existingAppointments.some(apt => {
        const aptStart = new Date(apt.startTime);
        const aptEnd = new Date(apt.endTime);
        return slotStart < aptEnd && slotEnd > aptStart;
      }) || activeHolds.some(hold => {
        const holdStart = new Date(hold.startTime);
        const holdEnd = new Date(hold.endTime);
        return slotStart < holdEnd && slotEnd > holdStart;
      });

      console.log('🔵 Slot:', { slotStart, slotEnd, hasConflict });
      if (!hasConflict) { // Future slots only
        slots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          available: true,
        });
      }

      // Move to next 30-minute slot
      currentSlot.setTime(currentSlot.getTime() + (30 * 60000));
    }

    return slots;
  }

  async getClinicAvailability(
    userId: string,
    userRole: string,
    query: any,
  ): Promise<any> {
    // Get clinic based on user role
    let clinic;
    if (userRole === 'clinic_owner') {
      clinic = await this.clinicsService.findByOwnerId(userId);
    } else {
      // For doctors and staff, we need to find their clinic
      // This is a simplified approach - in reality, you'd need to map users to clinics
      throw new Error('Clinic availability lookup not implemented for this user role');
    }

    if (!clinic) {
      throw new Error('Clinic not found');
    }

    // Return clinic availability settings
    return {
      clinicId: clinic.id,
      clinicName: clinic.name,
      timezone: clinic.timezone,
      businessHours: clinic.businessHours,
      blockedDates: [], // This would come from a separate blocked dates entity
    };
  }
}