import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
// Riverside: missing ForbiddenException import.
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
import { User } from '../users/entities/user.entity';


@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(AppointmentHold)
    private holdsRepository: Repository<AppointmentHold>,
    @InjectRepository(BlockedTimeSlot)
    private blockedTimeSlotsRepository: Repository<BlockedTimeSlot>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private clinicsService: ClinicsService,
  ) { }

  async getAvailableSlots(
    clinicId: string,
    serviceId: string | string[],
    providerId?: string | null,
    date?: string,
    allowPast = false
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

    const serviceIds = Array.isArray(serviceId) ? serviceId : [serviceId];
    log('🔵 Availability Request:', { clinicId, serviceIds, providerId, date });

    try {
      // Validate required parameters
      if (!clinicId || serviceIds.length === 0) {
        throw new BadRequestException('Clinic ID and at least one Service ID are required');
      }

      // Default to today if no date provided
      const targetDate = date || new Date().toISOString().split('T')[0];
      log('🔵 Using date:', targetDate);

      const clinic = await this.clinicsService.findById(clinicId);
      if (!clinic) {
        throw new NotFoundException('Clinic not found');
      }

      log('🔵 Clinic:', clinic.name);

      const allServices = await this.clinicsService.findServices(clinicId);
      if (!allServices || allServices.length === 0) {
        throw new NotFoundException('No services found for this clinic');
      }

      const services = allServices.filter(s => serviceIds.includes(s.id));
      if (services.length === 0) {
        throw new NotFoundException(`No matching services found for clinic ${clinicId}`);
      }

      const totalDurationMinutes = services.reduce((sum, s) => sum + s.durationMinutes, 0);
      log('🔵 Total duration:', totalDurationMinutes);

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

      // Get all providers for this clinic
      const providers = providerId
        ? await this.usersRepository.find({ where: { id: providerId } })
        : await this.clinicsService.getClinicProviders(clinicId);

      if (!providers || providers.length === 0) {
        log('⚠️ No providers found for clinic ' + clinicId);
        return {
          slots: [],
          count: 0,
          reason: 'No doctors or practitioners available at this clinic yet.',
        };
      }

      log(`🔵 Checking availability for ${providers.length} providers`);

      // Get existing appointments for ALL relevant providers
      const existingAppointments = await this.appointmentsRepository.find({
        where: {
          clinicId,
          startTime: Between(startOfDay, endOfDay),
          status: AppointmentStatus.CONFIRMED,
        },
      });

      // Get active holds
      const activeHolds = await this.holdsRepository.find({
        where: {
          clinicId,
          startTime: Between(startOfDay, endOfDay),
          expiresAt: MoreThan(new Date()),
        },
      });

      // Get blocked time slots (clinic-wide and provider-specific)
      const blockedSlots = await this.blockedTimeSlotsRepository.find({
        where: {
          clinicId,
          startTime: Between(startOfDay, endOfDay),
        },
      });

      // Generate available slots
      const slots = [];

      // Parse business hours
      const [openHour, openMinute] = businessHours.open.split(':').map(Number);
      const [closeHour, closeMinute] = businessHours.close.split(':').map(Number);

      // Construct ISO string for local time in clinic's timezone, then convert to UTC Date
      const fmt = (n: number) => n.toString().padStart(2, '0');
      const openTime = fromZonedTime(`${targetDate}T${fmt(openHour)}:${fmt(openMinute)}:00`, timezone);
      const closeTime = fromZonedTime(`${targetDate}T${fmt(closeHour)}:${fmt(closeMinute)}:00`, timezone);

      const now = new Date();
      let currentSlot = new Date(openTime);
      let slotCount = 0;

      // Group existing data by providerId for faster lookup
      const groupById = (items: any[]) => items.reduce((acc, item) => {
        const pid = item.providerId || 'clinic';
        if (!acc[pid]) acc[pid] = [];
        acc[pid].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      const aptsByProvider = groupById(existingAppointments);
      const holdsByProvider = groupById(activeHolds);
      const blocksByProvider = groupById(blockedSlots);

      // Generate slots in 30-minute intervals
      while (currentSlot.getTime() + (totalDurationMinutes * 60000) <= closeTime.getTime()) {
        slotCount++;
        const slotStart = new Date(currentSlot);
        const slotEnd = new Date(currentSlot.getTime() + (totalDurationMinutes * 60000));

        if (allowPast || slotStart >= now) {
          // Find WHICH providers are free for this specific slot
          const availableProviders = providers.filter(provider => {
            const pid = provider.id;

            // 1. Check provider-specific appointments
            const hasApt = (aptsByProvider[pid] || []).some(apt =>
              slotStart < new Date(apt.endTime) && slotEnd > new Date(apt.startTime)
            );
            if (hasApt) return false;

            // 2. Check provider-specific holds
            const hasHold = (holdsByProvider[pid] || []).some(hold =>
              slotStart < new Date(hold.endTime) && slotEnd > new Date(hold.startTime)
            );
            if (hasHold) return false;

            // 3. Check provider-specific blocks OR clinic-wide blocks
            const hasBlock = [...(blocksByProvider[pid] || []), ...(blocksByProvider['clinic'] || [])].some(block =>
              slotStart < new Date(block.endTime) && slotEnd > new Date(block.startTime)
            );
            if (hasBlock) return false;

            return true;
          });

            if (availableProviders.length > 0) {
              // Pick a provider (could be random or load-balanced, for now pick first)
              const chosenProvider = availableProviders[0];

              // Format display time according to clinic timezone
              const startTimeDisplay = slotStart.toLocaleTimeString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false,
                timeZone: timezone 
              });

              slots.push({
                startTime: slotStart.toISOString(),
                startTimeDisplay,
                endTime: slotEnd.toISOString(),
                available: true,
                providerId: chosenProvider.id,
                providerName: `${chosenProvider.firstName} ${chosenProvider.lastName}`,
              });
            }
        }

        // Move to next 30-minute slot
        currentSlot.setTime(currentSlot.getTime() + (30 * 60000));
      }

      let reason: string | undefined;
      if (slots.length === 0) {
        const firstSlotTime = openTime;
        const allPast = slotCount > 0 && firstSlotTime < now && closeTime < now;

        if (slotCount === 0) {
          reason = `Service duration (${totalDurationMinutes} min) is too long for the available time window (${businessHours.open} - ${businessHours.close})`;
        } else if (allPast) {
          reason = 'All available slots are in the past. Please select a future date.';
        } else {
          reason = 'No doctors are available for the selected date. They might be fully booked or out of office.';
        }
      }
      log(`✅ Found ${slots.length} slots for clinic: ${clinic.name}`);

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
          serviceDuration: totalDurationMinutes,
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
    // Get clinic based on user role and query
    let clinic;
    
    if (query?.clinicId) {
      // If clinicId is provided, verify accessibility
      const accessibleClinics = await this.clinicsService.findAllByOwner(userId);
      clinic = accessibleClinics.find(c => c.id === query.clinicId);
      
      // Permissive roles for viewing any clinic
      if (!clinic && (userRole === 'admin' || userRole === 'SUPER_ADMIN' || userRole === 'salesperson' || userRole === 'manager')) {
          clinic = await this.clinicsService.findById(query.clinicId);
      }
    } else {
      // Default to the first accessible clinic
      const accessibleClinics = await this.clinicsService.findAllByOwner(userId);
      clinic = accessibleClinics.length > 0 ? accessibleClinics[0] : null;
    }

    if (!clinic) {
      throw new NotFoundException('Clinic not found or access denied');
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
      throw new NotFoundException('Blocked time slot not found');
    }

    // Verify user has permission (clinic staff, owner, or admin)
    const upperRole = userRole.toUpperCase();
    const isAdmin = upperRole === 'ADMIN' || upperRole === 'SUPER_ADMIN' || upperRole === 'MANAGER';
    
    if (!isAdmin && blockedSlot.clinic.ownerId !== userId) {
      // Check if user is staff of this clinic (optional but safer)
      // For now, let's at least fix the basic role check
      if (upperRole !== 'SECRETARIAT' && upperRole !== 'DOCTOR' && upperRole !== 'SALESPERSON') {
        throw new ForbiddenException('Unauthorized to unblock this time slot');
      }
    }

    await this.blockedTimeSlotsRepository.remove(blockedSlot);
  }

  async updateBlockedTimeSlot(
    blockedSlotId: string,
    updates: { startTime?: Date; endTime?: Date; reason?: string; providerId?: string | null },
    userId: string,
    userRole: string
  ): Promise<BlockedTimeSlot> {
    const blockedSlot = await this.blockedTimeSlotsRepository.findOne({
      where: { id: blockedSlotId },
      relations: ['clinic'],
    });

    if (!blockedSlot) {
      throw new NotFoundException('Blocked time slot not found');
    }

    // Reuse permission logic
    const upperRole = userRole.toUpperCase();
    const isAdmin = upperRole === 'ADMIN' || upperRole === 'SUPER_ADMIN' || upperRole === 'MANAGER';
    if (!isAdmin && blockedSlot.clinic.ownerId !== userId && upperRole !== 'SECRETARIAT' && upperRole !== 'DOCTOR') {
      throw new ForbiddenException('Unauthorized to update this time slot');
    }

    if (updates.startTime) blockedSlot.startTime = updates.startTime;
    if (updates.endTime) blockedSlot.endTime = updates.endTime;
    if (updates.reason) blockedSlot.reason = updates.reason;
    if (updates.providerId !== undefined) blockedSlot.providerId = updates.providerId;

    return this.blockedTimeSlotsRepository.save(blockedSlot);
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
