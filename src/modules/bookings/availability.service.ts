import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentHold } from './entities/appointment-hold.entity';
import { BlockedTimeSlot } from './entities/blocked-time-slot.entity';
import { ClinicsService } from '../clinics/clinics.service';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { fromZonedTime } from 'date-fns-tz';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(AppointmentHold)
    private holdsRepository: Repository<AppointmentHold>,
    @InjectRepository(BlockedTimeSlot)
    private blockedTimeSlotsRepository: Repository<BlockedTimeSlot>,
    private clinicsService: ClinicsService,
  ) { }

  async getAvailableSlots(
    clinicId: string,
    serviceId: string,
    providerId?: string | null,
    date?: string,
  ): Promise<{ slots: any[]; count: number; reason?: string; debug?: any }> {
    const logPath = path.join(process.cwd(), 'logs', 'availability-debug.log');
    if (!fs.existsSync(path.dirname(logPath))) {
      fs.mkdirSync(path.dirname(logPath), { recursive: true });
    }
    const log = (msg: string, data?: any) => {
      const timestamp = new Date().toISOString();
      const line = `[${timestamp}] ${msg} ${data ? JSON.stringify(data) : ''}\n`;
      fs.appendFileSync(logPath, line);
      console.log(msg, data);
    };

    log('🔵 Availability Request:', { clinicId, serviceId, providerId, date });

    try {
      // Validate required parameters
      if (!clinicId || !serviceId) {
        throw new BadRequestException('Clinic ID and Service ID are required');
      }

      // Default to today if no date provided
      const targetDate = date || new Date().toISOString().split('T')[0];
      log('🔵 Using date:', targetDate);

      const clinic = await this.clinicsService.findById(clinicId);
      if (!clinic) {
        throw new NotFoundException('Clinic not found');
      }

      log('🔵 Clinic:', clinic.name);

      const services = await this.clinicsService.findServices(clinicId);
      if (!services || services.length === 0) {
        throw new NotFoundException('No services found for this clinic');
      }

      const service = services.find(s => s.id === serviceId);
      if (!service) {
        throw new NotFoundException(`Service not found for clinic ${clinicId}`);
      }

      const timezone = clinic.timezone || 'UTC';
      log('🔵 Using timezone:', timezone);

      // Create date objects for start and end of day respecting timezone
      const startOfDay = fromZonedTime(`${targetDate}T00:00:00`, timezone);
      const endOfDay = fromZonedTime(`${targetDate}T23:59:59.999`, timezone);

      // Get business hours for the day
      const targetDateObj = new Date(targetDate + 'T00:00:00Z');
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayOfWeek = daysOfWeek[targetDateObj.getUTCDay()];
      const businessHours = clinic.businessHours?.[dayOfWeek];

      log('🔵 Day of week:', dayOfWeek);
      log('🔵 Business hours for ' + dayOfWeek + ':', businessHours);
      log('🔵 All business hours:', clinic.businessHours);

      if (!businessHours) {
        console.log('⚠️ No business hours configured for', dayOfWeek);
        return {
          slots: [],
          count: 0,
          reason: `No business hours configured for ${dayOfWeek}`,
          debug: { dayOfWeek, hasBusinessHours: !!clinic.businessHours }
        };
      }

      // Check if clinic is open
      if (businessHours.isOpen === false) {
        console.log('⚠️ Clinic is closed on', dayOfWeek);
        return {
          slots: [],
          count: 0,
          reason: `Clinic is closed on ${dayOfWeek}`,
          debug: { dayOfWeek, businessHours }
        };
      }

      // Validate business hours have open and close times
      if (!businessHours.open || !businessHours.close) {
        log('⚠️ Business hours missing open/close times for ' + dayOfWeek, null);
        return {
          slots: [],
          count: 0,
          reason: `Business hours missing open/close times for ${dayOfWeek}`,
          debug: { dayOfWeek, businessHours }
        };
      }

      log(`✅ Clinic is open on ${dayOfWeek} from ${businessHours.open} to ${businessHours.close}`, null);

      // Build where clause for appointments - conditionally include providerId
      const appointmentWhere: any = {
        clinicId,
        startTime: Between(startOfDay, endOfDay),
        status: AppointmentStatus.CONFIRMED,
      };
      if (providerId) {
        appointmentWhere.providerId = providerId;
      }

      // Get existing appointments
      const existingAppointments = await this.appointmentsRepository.find({
        where: appointmentWhere,
      });

      console.log('🔵 Existing appointments:', existingAppointments.length);

      // Build where clause for holds - conditionally include providerId
      const holdsWhere: any = {
        clinicId,
        startTime: Between(startOfDay, endOfDay),
        expiresAt: MoreThan(new Date()),
      };
      if (providerId) {
        holdsWhere.providerId = providerId;
      }

      // Get active holds (holds that haven't expired yet)
      const activeHolds = await this.holdsRepository.find({
        where: holdsWhere,
      });

      console.log(' Active holds:', activeHolds.length);

      // Get blocked time slots for this provider or clinic-wide
      const blockedWhere: any[] = [
        {
          clinicId,
          providerId: null, // Clinic-wide blocks
          startTime: Between(startOfDay, endOfDay),
        },
      ];
      if (providerId) {
        blockedWhere.push({
          clinicId,
          providerId,
          startTime: Between(startOfDay, endOfDay),
        });
      }

      const blockedSlots = await this.blockedTimeSlotsRepository.find({
        where: blockedWhere,
      });

      log('Blocked slots count:', blockedSlots.length);

      // Generate available slots
      const slots = [];

      // Parse business hours
      const [openHour, openMinute] = businessHours.open.split(':').map(Number);
      const [closeHour, closeMinute] = businessHours.close.split(':').map(Number);

      console.log('🔵 Open time:', openHour, ':', openMinute);
      console.log('🔵 Close time:', closeHour, ':', closeMinute);
      console.log('🔵 Service duration:', service.durationMinutes, 'minutes');

      // Create open and close times respecting timezone
      const fmt = (n: number) => n.toString().padStart(2, '0');

      // Construct ISO string for local time in clinic's timezone, then convert to UTC Date
      // This ensures that 09:00 means 9 AM in the clinic's location
      const openTime = fromZonedTime(
        `${targetDate}T${fmt(openHour)}:${fmt(openMinute)}:00`,
        timezone
      );

      const closeTime = fromZonedTime(
        `${targetDate}T${fmt(closeHour)}:${fmt(closeMinute)}:00`,
        timezone
      );

      log('🔵 Open time (UTC):', openTime.toISOString());
      log('🔵 Close time (UTC):', closeTime.toISOString());
      log('🔵 Current time (UTC):', new Date().toISOString());

      let currentSlot = new Date(openTime);
      let slotCount = 0;

      // Generate slots in 30-minute intervals
      while (currentSlot.getTime() + (service.durationMinutes * 60000) <= closeTime.getTime()) {
        slotCount++;
        const slotStart = new Date(currentSlot);
        const slotEnd = new Date(currentSlot.getTime() + (service.durationMinutes * 60000));

        // Check if slot conflicts with existing appointments, holds, or blocked slots
        const hasConflict = existingAppointments.some(apt => {
          const aptStart = new Date(apt.startTime);
          const aptEnd = new Date(apt.endTime);
          return slotStart < aptEnd && slotEnd > aptStart;
        }) || activeHolds.some(hold => {
          const holdStart = new Date(hold.startTime);
          const holdEnd = new Date(hold.endTime);
          return slotStart < holdEnd && slotEnd > holdStart;
        }) || blockedSlots.some(blocked => {
          const blockedStart = new Date(blocked.startTime);
          const blockedEnd = new Date(blocked.endTime);
          return slotStart < blockedEnd && slotEnd > blockedStart;
        });

        // Only include future slots (not past slots)
        const now = new Date();
        const isFuture = slotStart >= now;

        if (slotCount <= 3) { // Only log first 3 slots to avoid spam
          console.log('🔵 Slot #' + slotCount + ':', {
            slotStart: slotStart.toISOString(),
            slotEnd: slotEnd.toISOString(),
            hasConflict,
            isFuture,
            willBeAdded: !hasConflict && isFuture
          });
        }

        if (!hasConflict && isFuture) {
          const slot: any = {
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            available: true,
            providerId: providerId || null,
          };

          // If providerId is specified, try to get provider name for display
          if (providerId) {
            // Note: In a real implementation, you'd fetch provider details here
            // For now, we'll include providerId so frontend can format it
            slot.providerId = providerId;
          }

          slots.push(slot);
        }

        // Move to next 30-minute slot
        currentSlot.setTime(currentSlot.getTime() + (30 * 60000));
      }

      console.log('🔵 Total slots generated:', slotCount);
      console.log('🔵 Available slots (future + no conflict):', slots.length);

      let reason: string | undefined;
      if (slots.length === 0) {
        const now = new Date();
        const firstSlotTime = openTime;
        const allPast = slotCount > 0 && firstSlotTime < now && closeTime < now;

        if (slotCount === 0) {
          reason = `Service duration (${service.durationMinutes} min) is too long for the available time window (${businessHours.open} - ${businessHours.close})`;
        } else if (allPast) {
          reason = 'All available slots are in the past. Please select a future date.';
        } else if (existingAppointments.length > 0 || activeHolds.length > 0 || blockedSlots.length > 0) {
          reason = `All ${slotCount} available time slots are already booked, held, or blocked for this date.`;
        } else {
          reason = 'No available slots found for this date.';
        }

        log('⚠️ No available slots found. Reason: ' + reason, {
          totalSlotsChecked: slotCount,
          firstSlotTime: firstSlotTime.toISOString(),
          currentTime: now.toISOString(),
          allPast: allPast
        });
        console.log('⚠️ No available slots found. Reason:', reason);
        console.log('  - Total slots checked:', slotCount);
        console.log('  - Existing appointments:', existingAppointments.length);
        console.log('  - Active holds:', activeHolds.length);
        console.log('  - Blocked slots:', blockedSlots.length);
        console.log('  - First slot time:', firstSlotTime.toISOString());
        console.log('  - Current time:', now.toISOString());
        console.log('  - All slots in past:', allPast);
      }

      return {
        slots,
        count: slots.length,
        reason: slots.length === 0 ? reason : undefined,
        debug: slots.length === 0 ? {
          totalSlotsChecked: slotCount,
          existingAppointments: existingAppointments.length,
          activeHolds: activeHolds.length,
          blockedSlots: blockedSlots.length,
          businessHours: {
            open: businessHours.open,
            close: businessHours.close,
            isOpen: businessHours.isOpen,
          },
          serviceDuration: service.durationMinutes,
          date: targetDate,
          dayOfWeek,
          openTime: openTime.toISOString(),
          closeTime: closeTime.toISOString(),
          currentTime: new Date().toISOString(),
        } : undefined,
      };
    } catch (error) {
      log('❌ Error in getAvailableSlots:', error);
      throw error;
    }
  }

  async getClinicAvailability(
    userId: string,
    userRole: string,
    query: any,
  ): Promise<any> {
    // Get clinic based on user role
    // SECRETARIAT and CLINIC_OWNER have same permissions
    let clinic;
    if (userRole === 'clinic_owner' || userRole === 'secretariat') {
      clinic = await this.clinicsService.findByOwnerId(userId);
    } else if (userRole === 'manager' && query?.clinicId) {
      clinic = await this.clinicsService.findById(query.clinicId);
    } else {
      // For other roles, we need to find their clinic
      // This is a simplified approach - in reality, you'd need to map users to clinics
      throw new Error('Clinic availability lookup not implemented for this user role or missing clinicId');
    }

    if (!clinic) {
      throw new Error('Clinic not found');
    }

    // Get blocked time slots
    const blockedSlots = await this.blockedTimeSlotsRepository.find({
      where: { clinicId: clinic.id },
      relations: ['provider', 'blockedBy'],
    });

    // Return clinic availability settings
    return {
      clinicId: clinic.id,
      clinicName: clinic.name,
      timezone: clinic.timezone,
      businessHours: clinic.businessHours,
      blockedDates: [], // This would come from a separate blocked dates entity
      blockedTimeSlots: blockedSlots.map(slot => ({
        id: slot.id,
        providerId: slot.providerId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        reason: slot.reason,
      })),
    };
  }

  async blockTimeSlot(
    clinicId: string,
    providerId: string | null,
    startTime: Date,
    endTime: Date,
    reason: string,
    blockedById: string,
  ): Promise<BlockedTimeSlot> {
    // Verify clinic exists
    const clinic = await this.clinicsService.findById(clinicId);
    if (!clinic) {
      throw new Error('Clinic not found');
    }

    // Check for conflicts with existing appointments
    const conflictingAppointment = await this.appointmentsRepository.findOne({
      where: {
        clinicId: clinic.id,
        providerId: providerId || undefined,
        startTime: Between(startTime, endTime),
        status: AppointmentStatus.CONFIRMED,
      },
    });

    if (conflictingAppointment) {
      throw new Error('Cannot block time slot with existing confirmed appointment');
    }

    const blockedSlot = this.blockedTimeSlotsRepository.create({
      clinicId: clinic.id,
      providerId: providerId || null,
      startTime,
      endTime,
      reason,
      blockedById,
    });

    return this.blockedTimeSlotsRepository.save(blockedSlot);
  }

  async unblockTimeSlot(blockedSlotId: string, userId: string, userRole: string): Promise<void> {
    const blockedSlot = await this.blockedTimeSlotsRepository.findOne({
      where: { id: blockedSlotId },
      relations: ['clinic'],
    });

    if (!blockedSlot) {
      throw new Error('Blocked time slot not found');
    }

    // Verify user has permission (clinic owner or admin)
    if (userRole !== 'admin' && blockedSlot.clinic.ownerId !== userId) {
      throw new Error('Unauthorized to unblock this time slot');
    }

    await this.blockedTimeSlotsRepository.remove(blockedSlot);
  }

  async getBlockedTimeSlots(
    clinicId: string,
    providerId?: string | null,
    startDate?: Date,
    endDate?: Date,
  ): Promise<BlockedTimeSlot[]> {
    const queryBuilder = this.blockedTimeSlotsRepository.createQueryBuilder('blocked')
      .where('blocked.clinicId = :clinicId', { clinicId });

    if (providerId) {
      queryBuilder.andWhere(
        '(blocked.providerId = :providerId OR blocked.providerId IS NULL)',
        { providerId }
      );
    } else {
      queryBuilder.andWhere('blocked.providerId IS NULL');
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('blocked.startTime BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    return queryBuilder.getMany();
  }
}







//     return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
//       headers: { ...corsHeaders, 'Content-Type': 'application/json' }
//     });

//   } catch (error) {
//     console.error("🔥 FATAL ERROR:", error.message);
//     return new Response(JSON.stringify({ error: error.message }), {
//       status: 500,
//       headers: { ...corsHeaders, 'Content-Type': 'application/json' }
//     });
//   }
// });
