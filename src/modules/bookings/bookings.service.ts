import { RecordPaymentDto } from '../clinics/dto/clinic.dto';
import { ConflictException, Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from '../bookings/entities/appointment.entity';
import {
  Repository,
  Between,
  MoreThan,
  In,
} from 'typeorm';
import { AppointmentHold } from './entities/appointment-hold.entity';
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
import { NotificationTrigger } from '../../common/enums/notification-trigger.enum';

import * as fs from 'fs';
import * as path from 'path';
import { VivaWalletService } from '../payments/viva-wallet.service';
import { FinancialService } from '../payments/financial.service';
import { PaymentMethod as RecordPaymentMethod, PaymentType } from '../payments/entities/payment-record.entity';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class BookingsService {
  private readonly logPath = path.join(process.cwd(), 'logs', 'appointment-debug.log');

  private logDebug(msg: string, data?: any) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg} ${data ? JSON.stringify(data) : ''}\n`;
    if (!fs.existsSync(path.dirname(this.logPath))) fs.mkdirSync(path.dirname(this.logPath), { recursive: true });
    fs.appendFileSync(this.logPath, line);
    console.log(msg, data);
  }
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(AppointmentHold)
    private holdsRepository: Repository<AppointmentHold>,
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

  async createAppointment(createAppointmentDto: CreateAppointmentDto & { appointmentSource?: 'clinic_own' | 'platform_broker', bookedById?: string }): Promise<any> {
    let clientId = createAppointmentDto.clientId;

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
      userExists = await this.usersRepository.findOne({
        where: [
          { email: email || 'never-match' },
          { phone: phone || 'never-match' }
        ]
      });
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
          const leads = await this.crmService.findAll({
            search: email || phone
          });
          if (leads && leads.length > 0) {
            // Find best match (exact email or phone)
            lead = leads.find(l => l.email === email || l.phone === phone);
          }
        }

        if (lead) {
          // Check if user with this email already exists (safety)
          const existingUser = await this.usersRepository.findOne({
            where: [{ email: lead.email }, { phone: lead.phone }]
          });

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
                email: lead.email || `temp-${lead.id}@example.com`,
                firstName: lead.firstName || 'Unknown',
                lastName: lead.lastName || 'Client',
                phone: lead.phone || undefined,
              }, salespersonId);

              clientId = savedUser.id;
              userExists = savedUser;
            } catch (createErr) {
              console.error('createCustomer failed during booking:', createErr);
              const retryUser = await this.usersRepository.findOne({
                where: [{ email: lead.email }, { phone: lead.phone }]
              });
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
              console.log('🔍 [BookingsService] Attempting to create new customer in CRM...');
              const { user: savedUser } = await this.crmService.createCustomer({
                email: createAppointmentDto.clientDetails.email || `guest-${Date.now()}@example.com`,
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
      const clinicDoctors = await this.usersRepository.find({
        where: { assignedClinicId: createAppointmentDto.clinicId, role: UserRole.DOCTOR }
      });
      if (clinicDoctors.length === 1) {
        providerId = clinicDoctors[0].id;
      }
    }

    // --- ENHANCED: Beauty Doctors Client Identification ---
    let isBeautyDoctorsClient = false;
    let representativeId = null;

    if (userExists) {
      // 1. Check if user is assigned to a salesperson
      const customerRecord = await this.customerRecordsRepository.findOne({ where: { customerId: userExists.id } });
      if (customerRecord?.assignedSalespersonId) {
        isBeautyDoctorsClient = true;
        representativeId = customerRecord.assignedSalespersonId;
      }
    } else {
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
      bookedById: createAppointmentDto.bookedById,
      isBeautyDoctorsClient,
      representativeId,
    };

    // Auto-set totalAmount based on all selected services if not already provided
    if (!appointmentData.totalAmount) {
      const allIds = [createAppointmentDto.serviceId, ...(createAppointmentDto.additionalServiceIds || [])];
      const services = await this.servicesRepository.find({ where: { id: In(allIds) } });
      const totalPrice = services.reduce((sum, s) => sum + Number(s.price), 0);
      appointmentData.totalAmount = totalPrice;
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
      .andWhere('apt.status = :status', { status: AppointmentStatus.CONFIRMED })
      .andWhere('apt.startTime < :newEnd', { newEnd })
      .andWhere('apt.endTime > :newStart', { newStart });

    // Only restrict to specific provider if one is assigned
    if (providerId) {
      conflictQuery = conflictQuery.andWhere('apt.providerId = :providerId', { providerId });
    }

    const conflictingAppointment = await conflictQuery.getOne();

    if (conflictingAppointment) {
      console.log('❌ [BookingsService] Conflict detected: Time slot already booked.');
      throw new ConflictException('Time slot is already booked');
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

    // Set status to pending_payment if card is chosen
    if (createAppointmentDto.paymentMethod === 'card') {
      appointmentData.status = AppointmentStatus.PENDING_PAYMENT;
    }

    const appointment: Appointment = this.appointmentsRepository.create(appointmentData);

    // Default status in entity is CONFIRMED, no need to manually set to PENDING

    console.log('📝 [BookingsService] Saving appointment to database...');
    const savedAppointment: Appointment = await this.appointmentsRepository.save(appointment);
    console.log('✅ [BookingsService] Appointment saved:', { id: savedAppointment.id });

    // Create a CRM Task for Salesperson to confirm the appointment (Call Center Workflow)
    if (savedAppointment.status === AppointmentStatus.PENDING) {
      try {
        let taskOwnerId = representativeId || createAppointmentDto.bookedById;
        
        // If no owner found, fallback to an Admin account to handle unassigned leads
        if (!taskOwnerId) {
          const defaultAdmin = await this.usersRepository.findOne({ where: { role: 'admin' as any } });
          taskOwnerId = defaultAdmin?.id;
        }

        if (taskOwnerId) {
          await this.crmService.createAction({
            customerId: clientId,
            salespersonId: taskOwnerId,
            actionType: 'call',
            title: 'Confirmation Call Reminder',
            description: `New consumer booking #${savedAppointment.id.slice(-6).toUpperCase()}. Please call to confirm details and finalize.`,
            status: 'pending',
            priority: 'high',
            dueDate: new Date(Date.now() + 30 * 60 * 1000), // 30 mins from now
            reminderDate: new Date(Date.now() + 5 * 60 * 1000), // 5 mins reminder
            metadata: {
              appointmentId: savedAppointment.id,
              autoGenerated: true,
              workflow: 'call_center_confirmation'
            }
          });
          console.log(`[CRM] Auto-task created for appointment confirmation: ${savedAppointment.id}`);
        } else {
          console.warn(`[CRM] Skipped auto-task creation for appointment ${savedAppointment.id}: No Admin or Salesperson found to assign task to.`);
        }
      } catch (crmErr) {
        console.error('Failed to create internal CRM task for booking confirmation:', crmErr?.message || crmErr);
      }
    }

    // Load full relations before emitting event for notifications
    const appointmentWithRelations = await this.findById(savedAppointment.id);

    // Trigger Notification for Booked
    if (appointmentWithRelations.clientId) {
      await this.notificationsService.sendTriggeredNotification(NotificationTrigger.APPOINTMENT_BOOKED, appointmentWithRelations.clientId, {
        customerName: `${appointmentWithRelations.client?.firstName || 'Customer'}`,
        serviceName: appointmentWithRelations.service?.treatment?.name || 'Treatment',
        appointmentDate: appointmentWithRelations.startTime.toLocaleDateString(),
        appointmentTime: appointmentWithRelations.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        clinicName: appointmentWithRelations.clinic?.name,
      });
    }

    // If card payment, generate Viva Wallet redirect URL
    if (createAppointmentDto.paymentMethod === 'card') {
      const clientName = appointmentWithRelations.client
        ? `${appointmentWithRelations.client.firstName} ${appointmentWithRelations.client.lastName}`
        : (createAppointmentDto.clientDetails?.fullName || 'Guest');

      const amount = Number(savedAppointment.totalAmount || 0);
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


    // --- AUTOMATION: Create Confirmation Call Reminder Task ---
    try {
      // Find the salesperson related to this lead/customer or the creator
      const salespersonId = (appointmentWithRelations as any).salespersonId || createAppointmentDto.bookedById;

      if (salespersonId && appointmentWithRelations.clientId) {
        const dueDate = new Date(appointmentWithRelations.startTime);
        dueDate.setDate(dueDate.getDate() - 1); // 1 day before
        // Ensure reminder is not in the past
        if (dueDate < new Date()) {
          dueDate.setTime(new Date().getTime() + 1000 * 60 * 60); // 1 hour from now
        }

        const therapyName = appointmentWithRelations.service?.treatment?.name || 'Treatment';

        await this.crmService.createAction({
          customerId: (appointmentWithRelations as any).customerRecordId || appointmentWithRelations.clientId,
          salespersonId,
          actionType: 'confirmation_call_reminder',
          title: `Confirmation Call: ${appointmentWithRelations.client?.firstName || 'Client'} - ${therapyName}`,
          description: `Confirm attendance for appointment at ${appointmentWithRelations.startTime.toLocaleString()}`,
          status: 'pending',
          priority: 'high',
          dueDate: dueDate,
          reminderDate: dueDate,
          relatedAppointmentId: savedAppointment.id,
        } as any);
      }
    } catch (err) {
      console.error('Task automation failed during appointment creation', err);
    }

    // Emit event for notifications with full relations
    this.eventEmitter.emit('appointment.created', appointmentWithRelations);

    return appointmentWithRelations;
  }

  async findById(id: string): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['clinic', 'service', 'service.treatment', 'provider', 'client', 'bookedBy'],
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
    const amount = Number(appointment.service?.price || 0);

    return this.vivaWalletService.createPaymentOrder({
      amount,
      customerEmail,
      customerPhone,
      customerName: clientName,
      merchantTrns: appointment.id,
    });
  }

  async updateStatus(id: string, status: AppointmentStatus, data?: any, userId?: string): Promise<Appointment> {
    const appointment = await this.findById(id);
    const oldStatus = appointment.status;

    const updateData: any = { status };

    if (status === AppointmentStatus.COMPLETED) {
      updateData.completedAt = new Date();
      if (data?.treatmentDetails) {
        updateData.treatmentDetails = data.treatmentDetails;
      }
      if (data?.totalAmount !== undefined) {
        updateData.totalAmount = data.totalAmount;
      } else if (!appointment.totalAmount && appointment.service?.price) {
        updateData.totalAmount = appointment.service.price;
      }

      if (data?.amountPaid !== undefined) {
        updateData.amountPaid = data.amountPaid;
      } else if (updateData.totalAmount) {
        // Fallback to assume full amount was paid if amountPaid not explicitly provided but completion is triggered
        updateData.amountPaid = updateData.totalAmount;
      }

      if (data?.paymentMethod) {
        updateData.paymentMethod = data.paymentMethod;
      }
    } else if (status === AppointmentStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
      updateData.cancelledById = userId;

      // Ensure ledger is updated with refund for cancellation
      if (Number(appointment?.amountPaid || 0) > 0) {
        try {
          await this.financialService.recordPayment({
            appointmentId: appointment.id,
            clinicId: appointment.clinicId,
            clientId: appointment.clientId,
            providerId: appointment.providerId,
            amount: Number(appointment.amountPaid),
            method: (appointment.paymentMethod as any) || RecordPaymentMethod.VIVA_WALLET,
            type: PaymentType.REFUND,
            notes: `Auto-refund record: Cancelled`,
            recordedById: userId,
          });
        } catch (e) {
          console.error('[Financial] Refund logging failed', e.message);
        }
      }

      // Financial impact: Revenue becomes 0 for canceled appointments
      updateData.amountPaid = 0;
      updateData.totalAmount = 0;
    } else if (status === AppointmentStatus.NO_SHOW) {
      updateData.noShowMarkedAt = new Date();
      updateData.noShowMarkedById = userId;
      // Financial impact: Revenue becomes 0 for no-shows (unless we implement no-show fee later)
      updateData.amountPaid = 0;
      updateData.totalAmount = 0;
    }

    await this.appointmentsRepository.update(id, updateData);

    const updatedAppointment = await this.findById(id);

    // Trigger Notification if status actually changed
    if (status !== oldStatus) {
      let trigger: NotificationTrigger;
      if (status === AppointmentStatus.CONFIRMED) trigger = NotificationTrigger.APPOINTMENT_CONFIRMED;
      else if (status === AppointmentStatus.CANCELLED) trigger = NotificationTrigger.APPOINTMENT_CANCELED;
      else if (status === AppointmentStatus.COMPLETED) trigger = NotificationTrigger.EXECUTION_NOTIFICATION;

      if (trigger && updatedAppointment.clientId) {
        await this.notificationsService.sendTriggeredNotification(trigger, updatedAppointment.clientId, {
          customerName: `${updatedAppointment.client?.firstName || 'Customer'}`,
          serviceName: updatedAppointment.service?.treatment?.name || 'Treatment',
          appointmentDate: updatedAppointment.startTime.toLocaleDateString(),
          appointmentTime: updatedAppointment.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          clinicName: updatedAppointment.clinic?.name,
        });
      }

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

  async reschedule(id: string, newStartTime: Date, newEndTime: Date): Promise<Appointment> {
    await this.appointmentsRepository.update(id, {
      startTime: newStartTime,
      endTime: newEndTime,
    });

    const appointment = await this.findById(id);

    // Trigger Notification
    if (appointment.clientId) {
      await this.notificationsService.sendTriggeredNotification(NotificationTrigger.APPOINTMENT_RESCHEDULED, appointment.clientId, {
        customerName: `${appointment.client?.firstName || 'Customer'}`,
        serviceName: appointment.service?.treatment?.name || 'Treatment',
        appointmentDate: appointment.startTime.toLocaleDateString(),
        appointmentTime: appointment.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        clinicName: appointment.clinic?.name,
      });
    }

    this.eventEmitter.emit('appointment.rescheduled', appointment);

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

    // Add display name to each appointment
    return appointments.map(apt => ({
      ...apt,
      displayName: this.formatAppointmentDisplayName(apt),
      serviceName: apt.service?.treatment?.name,
      providerName: apt.provider ? `${apt.provider.firstName} ${apt.provider.lastName}` : null,
    })) as Appointment[];
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
    query: { status?: string; date?: string; providerId?: string; appointmentSource?: 'clinic_own' | 'platform_broker'; clinicId?: string },
  ): Promise<any[]> {
    try {
      console.log(`[BookingsService] findClinicAppointments called by user: ${userId}, role: ${userRole}`);
      const queryBuilder = this.appointmentsRepository.createQueryBuilder('appointment')
        .leftJoinAndSelect('appointment.clinic', 'clinic')
        .leftJoinAndSelect('appointment.service', 'service')
        .leftJoinAndSelect('service.treatment', 'treatment')
        .leftJoinAndSelect('appointment.provider', 'provider')
        .leftJoinAndSelect('appointment.client', 'client')
        .leftJoinAndSelect('appointment.bookedBy', 'bookedBy');

      // 1. Role-based visibility
      if (userRole === 'admin' || userRole === 'SUPER_ADMIN' || userRole === 'manager') {
        queryBuilder.where('1=1');
      } else if (userRole === 'clinic_owner' || userRole === 'secretariat' || userRole === 'doctor') {
        const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ['ownedClinics'] });
        if (!user) throw new NotFoundException('User not found');
        const clinicIds = (user.ownedClinics || []).map(c => c.id);
        if (user.assignedClinicId) clinicIds.push(user.assignedClinicId);
        if (clinicIds.length > 0) {
          queryBuilder.where('appointment.clinicId IN (:...clinicIds)', { clinicIds });
        } else {
          queryBuilder.where('(appointment.providerId = :userId OR appointment.bookedById = :userId)', { userId });
        }
      } else if (userRole === 'salesperson') {
        // Sales team view (Team visibility, but masked if not owner)
        if (query.clinicId || query.providerId) {
          // Join leads/records to determine ownership in the mapping phase
          queryBuilder.leftJoin('leads', 'l', 'l.phone = client.phone OR (client.email IS NOT NULL AND l.email = client.email)')
            .leftJoin('customer_records', 'cr', 'cr.customerId = client.id');
        } else {
          // Default: strictly owned
          queryBuilder.leftJoin('leads', 'l', 'l.phone = client.phone OR (client.email IS NOT NULL AND l.email = client.email)')
            .leftJoin('customer_records', 'cr', 'cr.customerId = client.id')
            .where('(appointment.bookedById = :userId OR appointment.providerId = :userId OR l.assignedSalesId = :userId OR cr.assignedSalespersonId = :userId)', { userId });
        }
        queryBuilder.leftJoinAndSelect('client.customerRecords', 'clientCustomerRecords');
      } else {
        queryBuilder.where('(appointment.providerId = :userId OR appointment.clientId = :userId OR appointment.bookedById = :userId)', { userId });
      }

      // 2. Filters
      queryBuilder.andWhere('appointment.status != :deleted', { deleted: AppointmentStatus.DELETED });

      if (query.status) {
        queryBuilder.andWhere('appointment.status = :status', { status: query.status.toUpperCase() });
      }
      if (query.date) {
        const date = new Date(query.date);
        const start = new Date(date).setHours(0, 0, 0, 0);
        const end = new Date(date).setHours(23, 59, 59, 999);
        queryBuilder.andWhere('appointment.startTime BETWEEN :start AND :end', { start: new Date(start), end: new Date(end) });
      }
      if (query.clinicId) queryBuilder.andWhere('appointment.clinicId = :clinicId', { clinicId: query.clinicId });
      if (query.providerId) queryBuilder.andWhere('appointment.providerId = :providerId', { providerId: query.providerId });
      if (query.appointmentSource) queryBuilder.andWhere('appointment.appointmentSource = :source', { source: query.appointmentSource });

      const appointments = await queryBuilder.orderBy('appointment.startTime', 'ASC').getMany();

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

      // 4. Transform & Mask
      return appointments.map(apt => {
        let isMasked = false;

        // PRIVACY RULE: Salespeople only see details of Beauty Doctors clients OR appointments they booked
        if (userRole === 'salesperson') {
          const isBookedByMe = apt.bookedById === userId;
          const isManagedByMe = apt.representativeId === userId;
          const isOwnedByMe = (apt.client as any)?.customerRecords?.some((r: any) => r.assignedSalespersonId === userId);

          if (!isBookedByMe && !isManagedByMe && !isOwnedByMe) {
            isMasked = true;
          }
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

        return {
          ...apt,
          displayName: this.formatAppointmentDisplayName(apt),
          serviceName: apt.service?.treatment?.name,
          providerName: apt.provider ? `${apt.provider.firstName} ${apt.provider.lastName}` : null,
          bookedByInfo: apt.bookedBy ? { id: apt.bookedBy.id, name: `${apt.bookedBy.firstName} ${apt.bookedBy.lastName}`, role: apt.bookedBy.role } : null,
          isReturned: repeatClients.has(apt.clientId),
          isBeautyDoctorsClient: apt.isBeautyDoctorsClient || false, // Return flag for color-coding
        };
      });
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
    status: AppointmentStatus,
    userId: string,
    userRole: string,
    updateData?: any,
  ): Promise<Appointment> {
    const appointment = await this.findAppointmentForClinic(appointmentId, userId, userRole);
    const oldStatus = appointment.status;

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
      if (updateData?.amountPaid !== undefined) appointment.amountPaid = Number(updateData.amountPaid);
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
    } else if (status === AppointmentStatus.NO_SHOW) {
      appointment.noShowMarkedAt = new Date();
      appointment.noShowMarkedById = userId;
      appointment.amountPaid = 0;
      appointment.totalAmount = 0;
    }

    if (updateData?.notes) appointment.notes = updateData.notes;
    if (updateData?.treatmentDetails) appointment.treatmentDetails = updateData.treatmentDetails;

    appointment.status = status;
    const saved = await this.appointmentsRepository.save(appointment);
    const updated = await this.findById(saved.id);

    // 3. TASK INTERACTION: Auto-complete / Cancel / Follow-up linked tasks
    try {
      const linkedTasks = await this.crmService['crmActionsRepository']?.find?.({
        where: { relatedAppointmentId: appointmentId },
      });
      if (linkedTasks?.length) {
        for (const task of linkedTasks) {
          if ((status === AppointmentStatus.COMPLETED || status === AppointmentStatus.EXECUTED) && task.status === 'pending') {
            await this.crmService['crmActionsRepository'].update(task.id, { status: 'completed', completedAt: new Date() });
          } else if (status === AppointmentStatus.CANCELLED && task.status === 'pending') {
            await this.crmService['crmActionsRepository'].update(task.id, { status: 'cancelled' });
          }
        }
      }

      // Create Follow-up Satisfaction Call
      const outcomeStatuses = [AppointmentStatus.COMPLETED, AppointmentStatus.EXECUTED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW];
      if (outcomeStatuses.includes(status)) {
        const salespersonId = updated.representativeId || (updated as any).salespersonId || updated.bookedById;
        if (salespersonId && updated.clientId) {
          const nextDay = new Date();
          nextDay.setDate(nextDay.getDate() + 1);
          nextDay.setHours(9, 0, 0, 0);

          let taskTitle = `Outcome Follow-up: ${updated.client?.firstName || 'Client'}`;
          let taskDesc = `Follow up on appointment outcome: ${status}`;

          if (status === AppointmentStatus.EXECUTED || status === AppointmentStatus.COMPLETED) {
            taskTitle = `Satisfaction Check: ${updated.client?.firstName || 'Client'}`;
            taskDesc = `Treatment performed at ${updated.clinic?.name}. Verify satisfaction and confirm successful execution.`;
          }

          await this.crmService.createAction({
            customerId: updated.clientId,
            salespersonId,
            actionType: 'call',
            title: taskTitle,
            description: taskDesc,
            status: 'pending',
            priority: 'medium',
            dueDate: nextDay,
            reminderDate: nextDay,
            relatedAppointmentId: updated.id,
          } as any);
        }
      }
    } catch (taskErr) {
      console.error('[BookingsService] Task automation update failed:', taskErr.message);
    }

    // 4. NOTIFICATION TRIGGERS
    let trigger: NotificationTrigger;
    if (status === AppointmentStatus.CONFIRMED) trigger = NotificationTrigger.APPOINTMENT_CONFIRMED;
    else if (status === AppointmentStatus.CANCELLED) trigger = NotificationTrigger.APPOINTMENT_CANCELED;
    else if (status === AppointmentStatus.EXECUTED || status === AppointmentStatus.COMPLETED) trigger = NotificationTrigger.EXECUTION_NOTIFICATION;

    if (trigger && updated.clientId) {
      await this.notificationsService.sendTriggeredNotification(trigger, updated.clientId, {
        customerName: `${updated.client?.firstName || 'Customer'}`,
        serviceName: updated.service?.treatment?.name || 'Treatment',
        appointmentDate: updated.startTime.toLocaleDateString(),
        appointmentTime: updated.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        clinicName: updated.clinic?.name,
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
  ): Promise<Appointment> {
    const appointment = await this.findAppointmentForClinic(appointmentId, userId, userRole);
    const oldStatus = appointment.status;
    const oldTotal = Number(appointment.totalAmount ?? 0);
    const oldAdvance = Number(appointment.advancePaymentAmount ?? 0);

    appointment.status = AppointmentStatus.COMPLETED;
    appointment.completedAt = new Date();

    if (serviceId) {
      appointment.serviceId = serviceId;
    }

    if (treatmentDetails) {
      appointment.treatmentDetails = treatmentDetails;
    }

    if (paymentData) {
      appointment.paymentMethod = paymentData.paymentMethod;
      if (paymentData.isAdvancePayment) {
        appointment.advancePaymentAmount = paymentData.amount;
      } else {
        appointment.totalAmount = paymentData.amount;
      }
      appointment.notes = paymentData.notes || appointment.notes;

      // RULE 3: Update existing revenue record if it exists to avoid double-counting
      try {
        const type = paymentData.isAdvancePayment ? PaymentType.DEPOSIT : PaymentType.PAYMENT;
        const existing = await this.financialService['paymentRecordsRepository'].findOne({
          where: { appointmentId: appointment.id, type },
        });

        if (existing) {
          await this.financialService['paymentRecordsRepository'].update(existing.id, {
            amount: paymentData.amount,
            method: paymentData.paymentMethod as any,
            notes: (paymentData.notes || '') + ' (Recalculated)',
            recordedById: userId,
          });

          // Manually recalculate amountPaid on appointment via logic similar to recordPayment
          const records = await this.financialService['paymentRecordsRepository'].find({ where: { appointmentId: appointment.id } });
          const totalPaid = records.reduce((acc, r) => acc + (r.type === PaymentType.REFUND || r.type === PaymentType.VOID ? -Number(r.amount) : Number(r.amount)), 0);
          appointment.amountPaid = totalPaid;
        } else {
          // Record new PaymentRecord
          await this.financialService.recordPayment({
            appointmentId: appointment.id,
            clinicId: appointment.clinicId,
            clientId: appointment.clientId,
            providerId: appointment.providerId,
            amount: paymentData.amount,
            method: paymentData.paymentMethod as any,
            type,
            notes: paymentData.notes,
            recordedById: userId,
          });
        }
      } catch (fErr) {
        console.error('[BookingsService] Revenue update failed:', fErr.message);
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
      appointment.clinicNotes = completionReport.notes || appointment.clinicNotes;

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

      // Update payment if provided in report
      if (completionReport.amountPaid) {
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

    // Audit log: appointment completed + payment amount
    this.eventEmitter.emit('audit.log', {
      userId,
      action: 'APPOINTMENT_COMPLETE_WITH_PAYMENT',
      resource: 'appointments',
      resourceId: appointmentId,
      changes: {
        before: { status: oldStatus, totalAmount: oldTotal, advancePaymentAmount: oldAdvance },
        after: { status: AppointmentStatus.COMPLETED, totalAmount: newTotal, advancePaymentAmount: newAdvance },
      },
      data: { 
        appointmentId, 
        clientId: appointment.clientId, 
        clinicId: appointment.clinicId, 
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

    return savedAppointment;
  }

  // RULE 7: Soft-delete an appointment (sets status = DELETED, voids revenue)
  async softDeleteAppointment(appointmentId: string, userId: string, userRole: string): Promise<Appointment> {
    const appointment = await this.findAppointmentForClinic(appointmentId, userId, userRole);

    if (appointment.status === AppointmentStatus.DELETED) {
      throw new BadRequestException('Appointment is already deleted');
    }

    // Void revenue if payment was recorded
    try {
      await this.financialService['paymentRecordRepository']?.update?.(
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

    return this.findById(appointmentId);
  }

  async recordPayment(
    appointmentId: string,
    userId: string,
    paymentData: RecordPaymentDto,
  ): Promise<Appointment> {
    const appointment = await this.findAppointmentForClinic(appointmentId, userId, 'admin');
    const beforeAdvance = Number(appointment.advancePaymentAmount ?? 0);
    const beforeTotal = Number(appointment.totalAmount ?? 0);

    if (paymentData.isAdvancePayment) {
      appointment.advancePaymentAmount = paymentData.amount;
    } else {
      appointment.totalAmount = paymentData.amount;
    }

    appointment.paymentMethod = paymentData.paymentMethod;
    appointment.notes = paymentData.notes || appointment.notes;

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
    // Build query based on user role
    let baseQuery = this.appointmentsRepository.createQueryBuilder('appointment')
      .select([
        'COUNT(appointment.id) as totalAppointments',
        'AVG(appointment.totalAmount) as avgAmount',
        'SUM(appointment.totalAmount) as totalRevenue',
        'appointment.status',
      ])
      .groupBy('appointment.status');
    // Filter analytics based on user role and clinical association
    if (userRole === 'admin' || userRole === 'SUPER_ADMIN') {
      // Admins and SUPER_ADMINs see all. No restrictions.
      baseQuery.where('1=1');
    } else if (userRole === 'clinic_owner' || userRole === 'secretariat') {
      // Get the user to check their clinic associations
      const user = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ['ownedClinics'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const clinicIds = (user.ownedClinics || []).map(c => c.id);
      if (user.assignedClinicId) {
        clinicIds.push(user.assignedClinicId);
      }

      if (clinicIds.length > 0) {
        baseQuery = baseQuery.andWhere('appointment.clinicId IN (:...clinicIds)', { clinicIds });
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

    if (query.startDate && query.endDate) {
      baseQuery = baseQuery.andWhere('appointment.startTime BETWEEN :startDate AND :endDate', {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      });
    }

    if (query.serviceId) {
      baseQuery = baseQuery.andWhere('appointment.serviceId = :serviceId', { serviceId: query.serviceId });
    }

    const analytics = await baseQuery.getRawMany();

    return {
      period: { startDate: query.startDate, endDate: query.endDate },
      analytics,
    };
  }

  async getClinicRevenueAnalytics(
    userId: string,
    userRole: string,
    query: { startDate?: string; endDate?: string; serviceId?: string; clinicId?: string },
  ): Promise<any> {
    // Similar to appointment analytics but focused on revenue
    let baseQuery = this.appointmentsRepository.createQueryBuilder('appointment')
      .select([
        'SUM(appointment.totalAmount) as totalRevenue',
        'SUM(appointment.advancePaymentAmount) as advancePayments',
        'appointment.paymentMethod',
        'COUNT(CASE WHEN appointment.paymentMethod = \'cash\' THEN 1 END) as cashPayments',
        'COUNT(CASE WHEN appointment.paymentMethod = \'card\' THEN 1 END) as cardPayments',
      ])
      .groupBy('appointment.paymentMethod');
    // Filter revenue based on user role and clinical association
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
      if (user.assignedClinicId) {
        clinicIds.push(user.assignedClinicId);
      }

      if (clinicIds.length > 0) {
        baseQuery = baseQuery.andWhere('appointment.clinicId IN (:...clinicIds)', { clinicIds });
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

    if (query.startDate && query.endDate) {
      baseQuery = baseQuery.andWhere('appointment.startTime BETWEEN :startDate AND :endDate', {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      });
    }

    const revenueData = await baseQuery.getRawMany();

    return {
      period: { startDate: query.startDate, endDate: query.endDate },
      revenueData,
    };
  }

  async getRepeatClientForecast(
    userId: string,
    userRole: string,
    query: { startDate?: string; endDate?: string; clinicId?: string },
  ): Promise<any> {
    // Analyze client return patterns
    let baseQuery = this.appointmentsRepository.createQueryBuilder('appointment')
      .select([
        'appointment.clientId',
        'COUNT(appointment.id) as visitCount',
        'MIN(appointment.startTime) as firstVisit',
        'MAX(appointment.startTime) as lastVisit',
      ])
      .groupBy('appointment.clientId')
      .having('COUNT(appointment.id) > 1');

    // SECRETARIAT and CLINIC_OWNER have same permissions
    if (userRole === 'clinic_owner' || userRole === 'secretariat') {
      baseQuery = baseQuery.leftJoin('appointment.clinic', 'clinic')
        .where('clinic.ownerId = :userId', { userId });
    } else if (userRole === 'manager' && query.clinicId) {
      baseQuery = baseQuery.andWhere('appointment.clinicId = :clinicId', { clinicId: query.clinicId });
    } else {
      baseQuery = baseQuery.where('appointment.providerId = :userId', { userId });
    }

    if (query.startDate && query.endDate) {
      baseQuery = baseQuery.andWhere('appointment.startTime BETWEEN :startDate AND :endDate', {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      });
    }

    const repeatClients = await baseQuery.getRawMany();

    return {
      period: { startDate: query.startDate, endDate: query.endDate },
      repeatClients,
      forecast: {
        // Simple forecast logic - clients who visited 3+ times are likely to return
        likelyToReturn: repeatClients.filter(client => client.visitCount >= 3).length,
        totalRepeatClients: repeatClients.length,
      },
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
      if (user.assignedClinicId) {
        clinicIds.push(user.assignedClinicId);
      }

      if (clinicIds.length > 0) {
        baseQuery = baseQuery.leftJoin('appointment.clinic', 'clinic')
          .where('appointment.clinicId IN (:...clinicIds)', { clinicIds });
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

    if (query.limit) {
      baseQuery = baseQuery.limit(query.limit);
    }

    if (query.offset) {
      baseQuery = baseQuery.offset(query.offset);
    }

    const clients = await baseQuery.getRawMany();

    return {
      clients,
      total: clients.length,
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
      .leftJoinAndSelect('appointment.provider', 'provider')
      .leftJoinAndSelect('appointment.client', 'client')
      .where('appointment.clientId = :clientId', { clientId });

    // SECRETARIAT and CLINIC_OWNER have same permissions
    if (userRole === 'clinic_owner' || userRole === 'secretariat') {
      baseQuery = baseQuery.andWhere('clinic.ownerId = :userId', { userId });
    } else if (userRole === 'manager') {
      // Managers can view client details
      // We should ideally check if client has appointments in a clinic the manager has access to
      // For now, we allow managers to view all client details (similar to salesperson/provider check above)
      // although provider check is restrictive.
    } else {
      baseQuery = baseQuery.andWhere('appointment.providerId = :userId', { userId });
    }

    const appointments = await baseQuery.orderBy('appointment.startTime', 'DESC').getMany();

    if (appointments.length === 0) {
      throw new NotFoundException('Client not found or access denied');
    }

    const client = appointments[0].client;

    return {
      client: {
        id: client.id,
        name: `${client.firstName} ${client.lastName}`,
        email: client.email,
        phone: client.phone,
      },
      appointments: appointments.map(apt => ({
        id: apt.id,
        serviceName: apt.service?.treatment?.name,
        providerName: apt.provider ? `${apt.provider.firstName} ${apt.provider.lastName}` : null,
        startTime: apt.startTime,
        status: apt.status,
        totalAmount: apt.totalAmount,
        paymentMethod: apt.paymentMethod,
      })),
      summary: {
        totalVisits: appointments.length,
        totalSpent: appointments.reduce((sum, apt) => sum + (apt.totalAmount || 0), 0),
        lastVisit: appointments[0].startTime,
      },
    };
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

    // Check for conflicts with the new time
    const conflictingAppointment = await this.appointmentsRepository.findOne({
      where: {
        providerId: appointment.providerId,
        startTime: Between(newStartTime, newEndTime),
        status: AppointmentStatus.CONFIRMED,
      },
    });

    if (conflictingAppointment && conflictingAppointment.id !== appointmentId) {
      throw new ConflictException('Time slot is already booked');
    }

    const oldStartTime = appointment.startTime;
    appointment.startTime = newStartTime;
    appointment.endTime = newEndTime;

    if (reason) {
      appointment.notes = `${appointment.notes || ''}\nRescheduled: ${reason}`;
    }

    const updatedAppointment = await this.appointmentsRepository.save(appointment);

    // Emit event for notifications
    this.eventEmitter.emit('appointment.rescheduled', {
      appointment: updatedAppointment,
      oldStartTime,
      newStartTime,
      reason,
    });

    return updatedAppointment;
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

    return appointments.map((apt) => {
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
  }
}