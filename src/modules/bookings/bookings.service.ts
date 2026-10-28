import { RecordPaymentDto } from '../clinics/dto/clinic.dto';
import { ConflictException, Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from '../bookings/entities/appointment.entity';
import {
  Repository,
  Between,
  MoreThan,
  In,
  Brackets,
} from 'typeorm';
import { AppointmentHold } from './entities/appointment-hold.entity';
import { BlockedTimeSlot } from './entities/blocked-time-slot.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HoldSlotDto } from './dto/hold-slot.dto';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Service } from '../clinics/entities/service.entity';

import { CrmService } from '../crm/crm.service';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { LeadStatus } from '../../common/enums/lead-status.enum';
import { CustomerRecord } from '../crm/entities/customer-record.entity';
import { Lead } from '../crm/entities/lead.entity';
import { forwardRef, Inject } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { APPOINTMENT_NOTIFY_EVENT } from '../events/appointment-notify.event';
import { NotificationTrigger } from '../../common/enums/notification-trigger.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';

import * as fs from 'fs';
import * as path from 'path';
import { VivaWalletService } from '../payments/viva-wallet.service';
import { FinancialService } from '../payments/financial.service';
import { formatDateInTz, formatTimeInTz, formatDateTimeInTz } from '../../common/utils/timezone.util';
import { formatInTimeZone } from 'date-fns-tz';
import { Clinic } from '../clinics/entities/clinic.entity';
import { RevenueFilters, buildPaidRevenueQuery, getPaidRevenueTotal, netPaidExpression } from '../payments/revenue.util';
import { PaymentMethod as RecordPaymentMethod, PaymentType } from '../payments/entities/payment-record.entity';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class BookingsService {
  private readonly logPath = path.join(process.cwd(), 'logs', 'appointment-debug.log');

  private logDebug(msg: string, data?: any) {
    try {
      const timestamp = new Date().toISOString();
      const line = `[${timestamp}] ${msg} ${data ? JSON.stringify(data) : ''}\n`;
      if (!fs.existsSync(path.dirname(this.logPath))) fs.mkdirSync(path.dirname(this.logPath), { recursive: true });
      fs.appendFileSync(this.logPath, line);
    } catch {
      // Ignore file writing permission errors inside Docker so it never crashes the request
    }
    console.log(msg, data);
  }
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(AppointmentHold)
    private holdsRepository: Repository<AppointmentHold>,
    @InjectRepository(BlockedTimeSlot)
    private blockedTimeSlotsRepository: Repository<BlockedTimeSlot>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    @InjectRepository(CustomerRecord)
    private customerRecordsRepository: Repository<CustomerRecord>,
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
    @Inject(forwardRef(() => CrmService))
    private crmService: CrmService,
    private eventEmitter: EventEmitter2,
    private vivaWalletService: VivaWalletService,
    private financialService: FinancialService,
    private notificationsService: NotificationsService,
  ) { }

  /**
   * Creates a 15-minute optimistic hold lock on a time slot to prevent
   * concurrent double-booking while the client proceeds through checkout.
   */
  async holdSlot(holdSlotDto: HoldSlotDto): Promise<AppointmentHold> {
    const { clinicId, serviceId, additionalServiceIds, providerId, startTime, endTime } = holdSlotDto;

    // Check for conflicts
    const conflictingAppointment = await this.appointmentsRepository.findOne({
      where: {
        clinicId,
        providerId: providerId || undefined,
        startTime: Between(new Date(startTime), new Date(endTime)),
        status: AppointmentStatus.CONFIRMED,
      },
    });

    if (conflictingAppointment) {
      throw new ConflictException('Time slot is already booked');
    }

    const conflictingHold = await this.holdsRepository.findOne({
      where: {
        clinicId,
        providerId: providerId || undefined,
        startTime: Between(new Date(startTime), new Date(endTime)),
        expiresAt: MoreThan(new Date()),
      },
    });

    if (conflictingHold) {
      throw new ConflictException('Time slot is currently held');
    }

    const hold = this.holdsRepository.create({
      clinicId,
      serviceId,
      additionalServiceIds,
      providerId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    });

    return this.holdsRepository.save(hold);
  }

  /**
   * Finalizes appointment creation with fallback client resolution:
   * 1. Direct User lookup by ID.
   * 2. Walk-in details fuzzy match by email/phone.
   * 3. Robust "God Search" across CRM CustomerRecords and Leads.
   */
  async createAppointment(
    createAppointmentDto: CreateAppointmentDto & { appointmentSource?: 'clinic_own' | 'platform_broker', bookedById?: string },
    actor?: { id?: string; role?: string } | null,
  ): Promise<any> {
    let clientId = createAppointmentDto.clientId;

    // Status input is normalized server-side (e.g. 'completed' -> 'COMPLETED').
    if ((createAppointmentDto as any).status) {
      (createAppointmentDto as any).status = this.normalizeStatus((createAppointmentDto as any).status);
    }

    console.log('🚀 [BookingsService] createAppointment process started', {
      clientId,
      clinicId: createAppointmentDto.clinicId,
      startTime: createAppointmentDto.startTime,
      hasClientDetails: !!createAppointmentDto.clientDetails,
      phoneInDetails: createAppointmentDto.clientDetails?.phone
    });

    this.logDebug('--- BOOKING PROCESS STARTED ---', { clientId, hasDetails: !!createAppointmentDto.clientDetails });

    // Check if client exists as User
    let userExists = null;
    const WALK_IN_DUMMY_ID = '00000000-0000-0000-0000-000000000000';

    if (UUID_REGEX.test(clientId) && clientId !== WALK_IN_DUMMY_ID) {
      userExists = await this.usersRepository.findOne({ where: { id: clientId } });
    }

    // Lookup by Details if Walk-in or Not found as User
    if (!userExists && createAppointmentDto.clientDetails) {
      const { email, phone } = createAppointmentDto.clientDetails;
      userExists = await this.crmService.findClientUserByContact(email, phone);
      if (userExists) clientId = userExists.id;
    }

    // ROBUST FALLBACK: "God Search" for the ID in all relevant CRM tables
    if (!userExists && UUID_REGEX.test(clientId) && clientId !== WALK_IN_DUMMY_ID) {
      this.logDebug('🔍 [BookingsService] Robust fallback search for clientId:', { clientId });

      // 1. Check as CustomerRecord ID first (Often used in CRM deep links)
      const record = await this.customerRecordsRepository.findOne({ where: { id: clientId }, relations: ['customer'] });
      if (record && record.customer) {
        this.logDebug('✅ [BookingsService] Found as CustomerRecord, using linked User');
        userExists = record.customer;
        clientId = userExists.id;
      }

      // 2. Check as Lead Clinic Status ID
      if (!userExists) {
        const lStatus = await this.leadsRepository.manager.getRepository('LeadClinicStatus').findOne({
          where: { id: clientId },
          relations: ['lead']
        });
        if (lStatus && (lStatus as any).lead) {
          this.logDebug('✅ [BookingsService] Found as LeadClinicStatus, letting Lead logic handle conversion');
          clientId = (lStatus as any).lead.id;
          // Don't set userExists yet, let the lead conversion logic below run
        }
      }

      // 3. If still no USER, we might have a LEAD ID. 
      // If we found nothing yet, but clientId exists, the (!userExists) block below will check if it's a Lead.
    }

    if (!userExists) {
      // Try to find as Lead
      try {
        let lead = null;

        // 1. Try by provided ID if it's a valid UUID (and not dummy)
        if (UUID_REGEX.test(clientId) && clientId !== WALK_IN_DUMMY_ID) {
          try {
            lead = await this.crmService.getLead(clientId);
          } catch (err) { }
        }

        // 2. Try by phone/email from details if not found by ID
        if (!lead && createAppointmentDto.clientDetails) {
          const { email, phone } = createAppointmentDto.clientDetails;
          lead = await this.crmService.findLeadByContact(email, phone);
        }

        if (lead) {
          // Check if user with this email already exists (safety)
          const existingUser = await this.crmService.findClientUserByContact(lead.email, lead.phone);

          if (existingUser) {
            clientId = existingUser.id;
            userExists = existingUser;
          } else {
            // Convert Lead to User using CRM Service to ensure proper records
            try {
              let salespersonId = lead.assignedSalesId;
              if (salespersonId && UUID_REGEX.test(salespersonId)) {
                const salesExists = await this.usersRepository.findOne({ where: { id: salespersonId } });
                if (!salesExists) {
                  salespersonId = undefined;
                }
              } else {
                salespersonId = undefined;
              }

              const { user: savedUser } = await this.crmService.createCustomer({
                // Real email only; no placeholder addresses (item 18)
                email: lead.email || undefined,
                firstName: lead.firstName || 'Unknown',
                lastName: lead.lastName || 'Client',
                phone: lead.phone || undefined,
              }, salespersonId);

              clientId = savedUser.id;
              userExists = savedUser;

              // Link the lead to the new user so the CRM page can find its appointments
              await this.leadsRepository.update(lead.id, {
                status: LeadStatus.APPOINTMENT_SCHEDULED as any,
                metadata: {
                  ...(lead.metadata || {}),
                  convertedToUserId: savedUser.id,
                  convertedToCustomerId: savedUser.id
                }
              });
            } catch (createErr) {
              console.error('createCustomer failed during booking:', createErr);
              const retryUser = await this.crmService.findClientUserByContact(lead.email, lead.phone);
              if (retryUser) {
                clientId = retryUser.id;
                userExists = retryUser;
              } else {
                throw createErr;
              }
            }
          }
        } else {
          // If still not found, and we have client details, create a new customer
          if (createAppointmentDto.clientDetails) {
            try {
              const fullName = createAppointmentDto.clientDetails.fullName || 'Guest Client';
              const nameParts = fullName.trim().split(/\s+/);
              const firstName = nameParts[0] || 'Unknown';
              const lastName = nameParts.slice(1).join(' ') || 'Client';
              const isClinicOwnClient = createAppointmentDto.appointmentSource === 'clinic_own';
              console.log(`🔍 [BookingsService] Attempting to create new ${isClinicOwnClient ? 'clinic-own client' : 'customer in CRM'}...`);
              const { user: savedUser } = isClinicOwnClient
                ? await this.crmService.createClinicOwnClient({
                    email: createAppointmentDto.clientDetails.email || undefined,
                    firstName,
                    lastName,
                    phone: createAppointmentDto.clientDetails.phone || undefined,
                  }, createAppointmentDto.clinicId)
                : await this.crmService.createCustomer({
                    // Real email only; no placeholder addresses (item 18)
                    email: createAppointmentDto.clientDetails.email || undefined,
                    firstName,
                    lastName,
                    phone: createAppointmentDto.clientDetails.phone || undefined,
                  });
              clientId = savedUser.id;
              userExists = savedUser;
              console.log('✅ [BookingsService] CRM Customer created:', { clientId: savedUser.id });
            } catch (createErr) {
              console.error('Failed to create guest customer during booking:', createErr);
              const retryWhere: any[] = [];
              if (createAppointmentDto.clientDetails.email) retryWhere.push({ email: createAppointmentDto.clientDetails.email });
              if (createAppointmentDto.clientDetails.phone) retryWhere.push({ phone: createAppointmentDto.clientDetails.phone });

              const retryUser = await this.usersRepository.findOne({ where: retryWhere });
              if (retryUser) {
                clientId = retryUser.id;
                userExists = retryUser;
                console.log('⚠️ [BookingsService] createCustomer failed, but found existing user on retry:', retryUser.id);
              } else {
                throw new BadRequestException(`Failed to create guest record: ${createErr.message}`);
              }
            }
          } else {
            console.error('❌ [BookingsService] Client identification failed. Details:', {
              clientId,
              receivedDto: {
                ...createAppointmentDto,
                // Mask sensitive info if needed, but here we need to see what's actually there
              }
            });
            throw new NotFoundException(`Client not found as User or Lead: ${clientId}. Please ensure client details are provided for guest bookings.`);
          }
        }
      } catch (e) {
        if (e instanceof NotFoundException || e instanceof BadRequestException) throw e;
        console.error('Lead lookup/conversion failed:', e);
        throw new BadRequestException(`Client identification failed: ${e.message}`);
      }
    }

    // MANDATORY FIELD CHECK: Mobile number is required for appointment booking
    const phone = userExists?.phone || createAppointmentDto.clientDetails?.phone;
    if (!phone) {
      throw new BadRequestException('Client mobile number is mandatory for appointment booking');
    }

    let providerId = createAppointmentDto.providerId;

    // Auto-assign to doctor if only one exists and none provided
    if (!providerId) {
      // Only an ACTIVE doctor of the clinic can be auto-assigned (never a deactivated/test account).
      const clinicDoctors = await this.usersRepository.find({
        where: { assignedClinicId: createAppointmentDto.clinicId, role: UserRole.DOCTOR, isActive: true } as any
      });
      if (clinicDoctors.length === 1) {
        providerId = clinicDoctors[0].id;
      }
    }

    // --- ENHANCED: Beauty Doctors Client Identification ---
    let isBeautyDoctorsClient = false;
    let representativeId = createAppointmentDto.representativeId || null;

    if (!representativeId && userExists) {
      // 1. Check if user is assigned to a salesperson
      const customerRecord = await this.customerRecordsRepository.findOne({ where: { customerId: userExists.id } });
      if (customerRecord?.assignedSalespersonId) {
        isBeautyDoctorsClient = true;
        representativeId = customerRecord.assignedSalespersonId;
      }
    } else if (!userExists) {
      // Or if they were from a source that implies central ownership
      if (createAppointmentDto.appointmentSource === 'platform_broker') {
        isBeautyDoctorsClient = true;
      }
    }

    const appointmentData: Partial<Appointment> = {
      ...createAppointmentDto,
      clientId,
      providerId: providerId ?? null,
      startTime: new Date(createAppointmentDto.startTime),
      endTime: new Date(createAppointmentDto.endTime),
      appointmentSource: createAppointmentDto.appointmentSource || 'platform_broker',
      clientDetails: createAppointmentDto.clientDetails,
      bookedById: (createAppointmentDto.bookedById && createAppointmentDto.bookedById !== clientId) ? createAppointmentDto.bookedById : null,
      isBeautyDoctorsClient,
      representativeId,
    };

    // Auto-set totalAmount based on all selected services if not already provided
    const allIds = [createAppointmentDto.serviceId, ...(createAppointmentDto.additionalServiceIds || [])];
    const services = await this.servicesRepository.find({ where: { id: In(allIds) }, relations: ['treatment'] });
    
    if (!appointmentData.totalAmount) {
      const totalPrice = services.reduce((sum, s) => sum + Number(s.price), 0);
      appointmentData.totalAmount = totalPrice;
    }

    // Duration = sum of all treatments (e.g. 60 + 30 = 90 min), never just the first one.
    const totalDurationMinutes = services.reduce((sum, s) => sum + (Number((s as any).durationMinutes) || 0), 0);
    if (totalDurationMinutes > 0) {
      appointmentData.endTime = new Date(new Date(appointmentData.startTime).getTime() + totalDurationMinutes * 60000);
      (createAppointmentDto as any).endTime = appointmentData.endTime.toISOString();
    }

    // Same rules as edit/reschedule: past times (admin only), opening hours, end by closing,
    // blocked time. Appointment overlaps are checked just below (with the pending-payment rule).
    await this.assertSlotBookable({
      clinicId: createAppointmentDto.clinicId,
      providerId: providerId ?? null,
      representativeId,
      startTime: appointmentData.startTime as Date,
      endTime: appointmentData.endTime as Date,
      actorRole: actor?.role,
      skipAppointmentConflicts: true,
    });

    // Attendance / completion statuses only from the appointment start time.
    if (appointmentData.status && BookingsService.STARTED_ONLY_STATUSES.includes(appointmentData.status as AppointmentStatus)) {
      this.assertAppointmentStarted(appointmentData as Appointment, `Status ${appointmentData.status}`);
    }

    // 🔴 GIFT CARDS — BACKEND HARD BLOCK
    if (createAppointmentDto.giftCardCode) {
      const hasIneligibleService = services.some(s => !s.giftCardEligible && !s.treatment?.giftCardEligible);
      if (hasIneligibleService) {
        throw new BadRequestException('Gift cards cannot be used for medical consultations, procedures, injectables, or any non-eligible service.');
      }
    }

    if (createAppointmentDto.additionalServiceIds) {
      appointmentData.additionalServiceIds = createAppointmentDto.additionalServiceIds;
    }

    // Check for overlapping appointments using more robust logic
    console.log('🔍 [BookingsService] Checking for conflicting appointments (Overlap Logic)...');
    const newStart = new Date(createAppointmentDto.startTime);
    const newEnd = new Date(createAppointmentDto.endTime);

    let conflictQuery = this.appointmentsRepository.createQueryBuilder('apt')
      .where('apt.clinicId = :clinicId', { clinicId: createAppointmentDto.clinicId })
      .andWhere('apt.status IN (:...statuses)', {
          statuses: [
              AppointmentStatus.CONFIRMED,
              AppointmentStatus.PENDING,
              AppointmentStatus.PENDING_PAYMENT,
              AppointmentStatus.ARRIVED,
              AppointmentStatus.IN_PROGRESS
          ]
      })
      .andWhere('apt.startTime < :newEnd', { newEnd })
      .andWhere('apt.endTime > :newStart', { newStart });

    // Only restrict to specific provider if one is assigned (unassigned appointments occupy the clinic)
    if (providerId) {
      conflictQuery = conflictQuery.andWhere('(apt.providerId = :providerId OR apt.providerId IS NULL)', { providerId });
    }

    const conflictingAppointments = await conflictQuery.getMany();

    if (conflictingAppointments.length > 0) {
      for (const apt of conflictingAppointments) {
        // If it's a PENDING_PAYMENT appointment, check if it belongs to the same client
        if (apt.status === AppointmentStatus.PENDING_PAYMENT) {
          const WALK_IN_DUMMY = '00000000-0000-0000-0000-000000000000';
          let isSameClient = false;
          
          if (clientId !== WALK_IN_DUMMY && apt.clientId === clientId) {
             isSameClient = true;
          } else if (
             createAppointmentDto.clientDetails?.email && 
             apt.clientDetails?.email === createAppointmentDto.clientDetails.email
          ) {
             isSameClient = true;
          } else if (
             createAppointmentDto.clientDetails?.phone && 
             apt.clientDetails?.phone === createAppointmentDto.clientDetails.phone
          ) {
             isSameClient = true;
          }

          if (isSameClient) {
            console.log(`🔄 [BookingsService] Removing previous pending payment appointment (${apt.id}) for same client so they can re-book.`);
            await this.appointmentsRepository.remove(apt);
            continue;
          }
        }
        
        // If we reach here, it's a true conflict
        this.logDebug('❌ [BookingsService] Conflict detected: Time slot already occupied.', {
            conflictingAptId: apt.id,
            status: apt.status,
            requestedTime: { start: newStart, end: newEnd }
        });
        // GDPR: never reveal who holds the slot.
        throw new ConflictException(BookingsService.SLOT_UNAVAILABLE_MESSAGE);
      }
    }
    console.log('✅ [BookingsService] No conflicting appointments found.');

    // If holdId provided, validate and remove hold
    if (createAppointmentDto.holdId) {
      console.log('🔍 [BookingsService] Hold ID provided, validating and removing hold:', createAppointmentDto.holdId);
      const hold = await this.holdsRepository.findOne({
        where: { id: createAppointmentDto.holdId },
      });

      if (!hold || hold.expiresAt < new Date()) {
        console.log('❌ [BookingsService] Hold expired or not found.');
        throw new ConflictException('Hold has expired');
      }

      await this.holdsRepository.delete(hold.id);
      console.log('✅ [BookingsService] Hold successfully removed.');
    }

    // Process Gift Card if provided
    let payableAmount = appointmentData.totalAmount;
    let validGiftCard = null;

    if (createAppointmentDto.giftCardCode) {
      validGiftCard = await this.financialService.validateGiftCard(createAppointmentDto.giftCardCode);
      if (validGiftCard && validGiftCard.valid) {
        appointmentData.giftCardId = validGiftCard.id;
        
        const discount = Math.min(validGiftCard.balance, appointmentData.totalAmount);
        appointmentData.giftCardAmountRedeemed = discount;
        payableAmount = appointmentData.totalAmount - discount;
        
        // If fully paid by gift card, override payment method and status
        if (payableAmount <= 0) {
          appointmentData.status = AppointmentStatus.CONFIRMED;
          createAppointmentDto.paymentMethod = 'gift_card'; // Prevent card logic
        }
      }
    }

    // Set status to pending_payment if card is chosen and still has payable amount
    if (createAppointmentDto.paymentMethod === 'card' && payableAmount > 0) {
      appointmentData.status = AppointmentStatus.PENDING_PAYMENT;
    } else if (!appointmentData.status) {
      let isStaffBooking = false;
      if (createAppointmentDto.bookedById) {
        const booker = await this.usersRepository.findOne({ where: { id: createAppointmentDto.bookedById } });
        if (booker && [UserRole.SALESPERSON, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.SECRETARIAT].includes(booker.role as UserRole)) {
          isStaffBooking = true;
        }
      } else if (createAppointmentDto.appointmentSource === 'clinic_own') {
        isStaffBooking = true;
      }

      if (isStaffBooking) {
        appointmentData.status = AppointmentStatus.CONFIRMED;
      }
    }

    const appointment: Appointment = this.appointmentsRepository.create(appointmentData);

    // Default status in entity is CONFIRMED, no need to manually set to PENDING

    console.log('📝 [BookingsService] Saving appointment to database...');
    const savedAppointment: Appointment = await this.appointmentsRepository.save(appointment);
    console.log('✅ [BookingsService] Appointment saved:', { id: savedAppointment.id });

    // Single-use Gift Card Invalidation
    if (validGiftCard) {
      const giftCardRepo = this.appointmentsRepository.manager.getRepository('GiftCard');
      const card = await giftCardRepo.findOne({ where: { id: validGiftCard.id } });
      if (card) {
        card.isActive = false;
        card.balance = 0;
        card.redeemedByUserId = clientId;
        card.redeemedAt = new Date();
        card.redeemedAppointmentId = savedAppointment.id;
        await giftCardRepo.save(card);
        console.log(`✅ [BookingsService] Gift Card ${card.code} redeemed and marked as inactive.`);
      }
    }

    // The confirmation-call CRM task is created by the CRM listener on 'appointment.created'
    // (TaskAutomationService.syncConfirmationTask): exactly one automatic task per booking.

    // Load full relations before emitting event for notifications
    const appointmentWithRelations = await this.findById(savedAppointment.id);
    const bookedTreatmentLabel = await this.getTreatmentLabel(appointmentWithRelations);

    // One notification event; recipients are decided in AppointmentNotificationsListener.
    this.eventEmitter.emit(APPOINTMENT_NOTIFY_EVENT, { kind: 'created', appointmentId: savedAppointment.id, actorId: appointmentWithRelations.bookedById || appointmentWithRelations.clientId });

      // If card payment, generate Viva Wallet redirect URL
      // If gift card covered the whole amount, payableAmount is 0 and paymentMethod was changed to 'gift_card' above.
      if (createAppointmentDto.paymentMethod === 'card') {
        const clientName = appointmentWithRelations.client
          ? `${appointmentWithRelations.client.firstName} ${appointmentWithRelations.client.lastName}`
          : (createAppointmentDto.clientDetails?.fullName || 'Guest');

        const amount = payableAmount; // Use the dynamically calculated payableAmount
        const customerEmail = appointmentWithRelations.client?.email || createAppointmentDto.clientDetails?.email || '';
        const customerPhone = appointmentWithRelations.client?.phone || createAppointmentDto.clientDetails?.phone || '';

        // DEMO MODE: If Viva credentials not configured yet, use a test redirect
        const vivaClientId = process.env.VIVA_CLIENT_ID;
        const vivaMerchantId = process.env.VIVA_MERCHANT_ID;
        const vivaApiKey = process.env.VIVA_API_KEY;

        const hasOAuth = vivaClientId && vivaClientId !== 'your-viva-client-id';
        const hasBasicAuth = vivaMerchantId && vivaApiKey && vivaMerchantId !== 'your-viva-merchant-id';

        if (!hasOAuth && !hasBasicAuth) {
          console.warn('[Viva Wallet] ⚠️  DEMO MODE — No real credentials set. Using test redirect.');
          const frontendUrl = process.env.APP_FRONTEND_URL || 'http://localhost:5173';
          const demoRedirectUrl = `${frontendUrl}/payment/success?t=DEMO_TXN_${savedAppointment.id}&s=DEMO_ORDER&paid=true&appointmentId=${savedAppointment.id}`;
          // Mark appointment as confirmed in demo mode
          await this.appointmentsRepository.update(savedAppointment.id, {
            status: AppointmentStatus.CONFIRMED,
          });
          return {
            ...appointmentWithRelations,
            redirectUrl: demoRedirectUrl,
          };
        }

        console.log(`[Viva Wallet] Creating payment order for appointment ${savedAppointment.id}, amount=${amount}, email=${customerEmail}`);
        console.log('💳 [BookingsService] Initiating Viva Wallet payment order...', { amount });

      try {
        const redirectUrl = await this.vivaWalletService.createPaymentOrder({
          amount,
          customerEmail,
          customerPhone,
          customerName: clientName,
          merchantTrns: savedAppointment.id,
        });

        console.log(`[Viva Wallet] Payment order created. Redirect URL: ${redirectUrl}`);

        return {
          ...appointmentWithRelations,
          redirectUrl,
        };
      } catch (err) {
        // Log the full error details so we can debug
        console.error('[Viva Wallet] Order creation FAILED:', err?.response?.data || err?.message || err);
        // Delete the saved appointment since payment setup failed
        await this.appointmentsRepository.delete(savedAppointment.id);
        throw new BadRequestException(
          `Payment setup failed: ${err?.message || 'Could not connect to Viva Wallet. Please verify VIVA_CLIENT_ID and VIVA_CLIENT_SECRET in .env'}`
        );
      }
    }


    // Emit event for notifications with full relations (safe try/catch)
    try {
      this.eventEmitter.emit('appointment.created', appointmentWithRelations);
    } catch (eventErr: any) {
      console.warn('⚠️ [BookingsService] Non-blocking event emission error:', eventErr?.message || eventErr);
    }

    return appointmentWithRelations;
  }

  async findById(id: string): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['clinic', 'service', 'service.treatment', 'provider', 'client', 'bookedBy', 'executedBy', 'representative'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  // Helper method to format appointment display name
  formatAppointmentDisplayName(appointment: Appointment): string {
    const serviceName = appointment.service?.treatment?.name || 'Appointment';
    const providerName = appointment.provider
      ? `${appointment.provider.firstName} ${appointment.provider.lastName}`
      : 'Professional';
    return `${serviceName} with ${providerName}`;
  }

  // Generate a Viva Wallet payment URL for an existing pending_payment appointment
  async generateVivaPaymentUrl(appointment: Appointment): Promise<string | null> {
    const clientName = appointment.client
      ? `${appointment.client.firstName} ${appointment.client.lastName}`
      : (appointment.clientDetails?.fullName || 'Guest');
    const customerEmail = appointment.client?.email || appointment.clientDetails?.email || '';
    const customerPhone = appointment.client?.phone || appointment.clientDetails?.phone || '';

    // Charge the true outstanding balance: the full total (which already accounts for any
    // additional services) minus what was already paid and any gift-card redemption — not just
    // the base service price, otherwise clients underpay for multi-service appointments.
    const basePrice = Number(appointment.service?.price || 0);
    const total = appointment.totalAmount != null ? Number(appointment.totalAmount) : basePrice;
    const alreadyPaid = Number(appointment.amountPaid || 0);
    const giftCardRedeemed = Number((appointment as any).giftCardAmountRedeemed || 0);
    const amount = Math.max(0, total - alreadyPaid - giftCardRedeemed);

    return this.vivaWalletService.createPaymentOrder({
      amount,
      customerEmail,
      customerPhone,
      customerName: clientName,
      merchantTrns: appointment.id,
    });
  }

  isAppointmentCompleted(appointment: Appointment | any): boolean {
    if (!appointment) return false;
    const status = String(appointment.status || '').toUpperCase();
    return (
      status === AppointmentStatus.COMPLETED ||
      status === AppointmentStatus.EXECUTED ||
      status === 'COMPLETED' ||
      status === 'EXECUTED'
    );
  }

  // ─── Shared booking rules (create, edit and reschedule use the SAME checks) ─────────────

  static readonly ACTIVE_STATUSES: AppointmentStatus[] = [
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.PENDING,
    AppointmentStatus.PENDING_PAYMENT,
    AppointmentStatus.ARRIVED,
    AppointmentStatus.IN_PROGRESS,
  ];

  /** Statuses (and payments) that may only be recorded once the appointment has started. */
  static readonly STARTED_ONLY_STATUSES: AppointmentStatus[] = [
    AppointmentStatus.ARRIVED,
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.EXECUTED,
    AppointmentStatus.NO_SHOW,
  ];

  static readonly SLOT_UNAVAILABLE_MESSAGE = 'This time is not available';

  isAdminRole(role?: string | null): boolean {
    const r = String(role || '').toLowerCase();
    return r === String(UserRole.ADMIN).toLowerCase() || r === String(UserRole.SUPER_ADMIN).toLowerCase();
  }

  /**
   * Normalizes any status input ('completed', 'Completed', ' COMPLETED ') to the canonical
   * upper-case enum value. Unknown values are rejected so nothing but the enum is ever stored.
   */
  normalizeStatus(input: any): AppointmentStatus {
    const value = String(input ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
    const match = (Object.values(AppointmentStatus) as string[]).find(v => v === value);
    if (!match) {
      throw new BadRequestException(`Invalid appointment status: ${input}`);
    }
    return match as AppointmentStatus;
  }

  /** Arrived / no-show / completed / payments are only possible from the appointment start time. */
  assertAppointmentStarted(appointment: Pick<Appointment, 'startTime'>, action = 'This action'): void {
    if (appointment?.startTime && new Date(appointment.startTime).getTime() > Date.now()) {
      throw new BadRequestException(`${action} is only possible from the appointment start time.`);
    }
  }

  /** Sum of the durations (minutes) of the primary + additional services. 0 when unknown. */
  async computeServicesDuration(serviceIds: string[]): Promise<number> {
    const ids = Array.from(new Set((serviceIds || []).filter(id => !!id && UUID_REGEX.test(id))));
    if (ids.length === 0) return 0;
    const services = await this.servicesRepository.find({ where: { id: In(ids) } });
    return services.reduce((sum, s) => sum + (Number((s as any).durationMinutes) || 0), 0);
  }

  /** Sum of the prices of the primary + additional services. */
  async computeServicesPrice(serviceIds: string[]): Promise<number> {
    const ids = Array.from(new Set((serviceIds || []).filter(id => !!id && UUID_REGEX.test(id))));
    if (ids.length === 0) return 0;
    const services = await this.servicesRepository.find({ where: { id: In(ids) } });
    return services.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  }

  /** All treatment names of an appointment (primary first), e.g. "Mesotherapy + Skin Booster". */
  async getTreatmentNames(appointment: Appointment): Promise<string[]> {
    const names: string[] = [];
    const primary = appointment?.service?.treatment?.name || (appointment?.service as any)?.name;
    if (primary) names.push(primary);
    const extraIds = (appointment?.additionalServiceIds || []).filter(id => !!id && UUID_REGEX.test(id) && id !== appointment.serviceId);
    if (extraIds.length > 0) {
      try {
        const extra = await this.servicesRepository.find({ where: { id: In(extraIds) }, relations: ['treatment'] });
        for (const id of extraIds) {
          const svc: any = extra.find(e => e.id === id);
          const name = svc?.treatment?.name || svc?.name;
          if (name) names.push(name);
        }
      } catch {
        // Display only, never fail the caller.
      }
    }
    return names;
  }

  async getTreatmentLabel(appointment: Appointment): Promise<string> {
    const names = await this.getTreatmentNames(appointment);
    return names.length > 0 ? names.join(' + ') : 'Treatment';
  }

  /**
   * Validates a (new) time window for an appointment. Used by create, edit and reschedule:
   *  - start must be before end;
   *  - not in the past (only ADMIN / SUPER_ADMIN may enter an appointment at a past time);
   *  - the clinic must be open that day (clinic time, Europe/Athens by default) and the
   *    appointment must start at or after opening and END by closing time;
   *  - no overlap with a blocked slot (clinic-wide, or for the provider / representative);
   *  - no overlap with another active appointment (same provider, or clinic-wide when no
   *    provider is assigned).
   * Conflict errors never reveal another patient's details.
   */
  async assertSlotBookable(params: {
    clinicId: string;
    providerId?: string | null;
    representativeId?: string | null;
    startTime: Date;
    endTime: Date;
    excludeAppointmentId?: string | null;
    actorRole?: string | null;
    skipAppointmentConflicts?: boolean;
  }): Promise<void> {
    const { clinicId, providerId, representativeId, excludeAppointmentId, actorRole } = params;
    const start = new Date(params.startTime);
    const end = new Date(params.endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date provided');
    }
    if (end.getTime() <= start.getTime()) {
      throw new BadRequestException('The appointment end time must be after its start time.');
    }

    // Past times: admins only (1-minute grace for clock drift).
    if (start.getTime() < Date.now() - 60 * 1000 && !this.isAdminRole(actorRole)) {
      throw new BadRequestException('Appointments cannot be booked in the past.');
    }

    const clinic: any = await this.appointmentsRepository.manager.getRepository(Clinic).findOne({ where: { id: clinicId } });
    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    // Business hours in the clinic's timezone (Europe/Athens by default).
    const tz = clinic.timezone && String(clinic.timezone).trim() ? clinic.timezone : 'Europe/Athens';
    const hours = clinic.businessHours;
    if (hours && typeof hours === 'object' && Object.keys(hours).length > 0) {
      const dayName = formatInTimeZone(start, tz, 'EEEE').toLowerCase();
      const day = hours[dayName];
      if (!day || day.isOpen === false || !day.open || !day.close) {
        throw new BadRequestException('The clinic is closed on the selected day.');
      }
      const pad = (v: string) => {
        const [h, m] = String(v).split(':');
        return `${String(h || '0').padStart(2, '0')}:${String(m || '0').padStart(2, '0')}`;
      };
      const startDay = formatInTimeZone(start, tz, 'yyyy-MM-dd');
      const endDay = formatInTimeZone(end, tz, 'yyyy-MM-dd');
      const startHm = formatInTimeZone(start, tz, 'HH:mm');
      const endHm = formatInTimeZone(end, tz, 'HH:mm');
      if (startDay !== endDay || startHm < pad(day.open) || endHm > pad(day.close)) {
        throw new BadRequestException(`The appointment must be within opening hours (${pad(day.open)}-${pad(day.close)}) and end by closing time.`);
      }
    }

    // Blocked time (clinic-wide, or for this provider / representative).
    const blockQb = this.blockedTimeSlotsRepository.createQueryBuilder('b')
      .where('b.clinicId = :clinicId', { clinicId })
      .andWhere('b.startTime < :end', { end })
      .andWhere('b.endTime > :start', { start });
    const blockOwners = [providerId, representativeId].filter(Boolean) as string[];
    if (blockOwners.length > 0) {
      blockQb.andWhere('(b.providerId IS NULL OR b.providerId IN (:...blockOwners))', { blockOwners });
    } else {
      blockQb.andWhere('b.providerId IS NULL');
    }
    if (await blockQb.getCount() > 0) {
      throw new ConflictException(BookingsService.SLOT_UNAVAILABLE_MESSAGE);
    }

    if (params.skipAppointmentConflicts) return;

    // Overlapping active appointments.
    const aptQb = this.appointmentsRepository.createQueryBuilder('apt')
      .where('apt.clinicId = :clinicId', { clinicId })
      .andWhere('apt.status IN (:...statuses)', { statuses: BookingsService.ACTIVE_STATUSES })
      .andWhere('apt.startTime < :end', { end })
      .andWhere('apt.endTime > :start', { start });
    if (providerId) {
      // Same provider, or an unassigned appointment that occupies the clinic.
      aptQb.andWhere('(apt.providerId = :providerId OR apt.providerId IS NULL)', { providerId });
    }
    if (excludeAppointmentId) {
      aptQb.andWhere('apt.id != :excludeId', { excludeId: excludeAppointmentId });
    }
    if (await aptQb.getCount() > 0) {
      throw new ConflictException(BookingsService.SLOT_UNAVAILABLE_MESSAGE);
    }
  }

  /** Rejects a payment larger than the open balance (total - paid). Unknown totals are not capped. */
  async assertWithinBalance(appointmentId: string, amount: number): Promise<void> {
    if (!(amount > 0)) {
      throw new BadRequestException('The payment amount must be greater than 0.');
    }
    const summary = await this.financialService.getAppointmentPaymentSummary(appointmentId);
    if (summary.total > 0 && amount - summary.balance > 0.009) {
      throw new BadRequestException(
        `Amount exceeds the open balance: Total €${summary.total.toFixed(2)} - Paid €${summary.paid.toFixed(2)} - Balance €${summary.balance.toFixed(2)}.`,
      );
    }
  }

  /** A cancellation less than 24 hours before the appointment start is a late cancellation. */
  isLateCancellation(appointment: Pick<Appointment, 'startTime'>, at: Date = new Date()): boolean {
    if (!appointment?.startTime) return false;
    const msBefore = new Date(appointment.startTime).getTime() - at.getTime();
    return msBefore < 24 * 60 * 60 * 1000;
  }

  /** Refunds every completed payment of an appointment (admin decision only). */
  async refundAppointmentPayments(appointmentId: string, userId?: string, notes?: string): Promise<number> {
    const summary = await this.financialService.getAppointmentPaymentSummary(appointmentId);
    let refunded = 0;
    for (const p of summary.payments) {
      if (p.type === PaymentType.PAYMENT && p.status === 'completed') {
        await this.financialService.refundPayment(p.id, notes, userId);
        refunded += Number(p.amount || 0);
      }
    }
    return refunded;
  }

  /**
   * A PAID appointment was cancelled. Payment state is left untouched (unless an admin chose
   * to refund); admins get a "refund?" alert and a domain event is emitted for the
   * notification layer.
   */
  async handlePaidAppointmentCancelled(
    appointment: Appointment,
    info: { amountPaid: number; refunded: boolean; cancelledById?: string; cancelledByRole?: string },
  ): Promise<void> {
    const tz = appointment.clinic?.timezone || 'Europe/Athens';
    const when = formatDateTimeInTz(appointment.startTime, tz);
    const clientName = appointment.client
      ? `${appointment.client.firstName || ''} ${appointment.client.lastName || ''}`.trim()
      : appointment.clientDetails?.fullName || 'Client';

    this.eventEmitter.emit('appointment.paid_cancelled', {
      appointment,
      appointmentId: appointment.id,
      clinicId: appointment.clinicId,
      clinicName: appointment.clinic?.name || null,
      amountPaid: info.amountPaid,
      currency: 'EUR',
      refunded: info.refunded,
      cancelledById: info.cancelledById || null,
      cancelledByRole: info.cancelledByRole || null,
      isLateCancellation: !!(appointment as any).isLateCancellation,
    });

    // The "refund?" alert itself is sent once by AppointmentNotificationsListener (kind 'cancelled' with paidAmount).
  }

  // Update whitelisted appointment detail fields (provider/time/service/price). Authorization
  // and field whitelisting are enforced by the controller; this replaces direct private-repo access.
  async updateAppointmentDetails(id: string, updateData: any, actor?: { id?: string; role?: string } | null): Promise<Appointment> {
    const appointment = await this.findById(id);
    if (this.isAppointmentCompleted(appointment)) {
      throw new BadRequestException('Completed appointments are locked and cannot be modified.');
    }

    const old = {
      clinicId: appointment.clinicId,
      clinicName: appointment.clinic?.name || null,
      providerId: appointment.providerId || null,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      serviceId: appointment.serviceId,
      additionalServiceIds: appointment.additionalServiceIds || [],
      totalAmount: Number(appointment.totalAmount || 0),
      representativeId: appointment.representativeId || null,
    };

    const next = {
      clinicId: updateData.clinicId !== undefined ? updateData.clinicId : old.clinicId,
      providerId: updateData.providerId !== undefined ? updateData.providerId : old.providerId,
      startTime: updateData.startTime ? new Date(updateData.startTime) : new Date(old.startTime),
      serviceId: updateData.serviceId !== undefined ? updateData.serviceId : old.serviceId,
      additionalServiceIds: (updateData.additionalServiceIds !== undefined ? updateData.additionalServiceIds : old.additionalServiceIds) || [],
      representativeId: updateData.representativeId !== undefined ? updateData.representativeId : old.representativeId,
    };
    if (!next.clinicId) throw new BadRequestException('clinicId is required');
    if (!next.serviceId) throw new BadRequestException('serviceId is required');
    next.additionalServiceIds = Array.from(new Set((next.additionalServiceIds as string[]).filter(sid => !!sid && sid !== next.serviceId)));

    const serviceIds = [next.serviceId, ...next.additionalServiceIds];
    const clinicChanged = String(next.clinicId) !== String(old.clinicId);
    // The old clinic's doctor does not move with the client to another clinic.
    if (clinicChanged && updateData.providerId === undefined) {
      next.providerId = null;
      updateData.providerId = null;
    }
    const servicesChanged =
      String(next.serviceId) !== String(old.serviceId) ||
      JSON.stringify([...next.additionalServiceIds].sort()) !== JSON.stringify([...old.additionalServiceIds].sort());

    // Treatments must belong to the (new) clinic.
    if (clinicChanged || servicesChanged) {
      const services = await this.servicesRepository.find({ where: { id: In(serviceIds) } });
      const foreign = services.some(s => String((s as any).clinicId) !== String(next.clinicId));
      if (services.length !== new Set(serviceIds).size || foreign) {
        throw new BadRequestException('The selected treatments are not offered by this clinic.');
      }
    }

    // Duration = sum of treatments; otherwise keep the requested / existing end.
    const totalDuration = await this.computeServicesDuration(serviceIds);
    let nextEnd: Date;
    if (totalDuration > 0) {
      nextEnd = new Date(next.startTime.getTime() + totalDuration * 60000);
    } else if (updateData.endTime) {
      nextEnd = new Date(updateData.endTime);
    } else {
      nextEnd = new Date(next.startTime.getTime() + (new Date(old.endTime).getTime() - new Date(old.startTime).getTime()));
    }

    const timeChanged =
      next.startTime.getTime() !== new Date(old.startTime).getTime() ||
      nextEnd.getTime() !== new Date(old.endTime).getTime();
    const providerChanged = String(next.providerId || '') !== String(old.providerId || '');

    // Same checks as booking whenever the slot changes (time, duration, clinic or provider).
    if (timeChanged || clinicChanged || providerChanged) {
      await this.assertSlotBookable({
        clinicId: next.clinicId,
        providerId: next.providerId,
        representativeId: next.representativeId,
        startTime: next.startTime,
        endTime: nextEnd,
        excludeAppointmentId: id,
        actorRole: actor?.role,
      });
    }

    const payload: any = { ...updateData };
    payload.startTime = next.startTime;
    payload.endTime = nextEnd;
    if (updateData.additionalServiceIds !== undefined || servicesChanged) payload.additionalServiceIds = next.additionalServiceIds;

    // Price follows the treatments/clinic: recalculate unless an explicit price was sent.
    if ((clinicChanged || servicesChanged) && updateData.totalAmount === undefined) {
      payload.totalAmount = await this.computeServicesPrice(serviceIds);
    }

    await this.appointmentsRepository.update(id, payload);
    const updated = await this.findById(id);

    const changes = {
      appointmentId: id,
      updatedById: actor?.id || null,
      updatedByRole: actor?.role || null,
      oldClinicId: old.clinicId,
      oldClinicName: old.clinicName,
      newClinicId: updated.clinicId,
      newClinicName: updated.clinic?.name || null,
      oldStartTime: old.startTime,
      oldEndTime: old.endTime,
      newStartTime: updated.startTime,
      newEndTime: updated.endTime,
      oldServiceIds: [old.serviceId, ...old.additionalServiceIds],
      newServiceIds: [updated.serviceId, ...(updated.additionalServiceIds || [])],
      oldProviderId: old.providerId,
      newProviderId: updated.providerId || null,
      oldTotalAmount: old.totalAmount,
      newTotalAmount: Number(updated.totalAmount || 0),
      oldRepresentativeId: old.representativeId,
      newRepresentativeId: updated.representativeId || null,
      clinicChanged,
      timeChanged,
      servicesChanged,
      providerChanged,
    };

    // Domain events with the full before/after diff (user-facing notifications go through the
    // single APPOINTMENT_NOTIFY_EVENT below):
    //  - appointment.updated: every edit.
    //  - appointment.clinic_changed: the client moved to another clinic.
    //  - appointment.rescheduled: time moved (calendar sync and confirmation task follow it).
    if (clinicChanged || timeChanged || servicesChanged || providerChanged || changes.oldRepresentativeId !== changes.newRepresentativeId) {
      this.eventEmitter.emit('appointment.updated', { appointment: updated, changes });
    }
    if (clinicChanged) {
      this.eventEmitter.emit('appointment.clinic_changed', { appointment: updated, changes });
    }
    if (timeChanged) {
      this.eventEmitter.emit('appointment.rescheduled', {
        appointment: updated,
        oldStartTime: old.startTime,
        newStartTime: updated.startTime,
        oldClinicId: old.clinicId,
        newClinicId: updated.clinicId,
        changes,
      });
    }
    if (clinicChanged || timeChanged || providerChanged) {
      this.eventEmitter.emit('appointment.calendar.dirty', { appointmentId: id, previousClinicId: clinicChanged ? old.clinicId : undefined });
    }

    // One notification event; recipients are decided in AppointmentNotificationsListener.
    this.eventEmitter.emit(APPOINTMENT_NOTIFY_EVENT, {
      kind: 'changed',
      appointmentId: id,
      actorId: actor?.id,
      previous: {
        startTime: old.startTime,
        clinicId: old.clinicId,
        serviceId: old.serviceId,
        additionalServiceIds: old.additionalServiceIds,
        providerId: old.providerId,
        bookedById: appointment.bookedById,
        representativeId: old.representativeId,
      },
    });

    return updated;
  }

  /** Maps a status change to the single appointment notification event. */
  private emitStatusNotification(appointmentId: string, status: AppointmentStatus, actorId?: string, paidAmount?: number) {
    const s = String(status).toUpperCase();
    const kind =
      s === AppointmentStatus.CANCELLED ? 'cancelled' :
      s === AppointmentStatus.CONFIRMED ? 'confirmed' :
      s === AppointmentStatus.NO_SHOW ? 'no_show' :
      (s === AppointmentStatus.COMPLETED || s === AppointmentStatus.EXECUTED) ? 'completed' :
      null;
    if (!kind) return;
    this.eventEmitter.emit(APPOINTMENT_NOTIFY_EVENT, { kind, appointmentId, actorId, paidAmount });
  }

  async updateStatus(
    id: string,
    rawStatus: AppointmentStatus | string,
    data?: any,
    userId?: string,
    actor?: { role?: string } | null,
  ): Promise<Appointment> {
    const status = this.normalizeStatus(rawStatus);
    const appointment = await this.findById(id);
    const oldStatus = appointment.status;

    if (this.isAppointmentCompleted(appointment)) {
      throw new BadRequestException('Completed appointments are locked and cannot be modified.');
    }

    // Completed / no-show / arrived only from the appointment start time.
    if (BookingsService.STARTED_ONLY_STATUSES.includes(status)) {
      this.assertAppointmentStarted(appointment, `Marking the appointment as ${status}`);
    }

    const updateData: any = { status };
    let paidCancellation: { amountPaid: number; refunded: boolean } | null = null;

    if (status === AppointmentStatus.COMPLETED || status === AppointmentStatus.EXECUTED) {
      updateData.completedAt = new Date();
      updateData.executedAt = new Date();
      updateData.serviceExecuted = true;
      if (userId) {
        updateData.executedById = userId;
      }
      if (data?.treatmentDetails) {
        updateData.treatmentDetails = data.treatmentDetails;
      }
      const resolvedTotal = data?.totalAmount !== undefined
        ? Number(data.totalAmount)
        : Number(appointment.totalAmount || appointment.service?.price || 0);

      if (data?.totalAmount !== undefined) {
        updateData.totalAmount = data.totalAmount;
      } else if (!appointment.totalAmount && resolvedTotal > 0) {
        updateData.totalAmount = resolvedTotal;
      }

      if (data?.paymentMethod) {
        updateData.paymentMethod = data.paymentMethod;
      }
      if (data?.additionalServiceIds) {
        updateData.additionalServiceIds = data.additionalServiceIds;
      }
      if (data?.notes && data.notes.trim()) {
        const newNote = data.notes.trim();
        updateData.notes = appointment.notes && !appointment.notes.includes(newNote)
          ? `${appointment.notes}\n${newNote}`
          : (appointment.notes || newNote);
      }

      // Payments: `amountPaid` is the total the client has paid for this visit. Only the part
      // not yet in the ledger is recorded as a NEW payment; earlier (partial) payments are
      // never overwritten, so every payment keeps its own amount and method.
      const targetPaid = data?.amountPaid !== undefined ? Number(data.amountPaid) : 0;
      if (targetPaid > 0) {
        try {
          const summary = await this.financialService.getAppointmentPaymentSummary(appointment.id);
          const toRecord = Math.round((targetPaid - summary.paid - summary.giftCardRedeemed) * 100) / 100;
          if (toRecord > 0) {
            await this.financialService.recordPayment({
              appointmentId: appointment.id,
              clinicId: appointment.clinicId,
              clientId: appointment.clientId,
              providerId: appointment.providerId,
              amount: toRecord,
              method: (data?.paymentMethod || appointment.paymentMethod || 'cash').toLowerCase() as any,
              type: PaymentType.PAYMENT,
              notes: data?.notes || `Payment recorded at completion of appointment ${appointment.id}`,
              recordedById: userId,
            });

            this.eventEmitter.emit('appointment.paid', {
              appointment: await this.findById(appointment.id).catch(() => appointment),
              amountPaid: toRecord,
              paymentMethod: data?.paymentMethod || appointment.paymentMethod || 'cash',
              markedById: userId,
            });
          }
        } catch (payErr) {
          console.error('[BookingsService] Failed to record payment on completion:', payErr.message);
        }
      }
    } else if (status === AppointmentStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
      updateData.cancelledById = userId;
      updateData.isLateCancellation = this.isLateCancellation(appointment);

      // Payment state is NOT changed by a cancellation. Only an ADMIN may refund, explicitly.
      const amountPaid = Number(appointment?.amountPaid || 0);
      if (amountPaid > 0) {
        const wantsRefund = data?.refund === true || data?.refund === 'true';
        if (wantsRefund && !this.isAdminRole(actor?.role)) {
          throw new ForbiddenException('Only an admin can refund a paid appointment.');
        }
        if (wantsRefund) {
          await this.refundAppointmentPayments(appointment.id, userId, 'Refund on cancellation (admin decision)');
        }
        paidCancellation = { amountPaid, refunded: wantsRefund };
      }

      // Release any active hold for this time slot immediately
      try {
        await this.holdsRepository.delete({
          clinicId: appointment.clinicId,
          startTime: appointment.startTime,
        });
      } catch (holdErr) {
        console.error('[BookingsService] Failed to clear hold on cancel:', holdErr?.message);
      }
    } else if (status === AppointmentStatus.NO_SHOW) {
      updateData.noShowMarkedAt = new Date();
      updateData.noShowMarkedById = userId;
      // Amounts are kept: the price stays for history and amountPaid stays ledger-derived
      // (revenue comes from payments only).
    }

    await this.appointmentsRepository.update(id, updateData);

    const updatedAppointment = await this.findById(id);

    if (paidCancellation) {
      await this.handlePaidAppointmentCancelled(updatedAppointment, {
        amountPaid: paidCancellation.amountPaid,
        refunded: paidCancellation.refunded,
        cancelledById: userId,
        cancelledByRole: actor?.role,
      });
    }

    // Trigger Notification if status actually changed
    if (status !== oldStatus) {
      this.emitStatusNotification(id, status, userId, Number(appointment.amountPaid || 0));

      // Emit events for status changes
      this.eventEmitter.emit('appointment.status.changed', {
        appointment: updatedAppointment,
        oldStatus: oldStatus,
        newStatus: status,
      });

      // Audit log for status changes (Done/Canceled/No-show)
      if ([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW].includes(status as any)) {
        this.eventEmitter.emit('audit.log', {
          userId,
          action: 'APPOINTMENT_STATUS_CHANGE',
          resource: 'appointments',
          resourceId: id,
          changes: { before: { status: oldStatus }, after: { status } },
          data: {
            appointmentId: id,
            clientId: appointment.clientId,
            clinicId: appointment.clinicId,
            clientName: appointment.client ? `${appointment.client.firstName} ${appointment.client.lastName}` : 'Guest',
            therapyName: appointment.service?.treatment?.name || 'Treatment'
          },
        });
      }
    }

    return updatedAppointment;
  }

  async reschedule(
    id: string,
    newStartTime: Date,
    newEndTime: Date,
    notes?: string,
    isClientReschedule: boolean = false,
    actor?: { id?: string; role?: string } | null,
  ): Promise<Appointment> {
    let appointment = await this.findById(id);
    if (this.isAppointmentCompleted(appointment)) {
      throw new BadRequestException('Completed appointments are locked and cannot be rescheduled.');
    }

    // Duration = sum of all treatments (a 2-treatment 60 min visit stays 60 min).
    const durationMinutes = await this.computeServicesDuration([appointment.serviceId, ...(appointment.additionalServiceIds || [])]);
    if (durationMinutes > 0) {
      newEndTime = new Date(newStartTime.getTime() + durationMinutes * 60000);
    }

    // Same checks as on create.
    await this.assertSlotBookable({
      clinicId: appointment.clinicId,
      providerId: appointment.providerId,
      representativeId: appointment.representativeId,
      startTime: newStartTime,
      endTime: newEndTime,
      excludeAppointmentId: id,
      actorRole: actor?.role,
    });

    const oldStartTime = appointment.startTime;
    const oldEndTime = appointment.endTime;
    const oldStatus = appointment.status;
    const updatePayload: any = {
      startTime: newStartTime,
      endTime: newEndTime,
    };

    if (notes && notes.trim()) {
      updatePayload.rescheduleReason = notes.trim();
    }

    if (isClientReschedule) {
      updatePayload.status = AppointmentStatus.PENDING;
    }

    await this.appointmentsRepository.update(id, updatePayload);

    appointment = await this.findById(id);

    this.eventEmitter.emit(APPOINTMENT_NOTIFY_EVENT, {
      kind: 'changed',
      appointmentId: id,
      actorId: actor?.id,
      previous: { startTime: oldStartTime },
      isClientReschedule,
    });

    if (isClientReschedule && oldStatus !== AppointmentStatus.PENDING) {
      this.eventEmitter.emit('appointment.status.changed', {
        appointment,
        oldStatus,
        newStatus: AppointmentStatus.PENDING,
      });
    }

    this.eventEmitter.emit('appointment.rescheduled', {
      appointment,
      oldStartTime,
      oldEndTime,
      newStartTime: appointment.startTime,
      newEndTime: appointment.endTime,
      oldClinicId: appointment.clinicId,
      newClinicId: appointment.clinicId,
      reason: notes,
      isClientReschedule,
      rescheduledById: actor?.id || null,
    });

    return appointment;
  }

  async findUserAppointments(userId: string, role: string): Promise<Appointment[]> {
    const queryBuilder = this.appointmentsRepository.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.clinic', 'clinic')
      .leftJoinAndSelect('appointment.service', 'service')
      .leftJoinAndSelect('service.treatment', 'treatment')
      .leftJoinAndSelect('appointment.provider', 'provider')
      .leftJoinAndSelect('appointment.client', 'client');

    if (role === 'client') {
      queryBuilder.where('appointment.clientId = :userId', { userId });
    } else {
      queryBuilder.where('appointment.providerId = :userId', { userId });
    }

    const appointments = await queryBuilder.orderBy('appointment.startTime', 'ASC').getMany();

    // Multi-treatment appointments: expose every treatment, not only the first.
    const extraIds = Array.from(new Set(appointments.flatMap(a => a.additionalServiceIds || []).filter(id => !!id && UUID_REGEX.test(id))));
    const extraById = new Map<string, any>();
    if (extraIds.length > 0) {
      const extra = await this.servicesRepository.find({ where: { id: In(extraIds) }, relations: ['treatment'] });
      for (const svc of extra) extraById.set(svc.id, svc);
    }

    // Add display name to each appointment and sanitize for client
    return appointments.map(apt => {
      const additionalServices = (apt.additionalServiceIds || [])
        .filter(id => id && id !== apt.serviceId && extraById.has(id))
        .map(id => {
          const svc = extraById.get(id);
          return { id, name: svc?.treatment?.name || svc?.name || 'Treatment', price: Number(svc?.price || 0), durationMinutes: Number(svc?.durationMinutes || 0) };
        });
      const treatmentNames = [apt.service?.treatment?.name || (apt.service as any)?.name, ...additionalServices.map(s => s.name)].filter(Boolean);
      const item: any = {
        ...apt,
        additionalServices,
        treatmentNames,
        treatmentLabel: treatmentNames.join(' + '),
        durationMinutes: Math.round((new Date(apt.endTime).getTime() - new Date(apt.startTime).getTime()) / 60000),
        displayName: this.formatAppointmentDisplayName(apt),
        serviceName: apt.service?.treatment?.name,
        providerName: apt.provider ? `${apt.provider.firstName} ${apt.provider.lastName}`.trim() : null,
      };

      if (role === 'client') {
        // Internal notes NEVER reach the client
        delete item.notes;
        delete item.clinicNotes;
        delete item.appointmentCompletionReport;

        // Client API returns NO bank details
        if (item.clinic) {
          item.clinic = { ...item.clinic };
          delete item.clinic.bankIban;
          delete item.clinic.bankBic;
          delete item.clinic.bankAccountHolder;
          delete item.clinic.bankName;
        }

        // Doctor's personal email/phone never go to clients
        if (item.provider) {
          item.provider = { ...item.provider };
          delete item.provider.email;
          delete item.provider.phone;
          delete item.provider.lastLoginAt;
          delete item.provider.password;
          delete item.provider.refreshToken;
        }
      }

      return item;
    }) as Appointment[];
  }

  async cleanupExpiredHolds(): Promise<void> {
    await this.holdsRepository.delete({
      expiresAt: new Date(),
    });
  }

  // New clinic management methods
  async findClinicAppointments(
    userId: string,
    userRole: string,
    query: { status?: string; date?: string; startDate?: string; endDate?: string; providerId?: string; appointmentSource?: 'clinic_own' | 'platform_broker'; clinicId?: string },
  ): Promise<any[]> {
    try {
      console.log(`[BookingsService] findClinicAppointments called by user: ${userId}, role: ${userRole}`);
      const queryBuilder = this.appointmentsRepository.createQueryBuilder('appointment')
        .leftJoinAndSelect('appointment.clinic', 'clinic')
        .leftJoinAndSelect('appointment.service', 'service')
        .leftJoinAndSelect('service.treatment', 'treatment')
        .leftJoinAndSelect('appointment.provider', 'provider')
        .leftJoinAndSelect('appointment.client', 'client')
        .leftJoinAndSelect('appointment.bookedBy', 'bookedBy')
        .leftJoinAndSelect('appointment.representative', 'representative')
        .leftJoinAndSelect('appointment.executedBy', 'executedBy');

      const normalizedRole = userRole.toLowerCase();
      // 1. Role-based visibility
      if (normalizedRole === 'admin' || normalizedRole === 'super_admin' || normalizedRole === 'manager') {
        queryBuilder.where('1=1');
      } else if (normalizedRole === 'clinic_owner' || normalizedRole === 'secretariat' || normalizedRole === 'doctor') {
        const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ['ownedClinics'] });
        if (!user) throw new NotFoundException('User not found');
        const clinicIds = (user.ownedClinics || []).map(c => c.id);
        if (user.assignedClinicId) clinicIds.push(user.assignedClinicId);

        if (clinicIds.length > 0) {
          queryBuilder.where('appointment.clinicId IN (:...clinicIds)', { clinicIds });
        } else {
          queryBuilder.where('(appointment.providerId = :userId OR appointment.bookedById = :userId)', { userId });
        }
      } else if (normalizedRole === 'salesperson') {
        // Sales team view: User requested that sales people should see ALL appointments
        queryBuilder.where('1=1');
        queryBuilder.leftJoinAndSelect('client.customerRecords', 'clientCustomerRecords');
      } else {
        queryBuilder.where('(appointment.providerId = :userId OR appointment.clientId = :userId OR appointment.bookedById = :userId)', { userId });
      }

      // 2. Filters
      queryBuilder.andWhere('appointment.status != :deleted', { deleted: AppointmentStatus.DELETED });

      if (query.status) {
        queryBuilder.andWhere('appointment.status = :status', { status: query.status.toUpperCase() });
      }
      if (query.startDate && query.endDate) {
        const start = new Date(query.startDate);
        start.setDate(start.getDate() - 1);
        const end = new Date(query.endDate);
        end.setDate(end.getDate() + 1);

        queryBuilder.andWhere('appointment.startTime BETWEEN :start AND :end', { 
          start: new Date(start.setHours(0, 0, 0, 0)), 
          end: new Date(end.setHours(23, 59, 59, 999)) 
        });
      } else if (query.date) {
        const date = new Date(query.date);
        const start = new Date(date);
        start.setDate(start.getDate() - 1);
        const end = new Date(date);
        end.setDate(end.getDate() + 1);
        queryBuilder.andWhere('appointment.startTime BETWEEN :start AND :end', { 
          start: new Date(start.setHours(0, 0, 0, 0)), 
          end: new Date(end.setHours(23, 59, 59, 999)) 
        });
      }
      if (query.clinicId) queryBuilder.andWhere('appointment.clinicId = :clinicId', { clinicId: query.clinicId });
      if (query.providerId) {
        queryBuilder.andWhere('(appointment.providerId = :providerId OR appointment.bookedById = :providerId)', { providerId: query.providerId });
      }
      if (query.appointmentSource) queryBuilder.andWhere('appointment.appointmentSource = :source', { source: query.appointmentSource });

      const appointments = await queryBuilder.orderBy('appointment.startTime', 'ASC').getMany();
      console.log(`[BookingsService] Found ${appointments.length} appointments for user ${userId}`);

      // 3. Repeat Customer Logic
      const clientIds = [...new Set(appointments.map(a => a.clientId).filter(Boolean))];
      let repeatClients = new Set<string>();
      if (clientIds.length > 0) {
        try {
          const previous = await this.appointmentsRepository.createQueryBuilder('apt')
            .select('apt.clientId', 'clientId')
            .where('apt.clientId IN (:...clientIds)', { clientIds })
            .andWhere('apt.status = :status', { status: 'COMPLETED' })
            .groupBy('apt.clientId')
            .getRawMany();
          repeatClients = new Set(previous.map(p => p.clientId));
        } catch (repeatErr) {
          console.error('[BookingsService] Repeat client check failed:', repeatErr.message);
        }
      }

      // 3b. Enrich additionalServiceIds with names for tooltip display
      const allAdditionalIds = [
        ...new Set(
          appointments
            .flatMap(a => a.additionalServiceIds || [])
            .filter(Boolean)
        )
      ];
      let additionalServicesMap: Record<string, { id: string; name: string; price: number }> = {};
      if (allAdditionalIds.length > 0) {
        try {
          const additionalSvcs = await this.servicesRepository.find({
            where: { id: In(allAdditionalIds) },
            relations: ['treatment']
          } as any);
          additionalServicesMap = Object.fromEntries(
            additionalSvcs.map((s: any) => [
              s.id,
              { id: s.id, name: s.name || s.treatment?.name || 'Service', price: s.price || 0 }
            ])
          );
        } catch (svcErr) {
          console.error('[BookingsService] Additional services fetch failed:', svcErr.message);
        }
      }

      // 4. Transform & Mask
      const mappedAppointments = appointments.map(apt => {
        let isMasked = false;

        // PRIVACY RULE: Salespeople see full details for anything the query returned (since the query is already filtered for them)
        if (normalizedRole === 'salesperson') {
          isMasked = false;
        }

        if (isMasked) {
          return {
            id: apt.id,
            startTime: apt.startTime,
            endTime: apt.endTime,
            status: apt.status,
            clinicId: apt.clinicId,
            isBlocked: true,
            displayName: 'Blocked Time',
            serviceName: 'Blocked',
            isBeautyDoctorsClient: false,
            providerName: apt.provider ? `${apt.provider.firstName} ${apt.provider.lastName}` : null,
          };
        }

        const isStaffBooker = apt.bookedBy &&
          apt.bookedBy.role !== 'client' &&
          apt.bookedBy.id !== apt.clientId;
        const staffRepresentative = apt.representative?.role !== 'client' ? apt.representative : null;
        const booker = isStaffBooker ? apt.bookedBy : staffRepresentative;

        return {
          ...apt,
          displayName: this.formatAppointmentDisplayName(apt),
          serviceName: apt.service?.treatment?.name,
          providerName: apt.provider ? `${apt.provider.firstName} ${apt.provider.lastName}` : null,
          bookedByInfo: booker ? {
            id: booker.id,
            name: `${booker.firstName || ''} ${booker.lastName || ''}`.trim(),
            role: booker.role || 'salesperson'
          } : (apt.provider && (apt.provider.role === 'SUPER_ADMIN' || apt.provider.role === 'admin' || apt.provider.role === 'salesperson') ? {
            id: apt.provider.id,
            name: `${apt.provider.firstName} ${apt.provider.lastName}`,
            role: apt.provider.role,
          } : null),
          executedByName: apt.executedBy ? `${apt.executedBy.firstName} ${apt.executedBy.lastName}` : null,
          executedByInfo: apt.executedBy ? {
            id: apt.executedBy.id,
            name: `${apt.executedBy.firstName} ${apt.executedBy.lastName}`,
            role: apt.executedBy.role,
          } : null,
          isReturned: repeatClients.has(apt.clientId),
          isBeautyDoctorsClient: apt.isBeautyDoctorsClient || false,
          // Enriched additional services with names for tooltip display
          additionalServices: (apt.additionalServiceIds || [])
            .map((id: string) => additionalServicesMap[id])
            .filter(Boolean),
        };
      });

      // --- Fetch Blocked Slots ---
      const blockedQb = this.blockedTimeSlotsRepository
        .createQueryBuilder('blocked')
        .leftJoinAndSelect('blocked.provider', 'provider')
        .leftJoinAndSelect('blocked.clinic', 'clinic');

      if (query.startDate && query.endDate) {
        const start = new Date(query.startDate);
        start.setDate(start.getDate() - 1);
        const end = new Date(query.endDate);
        end.setDate(end.getDate() + 1);

        blockedQb.andWhere('blocked.startTime BETWEEN :start AND :end', { 
          start: new Date(start.setHours(0, 0, 0, 0)), 
          end: new Date(end.setHours(23, 59, 59, 999)) 
        });
      } else if (query.date) {
        const date = new Date(query.date);
        const start = new Date(date);
        start.setDate(start.getDate() - 1);
        const end = new Date(date);
        end.setDate(end.getDate() + 1);
        blockedQb.andWhere('blocked.startTime BETWEEN :start AND :end', { 
          start: new Date(start.setHours(0, 0, 0, 0)), 
          end: new Date(end.setHours(23, 59, 59, 999)) 
        });
      }

      if (query.clinicId) blockedQb.andWhere('blocked.clinicId = :clinicId', { clinicId: query.clinicId });
      
      if (query.providerId) {
        blockedQb.andWhere('blocked.providerId = :providerId', { providerId: query.providerId });
      }

      if (normalizedRole === 'clinic_owner' || normalizedRole === 'secretariat' || normalizedRole === 'doctor') {
        const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ['ownedClinics'] });
        if (user) {
          const clinicIds = (user.ownedClinics || []).map(c => c.id);
          if (user.assignedClinicId) clinicIds.push(user.assignedClinicId);

          if (clinicIds.length > 0) {
            blockedQb.andWhere('blocked.clinicId IN (:...clinicIds)', { clinicIds });
          }
        }
      }

      const blockedSlots = await blockedQb.orderBy('blocked.startTime', 'ASC').getMany();

      const mappedBlockedSlots = blockedSlots.map((slot) => {
        return {
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: 'BLOCKED',
          clinicId: slot.clinicId,
          clinic: slot.clinic ? { id: slot.clinic.id, timezone: slot.clinic.timezone } : null,
          isBlocked: true,
          displayName: slot.reason || 'Blocked Time',
          serviceName: slot.reason || 'Blocked',
          isBeautyDoctorsClient: false,
          providerName: slot.provider ? `${slot.provider.firstName} ${slot.provider.lastName}` : null,
          bookedByInfo: null,
          isReturned: false,
        };
      });


      return [...mappedAppointments, ...mappedBlockedSlots];
    } catch (err) {
      console.error('[BookingsService] findClinicAppointments 500:', err);
      this.logDebug('findClinicAppointments 500 ERROR', { message: err.message, stack: err.stack });
      throw err;
    }
  }

  async findAppointmentForClinic(
    appointmentId: string,
    userId: string,
    userRole: string,
  ): Promise<Appointment> {
    const queryBuilder = this.appointmentsRepository.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.clinic', 'clinic')
      .leftJoinAndSelect('appointment.service', 'service')
      .leftJoinAndSelect('service.treatment', 'treatment')
      .leftJoinAndSelect('appointment.provider', 'provider')
      .leftJoinAndSelect('appointment.client', 'client')
      .where('appointment.id = :appointmentId', { appointmentId });

    // Add role-based filtering
    if (userRole === 'clinic_owner' || userRole === 'secretariat' || userRole === 'doctor') {
      const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ['ownedClinics'] });
      const availableClinicIds = [
        ...(user?.ownedClinics || []).map(c => c.id),
        user?.assignedClinicId
      ].filter(Boolean);

      if (availableClinicIds.length > 0) {
        queryBuilder.andWhere('appointment.clinicId IN (:...availableClinicIds)', { availableClinicIds });
      } else {
        queryBuilder.andWhere('appointment.providerId = :userId', { userId });
      }
    }
    // Managers can access appointments if they know the ID (and potentially we should check clinic association)
    // For now, we allow access by ID for managers.

    const appointment = await queryBuilder.getOne();

    if (!appointment) {
      throw new NotFoundException('Appointment not found or access denied');
    }

    return appointment;
  }

  async updateAppointmentStatus(
    appointmentId: string,
    rawStatus: AppointmentStatus | string,
    userId: string,
    userRole: string,
    updateData?: any,
  ): Promise<Appointment> {
    // Normalize status input so only the canonical enum ('COMPLETED', never 'completed') is stored.
    const status = this.normalizeStatus(rawStatus);
    const appointment = await this.findAppointmentForClinic(appointmentId, userId, userRole);
    const oldStatus = appointment.status;

    if (this.isAppointmentCompleted(appointment)) {
      throw new BadRequestException('Completed appointments are locked and cannot be modified.');
    }

    // Arrived / no-show / completed only from the appointment start time.
    if (BookingsService.STARTED_ONLY_STATUSES.includes(status)) {
      this.assertAppointmentStarted(appointment, `Marking the appointment as ${status}`);
    }

    // Paid appointment cancelled: payment is NOT touched; only an admin may refund explicitly.
    let paidCancellation: { amountPaid: number; refunded: boolean } | null = null;
    if (status === AppointmentStatus.CANCELLED && oldStatus !== AppointmentStatus.CANCELLED && Number(appointment.amountPaid || 0) > 0) {
      const wantsRefund = updateData?.refund === true || updateData?.refund === 'true';
      if (wantsRefund && !this.isAdminRole(userRole)) {
        throw new ForbiddenException('Only an admin can refund a paid appointment.');
      }
      const paidBefore = Number(appointment.amountPaid || 0);
      if (wantsRefund) {
        await this.refundAppointmentPayments(appointment.id, userId, 'Refund on cancellation (admin decision)');
        // recordPayment(REFUND) already lowered amountPaid in the DB; keep the entity in sync
        // so the save() below does not write the stale value back.
        const refreshed = await this.appointmentsRepository.findOne({ where: { id: appointment.id } });
        if (refreshed) appointment.amountPaid = refreshed.amountPaid;
      }
      paidCancellation = { amountPaid: paidBefore, refunded: wantsRefund };
    }

    // 1. CONFIRMATION RESTRICTION: Clinique can confirm, sales and admin
    if (status === AppointmentStatus.CONFIRMED) {
      const allowedRoles = [
        UserRole.ADMIN,
        UserRole.SUPER_ADMIN,
        UserRole.SALESPERSON,
        UserRole.MANAGER,
        UserRole.CLINIC_OWNER,
        UserRole.SECRETARIAT,
        UserRole.DOCTOR,
      ];
      if (!allowedRoles.includes(userRole as UserRole)) {
        throw new ForbiddenException('You are not allowed to confirm appointments. Please contact your Beauty Doctors representative.');
      }
    }

    // 2. EXECUTION & RECALCULATION LOGIC
    if (status === AppointmentStatus.EXECUTED || status === AppointmentStatus.COMPLETED) {
      appointment.serviceExecuted = true;
      appointment.executedAt = new Date();
      appointment.executedById = userId;
      appointment.completedAt = new Date();

      // Update details shared during the execution phase
      if (updateData?.serviceId) appointment.serviceId = updateData.serviceId;
      if (updateData?.totalAmount !== undefined) appointment.totalAmount = Number(updateData.totalAmount);
      // amountPaid is derived from the payment ledger only (recordPayment); never set it from input.
      if (updateData?.rewardPointsRedeemed) appointment.rewardPointsRedeemed = Number(updateData.rewardPointsRedeemed);

      // RULE: Persistence of isReturned flag
      if (!appointment.isReturned) {
        try {
          const previousDone = await this.appointmentsRepository.findOne({
            where: { clientId: appointment.clientId, status: In([AppointmentStatus.COMPLETED, AppointmentStatus.EXECUTED]) },
            order: { completedAt: 'DESC' },
          });
          appointment.isReturned = !!previousDone;
        } catch (rErr) {
          console.error('[BookingsService] Ret check failed:', rErr.message);
        }
      }

      // TRIGGER NOTIFICATION: Every execution must notify sales and admin
      this.eventEmitter.emit('appointment.executed', {
        appointment,
        performedBy: userId
      });
    }

    if (status === AppointmentStatus.CANCELLED) {
      appointment.cancelledAt = new Date();
      appointment.cancelledById = userId;
      appointment.isLateCancellation = this.isLateCancellation(appointment);
    } else if (status === AppointmentStatus.NO_SHOW) {
      appointment.noShowMarkedAt = new Date();
      appointment.noShowMarkedById = userId;
      // Amounts kept (price for history, amountPaid ledger-derived).
    }

    if (updateData?.notes && updateData.notes.trim()) {
      const newNote = updateData.notes.trim();
      appointment.notes = appointment.notes && !appointment.notes.includes(newNote)
        ? `${appointment.notes}\n${newNote}`
        : (appointment.notes || newNote);
    }
    if (updateData?.treatmentDetails) appointment.treatmentDetails = updateData.treatmentDetails;

    appointment.status = status;
    const saved = await this.appointmentsRepository.save(appointment);
    const updated = await this.findById(saved.id);

    if (paidCancellation) {
      await this.handlePaidAppointmentCancelled(updated, {
        amountPaid: paidCancellation.amountPaid,
        refunded: paidCancellation.refunded,
        cancelledById: userId,
        cancelledByRole: userRole,
      });
    }

    // 3. The linked confirmation-call task follows the appointment via the CRM listener
    //    ('appointment.calendar.dirty' / 'appointment.executed'); no follow-up tasks are created.

    // 4. NOTIFICATION (one event; recipients decided by the listener)
    if (oldStatus !== status) {
      this.emitStatusNotification(updated.id, status, userId, Number(appointment.amountPaid || 0));
    }

    // This clinic-scoped path previously only emitted `appointment.executed`. Emit a
    // dedicated calendar-sync signal (not the shared status.changed event, to avoid
    // altering existing listeners) so Google Calendar reliably reflects confirmations,
    // cancellations and no-shows made here too.
    if (oldStatus !== status) {
      this.eventEmitter.emit('appointment.calendar.dirty', {
        appointmentId: updated.id,
      });
    }

    return updated;
  }

  async completeAppointmentWithPayment(
    appointmentId: string,
    userId: string,
    userRole: string,
    paymentData?: RecordPaymentDto,
    treatmentDetails?: any,
    completionReport?: {
      patientCame: boolean;
      servicePerformed: string;
      amountPaid: number;
      renewalDate?: string;
      notes?: string;
    },
    serviceId?: string,
    giftCardCode?: string,
  ): Promise<Appointment> {
    console.log('[BookingsService] completeAppointmentWithPayment HIT!', { appointmentId, paymentData, serviceId, giftCardCode });
    const appointment = await this.findAppointmentForClinic(appointmentId, userId, userRole);
    if (this.isAppointmentCompleted(appointment)) {
      throw new BadRequestException('This appointment has already been completed and is locked.');
    }
    // Completion and payments only from the appointment start time.
    this.assertAppointmentStarted(appointment, 'Completing the appointment');
    const oldStatus = appointment.status;
    const oldTotal = Number(appointment.totalAmount ?? 0);
    const oldAdvance = Number(appointment.advancePaymentAmount ?? 0);

    appointment.status = AppointmentStatus.COMPLETED;
    appointment.completedAt = new Date();
    appointment.executedAt = new Date();
    appointment.serviceExecuted = true;
    if (userId) {
      appointment.executedById = userId;
    }

    if (serviceId) {
      appointment.serviceId = serviceId;
    }

    if (treatmentDetails) {
      appointment.treatmentDetails = treatmentDetails;
    }

    if (paymentData) {
      // For a normal (non-advance) payment `amount` is the visit total; only the open balance
      // (total minus earlier partial payments) is recorded as a new payment below.
      const visitTotal = Number(paymentData.amount || 0);
      appointment.paymentMethod = paymentData.paymentMethod;
      if (paymentData.isAdvancePayment) {
        appointment.advancePaymentAmount = paymentData.amount;
      } else {
        appointment.totalAmount = paymentData.amount;
      }
      if (paymentData.notes && paymentData.notes.trim()) {
        const newNote = paymentData.notes.trim();
        appointment.notes = appointment.notes && !appointment.notes.includes(newNote)
          ? `${appointment.notes}\n${newNote}`
          : (appointment.notes || newNote);
      }

      // Handle Gift Card Redemption
      if (giftCardCode && paymentData.amount > 0) {
        try {
          const giftCard = await this.financialService.validateGiftCard(giftCardCode);
          if (giftCard && giftCard.valid) {
            const discount = Math.min(giftCard.balance, paymentData.amount);
            console.log(`[BookingsService] Redeeming Gift Card ${giftCardCode} for amount ${discount}`);
            
            // Record Gift Card Payment explicitly
            await this.financialService.recordPayment({
              appointmentId: appointment.id,
              clinicId: appointment.clinicId, // Clinic gets the revenue attribution
              clientId: appointment.clientId,
              providerId: appointment.providerId,
              amount: discount,
              method: RecordPaymentMethod.GIFT_CARD,
              type: PaymentType.PAYMENT,
              notes: `Gift Card Redeemed: Code ${giftCardCode}`,
              recordedById: userId,
            });

            // Update Gift Card Status
            const giftCardRepo = this.appointmentsRepository.manager.getRepository('GiftCard');
            const card = await giftCardRepo.findOne({ where: { id: giftCard.id } });
            if (card) {
              card.balance = Math.max(0, Number(card.balance) - discount);
              if (card.balance <= 0) {
                card.isActive = false;
              }
              card.redeemedByUserId = appointment.clientId;
              card.redeemedAt = new Date();
              card.redeemedAppointmentId = appointment.id;
              await giftCardRepo.save(card);
            }

            // Reduce remaining amount for the rest of the logic
            paymentData.amount = Math.max(0, paymentData.amount - discount);
          }
        } catch (gcErr) {
          console.error('[BookingsService] Gift Card redemption failed:', gcErr.message);
        }
      }

      // Record what is still open as a NEW payment. Earlier (partial) payments are never
      // overwritten, so each payment keeps its own amount and method.
      try {
        const type = paymentData.isAdvancePayment ? PaymentType.DEPOSIT : PaymentType.PAYMENT;
        let toRecord = Number(paymentData.amount || 0);
        if (!paymentData.isAdvancePayment) {
          const summary = await this.financialService.getAppointmentPaymentSummary(appointment.id);
          toRecord = Math.round((visitTotal - summary.paid - summary.giftCardRedeemed) * 100) / 100;
        }
        if (toRecord > 0) {
          await this.financialService.recordPayment({
            appointmentId: appointment.id,
            clinicId: appointment.clinicId,
            clientId: appointment.clientId,
            providerId: appointment.providerId,
            amount: toRecord,
            method: String(paymentData.paymentMethod || 'cash').toLowerCase() as any,
            type,
            notes: paymentData.notes,
            recordedById: userId,
          });
        }
      } catch (fErr) {
        console.error('[BookingsService] Revenue update failed:', fErr.message, fErr.stack);
      }

      // RULE: Always re-sync the in-memory appointment.amountPaid AFTER recording a payment 
      // to ensure the final .save() doesn't overwrite the DB with stale zero data.
      try {
        const records = await this.financialService['paymentRecordsRepository'].find({ where: { appointmentId: appointment.id } });
        appointment.amountPaid = records.reduce((acc, r) => {
          const sign = (r.type === PaymentType.REFUND || r.type === PaymentType.VOID) ? -1 : 1;
          return acc + (Number(r.amount || 0) * sign);
        }, 0);
      } catch (sumErr) {
        console.error('[BookingsService] Final amountPaid sync failed:', sumErr.message);
      }
    }

    // Handle completion report
    if (completionReport) {
      appointment.showStatus = completionReport.patientCame ? 'showed_up' : 'no_show';
      appointment.serviceExecuted = completionReport.patientCame && !!completionReport.servicePerformed;
      if (completionReport.notes && completionReport.notes.trim()) {
        const newNote = completionReport.notes.trim();
        appointment.clinicNotes = appointment.clinicNotes && !appointment.clinicNotes.includes(newNote)
          ? `${appointment.clinicNotes}\n${newNote}`
          : (appointment.clinicNotes || newNote);
      }

      // Store completion report
      appointment.appointmentCompletionReport = {
        patientCame: completionReport.patientCame,
        servicePerformed: completionReport.servicePerformed || '',
        amountPaid: completionReport.amountPaid,
        renewalDate: completionReport.renewalDate ? new Date(completionReport.renewalDate) : undefined,
        notes: completionReport.notes,
        recordedAt: new Date(),
        recordedById: userId,
      };

      // Price from the report; amountPaid stays ledger-derived (never set without a payment record).
      if (completionReport.amountPaid && !paymentData) {
        appointment.totalAmount = completionReport.amountPaid;
      }
    }

    // RULE 8: Compute & persist isReturned at completion time (strict definition)
    try {
      const previousDone = await this.appointmentsRepository.findOne({
        where: {
          clientId: appointment.clientId,
          status: AppointmentStatus.COMPLETED,
        },
        order: { completedAt: 'DESC' },
      });
      // isReturned = true if there is ANY prior completed appointment for this client
      // (we check completedAt to ensure it's strictly before this appointment's scheduledTime)
      appointment.isReturned = !!previousDone && new Date(previousDone.completedAt) < new Date(appointment.startTime);
    } catch (returnedErr) {
      console.error('[BookingsService] isReturned check failed:', returnedErr.message);
      appointment.isReturned = false;
    }

    const savedAppointment = await this.appointmentsRepository.save(appointment);

    // RULE 9: Auto-complete related CRM task that triggered this appointment
    try {
      const relatedTasks = await this.crmService['crmActionsRepository']?.find?.({ where: { relatedAppointmentId: appointmentId, status: 'pending' } });
      if (relatedTasks?.length) {
        for (const task of relatedTasks) {
          await this.crmService['crmActionsRepository'].update(task.id, { status: 'completed', completedAt: new Date() });
        }
      }
    } catch (taskErr) {
      console.error('[BookingsService] Task auto-complete failed:', taskErr.message);
    }

    const newTotal = Number(savedAppointment.totalAmount ?? 0);
    const newAdvance = Number(savedAppointment.advancePaymentAmount ?? 0);

    this.eventEmitter.emit('audit.log', {
      userId,
      action: 'APPOINTMENT_COMPLETED',
      resource: 'appointments',
      resourceId: savedAppointment.id,
      changes: {
        before: { status: oldStatus, totalAmount: oldTotal, advancePaymentAmount: oldAdvance },
        after: { status: savedAppointment.status, totalAmount: newTotal, advancePaymentAmount: newAdvance },
      },
      data: {
        appointmentId,
        paymentMethod: savedAppointment.paymentMethod,
        clientName: appointment.client ? `${appointment.client.firstName} ${appointment.client.lastName}` : 'Guest',
        therapyName: appointment.service?.treatment?.name || 'Treatment'
      },
    });

    // Emit event for notifications and loyalty
    this.eventEmitter.emit('appointment.status.changed', {
      appointment: savedAppointment,
      oldStatus,
      newStatus: AppointmentStatus.COMPLETED,
    });
    this.eventEmitter.emit(APPOINTMENT_NOTIFY_EVENT, { kind: 'completed', appointmentId: savedAppointment.id, actorId: userId });

    return savedAppointment;
  }

  async recordAppointmentPayment(
    appointmentId: string,
    amount: number,
    method: string,
    notes: string,
    userId: string,
  ): Promise<any> {
    const appointment = await this.findById(appointmentId);
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (this.isAppointmentCompleted(appointment)) {
      throw new BadRequestException('Completed appointments are locked and payments cannot be modified.');
    }
    this.assertAppointmentStarted(appointment, 'Recording a payment');
    await this.assertWithinBalance(appointmentId, Number(amount));

    // Normalize method to lowercase to match PaymentMethod enum (cash, card, pos, etc.)
    const normalizedMethod = method?.toLowerCase() as any;

    // Update totalAmount on appointment if paying in advance
    await this.appointmentsRepository.update(appointmentId, {
      paymentMethod: normalizedMethod,
    });

    return this.financialService.recordPayment({
      appointmentId: appointment.id,
      clinicId: appointment.clinicId,
      clientId: appointment.clientId,
      providerId: appointment.providerId,
      amount: amount,
      method: normalizedMethod,
      notes: notes,
      recordedById: userId,
      type: PaymentType.PAYMENT
    });
  }

  // RULE 7: Soft-delete an appointment (sets status = DELETED, voids revenue)
  async softDeleteAppointment(appointmentId: string, userId: string, userRole: string): Promise<Appointment> {
    const appointment = await this.findAppointmentForClinic(appointmentId, userId, userRole);

    if (this.isAppointmentCompleted(appointment)) {
      throw new BadRequestException('Completed appointments are locked and cannot be deleted.');
    }

    if (appointment.status === AppointmentStatus.DELETED) {
      throw new BadRequestException('Appointment is already deleted');
    }

    // Void revenue if payment was recorded
    try {
      await this.financialService['paymentRecordsRepository']?.update?.(
        { appointmentId },
        { notes: `VOIDED: Appointment soft-deleted by userId=${userId} at ${new Date().toISOString()}` }
      );
    } catch (voidErr) {
      console.error('[BookingsService] Payment void failed during soft-delete:', voidErr.message);
    }

    await this.appointmentsRepository.update(appointmentId, {
      status: AppointmentStatus.DELETED,
      cancelledAt: new Date(),
      cancelledById: userId,
      amountPaid: 0,
      totalAmount: 0,
    });

    // Release any active hold for this time slot immediately
    try {
      await this.holdsRepository.delete({
        clinicId: appointment.clinicId,
        startTime: appointment.startTime,
      });
    } catch (holdErr) {
      console.error('[BookingsService] Failed to clear hold on soft-delete:', holdErr?.message);
    }

    this.eventEmitter.emit('audit.log', {
      userId,
      action: 'APPOINTMENT_SOFT_DELETE',
      resource: 'appointments',
      resourceId: appointmentId,
      data: {
        appointmentId,
        previousStatus: appointment.status,
        clinicId: appointment.clinicId,
        clientName: appointment.client ? `${appointment.client.firstName} ${appointment.client.lastName}` : 'Guest',
        therapyName: appointment.service?.treatment?.name || 'Treatment'
      },
    });

    // Dedicated calendar-sync signal (not the shared status.changed event, to avoid
    // altering existing notification/loyalty listeners) so Google Calendar removes the event.
    this.eventEmitter.emit('appointment.calendar.dirty', { appointmentId });
    this.eventEmitter.emit(APPOINTMENT_NOTIFY_EVENT, { kind: 'deleted', appointmentId, actorId: userId });

    return this.findById(appointmentId);
  }

  async recordPayment(
    appointmentId: string,
    userId: string,
    paymentData: RecordPaymentDto,
  ): Promise<Appointment> {
    const appointment = await this.findAppointmentForClinic(appointmentId, userId, 'admin');
    if (this.isAppointmentCompleted(appointment)) {
      throw new BadRequestException('Completed appointments are locked and payments cannot be modified.');
    }
    this.assertAppointmentStarted(appointment, 'Recording a payment');
    const beforeAdvance = Number(appointment.advancePaymentAmount ?? 0);
    const beforeTotal = Number(appointment.totalAmount ?? 0);

    // `amount` is the money received now (partial payments allowed); it never replaces the
    // appointment price. Only the open balance may be collected.
    if (paymentData.isAdvancePayment) {
      appointment.advancePaymentAmount = Number(appointment.advancePaymentAmount || 0) + Number(paymentData.amount || 0);
    } else {
      await this.assertWithinBalance(appointment.id, Number(paymentData.amount));
    }

    appointment.paymentMethod = paymentData.paymentMethod;
    if (paymentData.notes && paymentData.notes.trim()) {
      const newNote = paymentData.notes.trim();
      appointment.notes = appointment.notes && !appointment.notes.includes(newNote)
        ? `${appointment.notes}\n${newNote}`
        : (appointment.notes || newNote);
    }

    const savedAppointment = await this.appointmentsRepository.save(appointment);

    this.eventEmitter.emit('audit.log', {
      userId,
      action: 'APPOINTMENT_PAYMENT_RECORD',
      resource: 'appointments',
      resourceId: appointmentId,
      changes: {
        before: { advancePaymentAmount: beforeAdvance, totalAmount: beforeTotal },
        after: {
          advancePaymentAmount: Number(savedAppointment.advancePaymentAmount ?? 0),
          totalAmount: Number(savedAppointment.totalAmount ?? 0),
        },
      },
      data: {
        appointmentId,
        amount: paymentData.amount,
        method: paymentData.paymentMethod,
        isAdvance: paymentData.isAdvancePayment,
        clientName: appointment.client ? `${appointment.client.firstName} ${appointment.client.lastName}` : 'Guest',
        therapyName: appointment.service?.treatment?.name || 'Treatment'
      },
    });

    // Record in PaymentRecord
    await this.financialService.recordPayment({
      appointmentId: appointment.id,
      clinicId: appointment.clinicId,
      clientId: appointment.clientId,
      providerId: appointment.providerId,
      amount: paymentData.amount,
      method: paymentData.paymentMethod as any,
      type: paymentData.isAdvancePayment ? PaymentType.DEPOSIT : PaymentType.PAYMENT,
      notes: paymentData.notes,
      recordedById: userId,
    });

    // Emit event to update CRM metrics (lifetime value, etc.)
    this.eventEmitter.emit('appointment.status.changed', {
      appointment: savedAppointment,
      oldStatus: appointment.status,
      newStatus: appointment.status,
    });

    return savedAppointment;
  }

  async getAppointmentPayments(
    appointmentId: string,
    userId: string,
    userRole: string,
  ): Promise<any[]> {
    const appointment = await this.findAppointmentForClinic(appointmentId, userId, userRole);

    // Return payment information from the appointment
    return [
      {
        id: appointment.id,
        paymentMethod: appointment.paymentMethod,
        advancePaymentAmount: appointment.advancePaymentAmount,
        totalAmount: appointment.totalAmount,
        recordedAt: appointment.updatedAt,
      },
    ];
  }

  async getClinicAppointmentAnalytics(
    userId: string,
    userRole: string,
    query: { startDate?: string; endDate?: string; serviceId?: string; clinicId?: string },
  ): Promise<any> {
    const qb = this.appointmentsRepository.createQueryBuilder('appointment');

    // Authorization filter
    if (userRole === 'admin' || userRole === 'SUPER_ADMIN') {
      qb.where('1=1');
    } else if (userRole === 'clinic_owner' || userRole === 'secretariat' || userRole === 'doctor') {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ['ownedClinics'],
      });
      if (!user) throw new NotFoundException('User not found');
      const clinicIds = (user.ownedClinics || []).map(c => c.id);
      if (user.assignedClinicId) clinicIds.push(user.assignedClinicId);
      if (clinicIds.length > 0) {
        qb.andWhere('appointment.clinicId IN (:...clinicIds)', { clinicIds });
      } else {
        qb.andWhere('appointment.providerId = :userId', { userId });
      }
    } else if (userRole === 'manager' && query.clinicId) {
      qb.andWhere('appointment.clinicId = :clinicId', { clinicId: query.clinicId });
    } else {
      qb.where('appointment.providerId = :userId', { userId });
    }

    if (query.startDate && query.endDate) {
      qb.andWhere('appointment.startTime BETWEEN :startDate AND :endDate', {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      });
    }

    if (query.serviceId) {
      qb.andWhere('appointment.serviceId = :serviceId', { serviceId: query.serviceId });
    }

    const appointments = await qb.getMany();

    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === AppointmentStatus.COMPLETED || a.status === AppointmentStatus.EXECUTED).length;
    const cancelledAppointments = appointments.filter(a => a.status === AppointmentStatus.CANCELLED || a.status === AppointmentStatus.DELETED).length;
    const noShows = appointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length;
    // Revenue: ONE shared definition (payments received, EUR, net of refunds, by payment date).
    const revenueFilters = await this.resolveRevenueScope(userId, userRole, query);
    const totalRevenue = await getPaidRevenueTotal(this.appointmentsRepository.manager, revenueFilters);
    const averageAppointmentValue = completedAppointments > 0 ? totalRevenue / completedAppointments : 0;

    return {
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      noShows,
      totalRevenue,
      currency: 'EUR',
      averageAppointmentValue,
      period: { startDate: query.startDate, endDate: query.endDate },
      clinicId: query.clinicId || null,
    };
  }

  /**
   * Revenue scope for clinic-side analytics: admins see everything (or one clinic), clinic
   * staff only their own clinic(s), a doctor without a clinic only payments where they are
   * the provider. Period = payment date.
   */
  private async resolveRevenueScope(
    userId: string,
    userRole: string,
    query: { startDate?: string; endDate?: string; clinicId?: string },
  ): Promise<RevenueFilters> {
    const filters: RevenueFilters = {};
    if (query.startDate) filters.startDate = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      // A date-only end (yyyy-MM-dd) includes the whole day.
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(query.endDate))) end.setUTCHours(23, 59, 59, 999);
      filters.endDate = end;
    }

    const role = String(userRole || '').toLowerCase();
    if (this.isAdminRole(role)) {
      if (query.clinicId) filters.clinicId = query.clinicId;
    } else if (role === 'clinic_owner' || role === 'secretariat' || role === 'doctor') {
      const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ['ownedClinics'] });
      if (!user) throw new NotFoundException('User not found');
      const clinicIds = (user.ownedClinics || []).map(c => c.id);
      if (user.assignedClinicId) clinicIds.push(user.assignedClinicId);
      if (clinicIds.length > 0) {
        filters.clinicIds = query.clinicId ? clinicIds.filter(id => id === query.clinicId) : clinicIds;
      } else {
        filters.providerId = userId;
      }
    } else if (role === 'manager' && query.clinicId) {
      filters.clinicId = query.clinicId;
    } else {
      filters.providerId = userId;
    }
    return filters;
  }

  async getClinicRevenueAnalytics(
    userId: string,
    userRole: string,
    query: { startDate?: string; endDate?: string; serviceId?: string; clinicId?: string },
  ): Promise<any> {
    // ONE figure for every revenue page: payments received (EUR), net of refunds/voids,
    // by payment date, scoped to the caller's clinic(s). Unpaid / future visits never count.
    const filters = await this.resolveRevenueScope(userId, userRole, query);
    const manager = this.appointmentsRepository.manager;
    const totalRevenue = await getPaidRevenueTotal(manager, filters);

    // Revenue by treatment (same rules, grouped by the appointment's primary treatment).
    const rows = await buildPaidRevenueQuery(manager, filters, 'p')
      .leftJoin('p_apt.service', 'svc')
      .leftJoin('svc.treatment', 'tr')
      .select(`COALESCE(tr.name, 'Other')`, 'serviceName')
      .addSelect(netPaidExpression('p'), 'revenue')
      .addSelect('COUNT(DISTINCT p.appointmentId)', 'count')
      .groupBy('tr.name')
      .getRawMany();
    const revenueByService = rows
      .map((r: any) => ({
        serviceName: r.serviceName ?? r.servicename ?? 'Other',
        revenue: Number(r.revenue || 0),
        count: Number(r.count || 0),
      }))
      .filter(r => r.revenue !== 0)
      .sort((a, b) => b.revenue - a.revenue);

    const paidVisits = revenueByService.reduce((sum, r) => sum + r.count, 0);
    const averageAppointmentValue = paidVisits > 0 ? totalRevenue / paidVisits : 0;

    return {
      totalRevenue,
      currency: 'EUR',
      averageAppointmentValue,
      revenueByService,
      period: { startDate: query.startDate, endDate: query.endDate },
      clinicId: query.clinicId || null,
    };
  }

  async getRepeatClientForecast(
    userId: string,
    userRole: string,
    query: { startDate?: string; endDate?: string; clinicId?: string },
  ): Promise<any> {
    const qb = this.appointmentsRepository.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.client', 'client');

    // Permissions
    if (userRole === 'clinic_owner' || userRole === 'secretariat') {
      qb.leftJoin('appointment.clinic', 'clinic')
        .where('clinic.ownerId = :userId', { userId });
    } else if (userRole === 'manager' && query.clinicId) {
      qb.andWhere('appointment.clinicId = :clinicId', { clinicId: query.clinicId });
    } else if (userRole === 'admin' || userRole === 'SUPER_ADMIN') {
      qb.where('1=1');
    } else {
      qb.where('appointment.providerId = :userId', { userId });
    }

    const appointments = await qb.getMany();

    // Map clients to their visits
    const clientMap = new Map<string, any>();
    appointments.forEach(a => {
      if (!a.clientId) return;
      const current = clientMap.get(a.clientId) || {
        id: a.clientId,
        name: a.client ? `${a.client.firstName} ${a.client.lastName}` : 'Guest',
        visitCount: 0,
        lastVisit: a.startTime,
        totalRevenue: 0,
        expectedNextVisit: null,
      };
      current.visitCount += 1;
      if (new Date(a.startTime) > new Date(current.lastVisit)) {
        current.lastVisit = a.startTime;
      }
      current.totalRevenue += Number(a.amountPaid || 0);
      clientMap.set(a.clientId, current);
    });

    const clients = Array.from(clientMap.values());
    const repeatClients = clients.filter(c => c.visitCount > 1);

    // Simple math for forecast
    const repeatRate = clients.length > 0 ? (repeatClients.length / clients.length) * 100 : 0;
    const customersExpectedNextMonth = Math.ceil(repeatClients.length * 0.85); // Assume 85% return rate for repeaters
    const avgLifetimeValue = clients.length > 0 ? clients.reduce((s, c) => s + c.totalRevenue, 0) / clients.length : 0;
    const estimatedRevenue = customersExpectedNextMonth * avgLifetimeValue;

    // Set expected next visit for top repeaters
    repeatClients.forEach(c => {
      const nextDate = new Date(c.lastVisit);
      nextDate.setDate(nextDate.getDate() + 45); // Prediction: return every 45 days
      c.expectedNextVisit = nextDate.toISOString();
    });

    return {
      customersExpectedNextMonth,
      estimatedRevenue,
      repeatRate,
      customers: repeatClients.sort((a, b) => b.visitCount - a.visitCount),
      period: { startDate: query.startDate, endDate: query.endDate }
    };
  }

  async getClinicClients(
    userId: string,
    userRole: string,
    query: { search?: string; limit?: number; offset?: number; clinicId?: string },
  ): Promise<any> {
    let baseQuery = this.appointmentsRepository.createQueryBuilder('appointment')
      .select([
        'appointment.clientId',
        'client.firstName as firstName',
        'client.lastName as lastName',
        'client.email as clientEmail',
        'client.phone as clientPhone',
        'client.createdAt as createdAt',
        'COUNT(appointment.id) as totalVisits',
        'SUM(appointment.totalAmount) as totalSpent',
        'MAX(appointment.startTime) as lastVisit',
      ])
      .leftJoin('appointment.client', 'client')
      .groupBy('appointment.clientId, client.firstName, client.lastName, client.email, client.phone, client.createdAt');

    // Filter clients based on user role and clinical association
    if (userRole === 'admin' || userRole === 'SUPER_ADMIN') {
      // Admins and SUPER_ADMINs see all. No restrictions.
      baseQuery.where('1=1');
    } else if (userRole === 'clinic_owner' || userRole === 'secretariat' || userRole === 'doctor') {
      // Get the user to check their clinic associations
      const user = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ['ownedClinics'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const clinicIds = (user.ownedClinics || []).map(c => c.id);
      if (user.assignedClinicId && !clinicIds.includes(user.assignedClinicId)) {
        clinicIds.push(user.assignedClinicId);
      }

      try {
        const ownershipRepo = this.usersRepository.manager.getRepository('clinic_ownership');
        const ownerships = await ownershipRepo.find({ where: { ownerUserId: userId } });
        ownerships.forEach((o: any) => {
          if (o.clinicId && !clinicIds.includes(o.clinicId)) clinicIds.push(o.clinicId);
        });

        const agentAccessRepo = this.usersRepository.manager.getRepository('agent_clinic_access');
        const agentAccess = await agentAccessRepo.find({ where: { agentUserId: userId } });
        agentAccess.forEach((a: any) => {
          if (a.clinicId && !clinicIds.includes(a.clinicId)) clinicIds.push(a.clinicId);
        });
      } catch (e) {}

      if (clinicIds.length > 0) {
        baseQuery = baseQuery.leftJoin('appointment.clinic', 'clinic')
          .where('(appointment.clinicId IN (:...clinicIds) OR appointment.providerId = :userId)', { clinicIds, userId });
      } else {
        // Fallback: If no clinic assigned, only show their own
        baseQuery = baseQuery.where('appointment.providerId = :userId', { userId });
      }
    } else if (userRole === 'manager' && query.clinicId) {
      baseQuery = baseQuery.andWhere('appointment.clinicId = :clinicId', { clinicId: query.clinicId });
    } else {
      // For salespeople and others, only show those where they are provider or involved
      baseQuery = baseQuery.where('appointment.providerId = :userId', { userId });
    }

    if (query.search) {
      baseQuery = baseQuery.andWhere(
        '(CONCAT(client.firstName, \' \', client.lastName) ILIKE :search OR client.email ILIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    // Capture the full result set size BEFORE paginating so `total` reflects the real count,
    // not just the current page length.
    const countQuery = baseQuery.clone();

    if (query.limit) {
      baseQuery = baseQuery.limit(query.limit);
    }

    if (query.offset) {
      baseQuery = baseQuery.offset(query.offset);
    }

    const [clients, allRows] = await Promise.all([
      baseQuery.getRawMany(),
      countQuery.getRawMany(),
    ]);

    return {
      clients,
      total: allRows.length,
      limit: query.limit || clients.length,
      offset: query.offset || 0,
    };
  }

  async getClientDetails(
    clientId: string,
    userId: string,
    userRole: string,
  ): Promise<any> {
    // Get client appointments and details
    let baseQuery = this.appointmentsRepository.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.clinic', 'clinic')
      .leftJoinAndSelect('appointment.service', 'service')
      .leftJoinAndSelect('service.treatment', 'treatment')
      .leftJoinAndSelect('appointment.provider', 'provider')
      .leftJoinAndSelect('appointment.executedBy', 'executedBy')
      .leftJoinAndSelect('appointment.client', 'client')
      .where('appointment.clientId = :clientId', { clientId });

    if (userRole === 'admin' || userRole === 'SUPER_ADMIN') {
      // Admins and SuperAdmins have access to all clients
    } else if (userRole === 'clinic_owner' || userRole === 'secretariat' || userRole === 'doctor') {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ['ownedClinics'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const clinicIds: string[] = (user.ownedClinics || []).map(c => c.id);
      if (user.assignedClinicId && !clinicIds.includes(user.assignedClinicId)) {
        clinicIds.push(user.assignedClinicId);
      }

      try {
        const ownershipRepo = this.usersRepository.manager.getRepository('clinic_ownership');
        const ownerships = await ownershipRepo.find({ where: { ownerUserId: userId } });
        ownerships.forEach((o: any) => {
          if (o.clinicId && !clinicIds.includes(o.clinicId)) clinicIds.push(o.clinicId);
        });

        const agentAccessRepo = this.usersRepository.manager.getRepository('agent_clinic_access');
        const agentAccess = await agentAccessRepo.find({ where: { agentUserId: userId } });
        agentAccess.forEach((a: any) => {
          if (a.clinicId && !clinicIds.includes(a.clinicId)) clinicIds.push(a.clinicId);
        });
      } catch (e) {}

      if (clinicIds.length > 0) {
        baseQuery = baseQuery.andWhere(
          '(appointment.clinicId IN (:...clinicIds) OR appointment.providerId = :userId)',
          { clinicIds, userId },
        );
      } else {
        baseQuery = baseQuery.andWhere('appointment.providerId = :userId', { userId });
      }
    } else if (userRole === 'manager') {
      // Managers can view all client details
    } else {
      baseQuery = baseQuery.andWhere('appointment.providerId = :userId', { userId });
    }

    const appointments = await baseQuery.orderBy('appointment.startTime', 'DESC').getMany();

    let client = appointments[0]?.client;
    if (!client) {
      client = await this.usersRepository.findOne({ where: { id: clientId } });
    }

    if (!client) {
      throw new NotFoundException('Client not found or access denied');
    }

    return {
      client: {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        name: `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email,
        email: client.email,
        phone: client.phone,
      },
      appointments: appointments.map(apt => ({
        id: apt.id,
        serviceName: apt.service?.treatment?.name || 'Treatment',
        // The real practitioner of THIS appointment: its provider, else the clinic staff
        // member who performed it. Never a default/placeholder account.
        providerName: this.practitionerName(apt),
        startTime: apt.startTime,
        status: apt.status,
        totalAmount: apt.totalAmount,
        paymentMethod: apt.paymentMethod,
      })),
      summary: {
        totalVisits: appointments.length,
        totalSpent: appointments.reduce((sum, apt) => sum + (Number(apt.totalAmount) || 0), 0),
        lastVisit: appointments[0]?.startTime || null,
      },
    };
  }

  private practitionerName(apt: Appointment): string | null {
    const clinicRoles = [UserRole.DOCTOR, UserRole.CLINIC_OWNER].map(r => String(r).toLowerCase());
    const person = apt.provider
      || (apt.executedBy && clinicRoles.includes(String(apt.executedBy.role || '').toLowerCase()) ? apt.executedBy : null);
    if (!person) return null;
    const name = `${person.firstName || ''} ${person.lastName || ''}`.trim();
    return name || null;
  }

  async rescheduleAppointment(
    appointmentId: string,
    userId: string,
    userRole: string,
    newStartTime: Date,
    newEndTime: Date,
    reason?: string,
  ): Promise<Appointment> {
    const appointment = await this.findAppointmentForClinic(appointmentId, userId, userRole);
    if (this.isAppointmentCompleted(appointment)) {
      throw new BadRequestException('Completed appointments are locked and cannot be rescheduled.');
    }

    // Duration = sum of all treatments.
    const durationMinutes = await this.computeServicesDuration([appointment.serviceId, ...(appointment.additionalServiceIds || [])]);
    if (durationMinutes > 0) {
      newEndTime = new Date(newStartTime.getTime() + durationMinutes * 60000);
    }

    // Same checks as on create (opening hours, closing time, blocks, overlaps, past times).
    await this.assertSlotBookable({
      clinicId: appointment.clinicId,
      providerId: appointment.providerId,
      representativeId: appointment.representativeId,
      startTime: newStartTime,
      endTime: newEndTime,
      excludeAppointmentId: appointmentId,
      actorRole: userRole,
    });

    const oldStartTime = appointment.startTime;
    const oldEndTime = appointment.endTime;
    appointment.startTime = newStartTime;
    appointment.endTime = newEndTime;

    if (reason && reason.trim()) {
      appointment.rescheduleReason = reason.trim();
    }

    const updatedAppointment = await this.appointmentsRepository.save(appointment);
    const fullAppointment = await this.findById(updatedAppointment.id);

    this.eventEmitter.emit(APPOINTMENT_NOTIFY_EVENT, {
      kind: 'changed',
      appointmentId: fullAppointment.id,
      actorId: userId,
      previous: { startTime: oldStartTime },
    });

    // Emit event for notifications
    this.eventEmitter.emit('appointment.rescheduled', {
      appointment: fullAppointment,
      oldStartTime,
      oldEndTime,
      newStartTime: fullAppointment.startTime,
      newEndTime: fullAppointment.endTime,
      oldClinicId: fullAppointment.clinicId,
      newClinicId: fullAppointment.clinicId,
      reason,
      rescheduledById: userId,
    });

    return fullAppointment;
  }

  async findAppointmentsInRange(startDate: Date, endDate: Date, status?: AppointmentStatus): Promise<Appointment[]> {
    const where: any = {
      startTime: Between(startDate, endDate),
    };
    if (status) {
      where.status = status;
    }
    return this.appointmentsRepository.find({
      where,
      relations: ['client', 'clinic', 'service', 'service.treatment', 'provider'],
    });
  }

  /**
   * Global calendar view for Admin/Sales with clinic privacy logic.
   * - Admin / Sales: see all clinics, but clinic-only clients are masked as Blocked Time.
   * - Clinic staff (owner/secretariat/doctor): see full details for their clinics.
   */
  async getGlobalCalendarAppointments(
    userId: string,
    userRole: string,
    query: { startDate: string; endDate: string; clinicId?: string; providerId?: string },
  ): Promise<any[]> {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    const qb = this.appointmentsRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.clinic', 'clinic')
      .leftJoinAndSelect('appointment.service', 'service')
      .leftJoinAndSelect('service.treatment', 'treatment')
      .leftJoinAndSelect('appointment.provider', 'provider')
      .leftJoinAndSelect('appointment.client', 'client')
      .leftJoinAndSelect('client.customerRecords', 'customerRecords')
      .where('appointment.startTime BETWEEN :start AND :end', { start: startDate, end: endDate });

    if (query.clinicId) {
      qb.andWhere('appointment.clinicId = :clinicId', { clinicId: query.clinicId });
    }

    if (query.providerId) {
      qb.andWhere('appointment.providerId = :providerId', { providerId: query.providerId });
    }

    // For clinic roles, restrict to their clinics only
    if (userRole === UserRole.CLINIC_OWNER || userRole === UserRole.SECRETARIAT || userRole === UserRole.DOCTOR) {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ['ownedClinics'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const clinicIds = (user.ownedClinics || []).map(c => c.id);
      if ((user as any).assignedClinicId) {
        clinicIds.push((user as any).assignedClinicId);
      }

      if (clinicIds.length > 0) {
        qb.andWhere('appointment.clinicId IN (:...clinicIds)', { clinicIds });
      }
    }

    const appointments = await qb.orderBy('appointment.startTime', 'ASC').getMany();

    const blockedQb = this.blockedTimeSlotsRepository
      .createQueryBuilder('blocked')
      .leftJoinAndSelect('blocked.provider', 'provider')
      .leftJoinAndSelect('blocked.clinic', 'clinic')
      .where('blocked.startTime BETWEEN :start AND :end', { start: startDate, end: endDate });

    if (query.clinicId) {
      blockedQb.andWhere('blocked.clinicId = :clinicId', { clinicId: query.clinicId });
    }

    if (query.providerId) {
      blockedQb.andWhere('blocked.providerId = :providerId', { providerId: query.providerId });
    }

    if (userRole === UserRole.CLINIC_OWNER || userRole === UserRole.SECRETARIAT || userRole === UserRole.DOCTOR) {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ['ownedClinics'],
      });

      if (user) {
        const clinicIds = (user.ownedClinics || []).map(c => c.id);
        if ((user as any).assignedClinicId) {
          clinicIds.push((user as any).assignedClinicId);
        }

        if (clinicIds.length > 0) {
          blockedQb.andWhere('blocked.clinicId IN (:...clinicIds)', { clinicIds });
        }
      }
    }

    const blockedSlots = await blockedQb.orderBy('blocked.startTime', 'ASC').getMany();

    const mappedAppointments = appointments.map((apt) => {
      const serviceName = apt.service?.treatment?.name || 'Appointment';
      const providerName = apt.provider
        ? `${apt.provider.firstName} ${apt.provider.lastName}`
        : 'Professional';

      // BeautyDoctors client heuristic:
      // - appointmentSource from platform
      // - OR client has any customer record
      const isBeautyDoctorsClient =
        apt.appointmentSource === 'platform_broker' ||
        !!(apt.client as any)?.customerRecords?.length;

      // Admin / Super Admin / Salesperson privacy masking for clinic-only clients
      const isAdminLike =
        userRole === UserRole.ADMIN ||
        userRole === UserRole.SUPER_ADMIN ||
        userRole === UserRole.SALESPERSON;

      if (isAdminLike && !isBeautyDoctorsClient) {
        // Show as blocked time only
        return {
          id: apt.id,
          clinicId: apt.clinicId,
          clinicTimezone: apt.clinic?.timezone || null,
          providerId: apt.providerId,
          startTime: apt.startTime,
          endTime: apt.endTime,
          status: apt.status,
          isBlocked: true,
          isBeautyDoctorsClient: false,
          displayName: 'Blocked Time',
          serviceName: 'Blocked',
          providerName,
        };
      }

      // Full details (include serviceId for reschedule/actions)
      return {
        id: apt.id,
        clinicId: apt.clinicId,
        clinicTimezone: apt.clinic?.timezone || null,
        serviceId: apt.serviceId,
        providerId: apt.providerId,
        clientId: apt.clientId,
        startTime: apt.startTime,
        endTime: apt.endTime,
        status: apt.status,
        isBlocked: false,
        isBeautyDoctorsClient,
        serviceName,
        providerName,
        clientName: apt.client
          ? `${apt.client.firstName} ${apt.client.lastName}`
          : apt.clientDetails?.fullName || 'Client',
      };
    });

    const mappedBlockedSlots = blockedSlots.map((slot) => {
      const providerName = slot.provider
        ? `${slot.provider.firstName} ${slot.provider.lastName}`
        : 'Professional';

      return {
        id: slot.id,
        clinicId: slot.clinicId,
        providerId: slot.providerId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: 'blocked',
        isBlocked: true,
        isBeautyDoctorsClient: false,
        displayName: slot.reason || 'Blocked Time',
        serviceName: slot.reason || 'Blocked',
        providerName,
        clientName: '',
      };
    });

    return [...mappedAppointments, ...mappedBlockedSlots];
  }
}