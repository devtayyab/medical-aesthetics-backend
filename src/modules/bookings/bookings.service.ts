import { RecordPaymentDto } from '../clinics/dto/clinic.dto';
import { ConflictException, Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from '../bookings/entities/appointment.entity';
import { Between, Repository, MoreThan } from 'typeorm';
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

import * as fs from 'fs';
import * as path from 'path';
import { VivaWalletService } from '../payments/viva-wallet.service';

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
    @Inject(forwardRef(() => CrmService))
    private crmService: CrmService,
    private eventEmitter: EventEmitter2,
    private vivaWalletService: VivaWalletService,
  ) { }

  async holdSlot(holdSlotDto: HoldSlotDto): Promise<AppointmentHold> {
    const { clinicId, serviceId, providerId, startTime, endTime } = holdSlotDto;

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
      providerId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    });

    return this.holdsRepository.save(hold);
  }

  async createAppointment(createAppointmentDto: CreateAppointmentDto & { appointmentSource?: 'clinic_own' | 'platform_broker', bookedById?: string }): Promise<any> {
    let clientId = createAppointmentDto.clientId;

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

              const { user: savedUser } = await this.crmService.createCustomer({
                email: createAppointmentDto.clientDetails.email || `guest-${Date.now()}@example.com`,
                firstName,
                lastName,
                phone: createAppointmentDto.clientDetails.phone || undefined,
              });
              clientId = savedUser.id;
              userExists = savedUser;
            } catch (createErr) {
              console.error('Failed to create guest customer during booking:', createErr);
              const retryWhere: any[] = [];
              if (createAppointmentDto.clientDetails.email) retryWhere.push({ email: createAppointmentDto.clientDetails.email });
              if (createAppointmentDto.clientDetails.phone) retryWhere.push({ phone: createAppointmentDto.clientDetails.phone });

              const retryUser = await this.usersRepository.findOne({ where: retryWhere });
              if (retryUser) {
                clientId = retryUser.id;
                userExists = retryUser;
              } else {
                throw new BadRequestException(`Failed to create guest record: ${createErr.message}`);
              }
            }
          } else {
            throw new NotFoundException(`Client not found as User or Lead: ${clientId}`);
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

    const appointmentData: Partial<Appointment> = {
      ...createAppointmentDto,
      clientId, // Use potentially updated clientId
      providerId: providerId ?? null,
      startTime: new Date(createAppointmentDto.startTime),
      endTime: new Date(createAppointmentDto.endTime),
      appointmentSource: createAppointmentDto.appointmentSource || 'platform_broker',
      clientDetails: createAppointmentDto.clientDetails,
      bookedById: createAppointmentDto.bookedById,
    };

    // Auto-set totalAmount based on service price if not already provided
    if (!appointmentData.totalAmount) {
      const service = await this.servicesRepository.findOne({ where: { id: createAppointmentDto.serviceId } });
      if (service) {
        appointmentData.totalAmount = service.price;
      }
    }

    // Check for conflicts with existing appointments
    const conflictingAppointment = await this.appointmentsRepository.findOne({
      where: {
        clinicId: createAppointmentDto.clinicId,
        providerId: createAppointmentDto.providerId || undefined,
        startTime: Between(new Date(createAppointmentDto.startTime), new Date(createAppointmentDto.endTime)),
        status: AppointmentStatus.CONFIRMED,
      },
    });

    if (conflictingAppointment) {
      throw new ConflictException('Time slot is already booked');
    }

    // If holdId provided, validate and remove hold
    if (createAppointmentDto.holdId) {
      const hold = await this.holdsRepository.findOne({
        where: { id: createAppointmentDto.holdId },
      });

      if (!hold || hold.expiresAt < new Date()) {
        throw new ConflictException('Hold has expired');
      }

      await this.holdsRepository.delete(hold.id);
    }

    // Set status to pending_payment if card is chosen
    if (createAppointmentDto.paymentMethod === 'card') {
      appointmentData.status = AppointmentStatus.PENDING_PAYMENT;
    }

    const appointment: Appointment = this.appointmentsRepository.create(appointmentData);
    const savedAppointment: Appointment = await this.appointmentsRepository.save(appointment);

    // Load full relations before emitting event for notifications
    const appointmentWithRelations = await this.findById(savedAppointment.id);

    // If card payment, generate Viva Wallet redirect URL
    if (createAppointmentDto.paymentMethod === 'card') {
      const clientName = appointmentWithRelations.client
        ? `${appointmentWithRelations.client.firstName} ${appointmentWithRelations.client.lastName}`
        : (createAppointmentDto.clientDetails?.fullName || 'Guest');

      const amount = Number(appointmentWithRelations.service?.price || 0);
      const customerEmail = appointmentWithRelations.client?.email || createAppointmentDto.clientDetails?.email || '';
      const customerPhone = appointmentWithRelations.client?.phone || createAppointmentDto.clientDetails?.phone || '';

      // DEMO MODE: If Viva credentials not configured yet, use a test redirect
      const vivaClientId = process.env.VIVA_CLIENT_ID;
      if (!vivaClientId || vivaClientId === 'your-viva-client-id') {
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

  async updateStatus(id: string, status: AppointmentStatus, data?: any): Promise<Appointment> {
    const appointment = await this.findById(id);

    const updateData: any = { status };

    if (status === AppointmentStatus.COMPLETED) {
      updateData.completedAt = new Date();
      if (data?.treatmentDetails) {
        updateData.treatmentDetails = data.treatmentDetails;
      }
      if (data?.totalAmount) {
        updateData.totalAmount = data.totalAmount;
      } else if (!appointment.totalAmount && appointment.service?.price) {
        updateData.totalAmount = appointment.service.price;
      }
    } else if (status === AppointmentStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
    } else if (status === AppointmentStatus.NO_SHOW) {
      updateData.noShowMarkedAt = new Date();
    }

    await this.appointmentsRepository.update(id, updateData);

    const updatedAppointment = await this.findById(id);

    // Emit events for different status changes
    this.eventEmitter.emit('appointment.status.changed', {
      appointment: updatedAppointment,
      oldStatus: appointment.status,
      newStatus: status,
    });

    return updatedAppointment;
  }

  async reschedule(id: string, newStartTime: Date, newEndTime: Date): Promise<Appointment> {
    await this.appointmentsRepository.update(id, {
      startTime: newStartTime,
      endTime: newEndTime,
    });

    const appointment = await this.findById(id);
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
  ): Promise<Appointment[]> {
    const queryBuilder = this.appointmentsRepository.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.clinic', 'clinic')
      .leftJoinAndSelect('appointment.service', 'service')
      .leftJoinAndSelect('service.treatment', 'treatment')
      .leftJoinAndSelect('appointment.provider', 'provider')
      .leftJoinAndSelect('appointment.client', 'client')
      .leftJoinAndSelect('appointment.bookedBy', 'bookedBy');

    // Filter based on user role and permissions
    if (userRole === 'admin' || userRole === 'SUPER_ADMIN') {
      // Admins and SUPER_ADMINs see all appointments. No restrictions.
      queryBuilder.where('1=1');
    } else if (userRole === 'clinic_owner' || userRole === 'secretariat') {
      // For clinical owners/secretariat, we want to show all appointments for their clinic
      const user = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ['ownedClinics'],
      });

      if (!user) throw new NotFoundException('User not found');

      const clinicIds = (user.ownedClinics || []).map(c => c.id);
      if (user.assignedClinicId) clinicIds.push(user.assignedClinicId);

      if (clinicIds.length > 0) {
        queryBuilder.where('appointment.clinicId IN (:...clinicIds)', { clinicIds });
      } else {
        queryBuilder.where('appointment.providerId = :userId', { userId });
      }
    } else if (userRole === 'doctor') {
      // Doctors ONLY see their own appointments
      queryBuilder.where('appointment.providerId = :userId', { userId });
    } else if (userRole === 'salesperson') {
      // Salespeople see appointments:
      // 1. They booked themselves
      // 2. For clients assigned to them in CRM (CustomerRecord or Lead)
      // 3. For any client whose mobile matches a lead assigned to them

      // We'll broaden the selection and handle the "Blocked Time" logic in the mapping phase
      // to ensure they see slots in clinics they might have access to, or just their own.
      // Based on specific requirement: "If it is a Beauty Doctors Client should appear also in... salesperson who is owner"

      if (query.clinicId || query.providerId) {
        // Broaden selection for mapping later (masking results they don't own)
        queryBuilder.leftJoin(Lead, 'lead', 'lead.phone = client.phone OR (client.email IS NOT NULL AND lead.email = client.email)')
          .leftJoin(CustomerRecord, 'record', 'record.customerId = client.id');

        if (query.clinicId) {
          queryBuilder.andWhere('appointment.clinicId = :clinicId', { clinicId: query.clinicId });
        }
      } else {
        // Restrictive selection when no scope provided
        queryBuilder.leftJoin(Lead, 'lead', 'lead.phone = client.phone OR (client.email IS NOT NULL AND lead.email = client.email)')
          .leftJoin(CustomerRecord, 'record', 'record.customerId = client.id')
          .where('(appointment.bookedById = :userId OR record.assignedSalespersonId = :userId OR lead.assignedSalesId = :userId)', { userId });
      }
      // Select customerRecords to check ownership in mapping
      queryBuilder.leftJoinAndSelect('client.customerRecords', 'customerRecords');

    } else {
      // For other roles (e.g. client), return appointments where user is involved
      queryBuilder.where(
        '(appointment.providerId = :userId OR appointment.clientId = :userId OR appointment.bookedById = :userId)',
        { userId }
      );
    }

    if (query.status) {
      queryBuilder.andWhere('appointment.status = :status', { status: query.status });
    }

    if (query.date) {
      const date = new Date(query.date);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      queryBuilder.andWhere('appointment.startTime BETWEEN :startOfDay AND :endOfDay', {
        startOfDay,
        endOfDay,
      });
    }

    if (query.providerId) {
      queryBuilder.andWhere('appointment.providerId = :providerId', { providerId: query.providerId });
    }

    try {
      const appointments = await queryBuilder.orderBy('appointment.startTime', 'ASC').getMany();

      // Masking logic: If salesperson doesn't own the client, hide details
      return appointments.map(apt => {
        let isMasked = false;
        if (userRole === 'salesperson') {
          const isBookedByMe = apt.bookedById === userId;
          const isProvidedByMe = apt.providerId === userId;
          const assignedRecord = (apt.client as any)?.customerRecords?.find((r: any) => r.assignedSalespersonId === userId);
          const isOwnedByMe = !!assignedRecord;

          // Re-check based on requirement: "If it is a Beauty Doctors Client... should appear also in... salesperson who is owner"
          // If NOT booked by me AND NOT owned by me AND NOT provided by me, mask it.
          if (!isBookedByMe && !isOwnedByMe && !isProvidedByMe) {
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
            providerName: apt.provider ? `${apt.provider.firstName} ${apt.provider.lastName}` : null,
            bookedByInfo: null,
          };
        }

        return {
          ...apt,
          displayName: this.formatAppointmentDisplayName(apt),
          serviceName: apt.service?.treatment?.name,
          providerName: apt.provider ? `${apt.provider.firstName} ${apt.provider.lastName}` : null,
          bookedByInfo: apt.bookedBy ? {
            id: apt.bookedBy.id,
            name: `${apt.bookedBy.firstName} ${apt.bookedBy.lastName}`,
            role: apt.bookedBy.role
          } : null,
        };
      }) as any[];
    } catch (error) {
      console.error('Error in findClinicAppointments:', error);
      throw error;
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
    // SECRETARIAT and CLINIC_OWNER have same permissions - can see all clinic appointments
    if (userRole === 'clinic_owner' || userRole === 'secretariat') {
      queryBuilder.andWhere('clinic.ownerId = :userId', { userId });
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

    // Only Admin / Super Admin / Salesperson can CONFIRM appointments
    if (
      status === AppointmentStatus.CONFIRMED &&
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.SUPER_ADMIN &&
      userRole !== UserRole.SALESPERSON
    ) {
      throw new ForbiddenException('Only Admin or Sales can confirm appointments');
    }

    appointment.status = status;

    if (updateData?.notes) {
      appointment.notes = updateData.notes;
    }

    if (updateData?.treatmentDetails) {
      appointment.treatmentDetails = updateData.treatmentDetails;
    }

    if (status === AppointmentStatus.COMPLETED) {
      appointment.completedAt = new Date();
    } else if (status === AppointmentStatus.CANCELLED) {
      appointment.cancelledAt = new Date();
    } else if (status === AppointmentStatus.NO_SHOW) {
      appointment.noShowMarkedAt = new Date();
    }

    return this.appointmentsRepository.save(appointment);
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

    const savedAppointment = await this.appointmentsRepository.save(appointment);

    // Emit event for notifications and loyalty
    this.eventEmitter.emit('appointment.status.changed', {
      appointment: savedAppointment,
      oldStatus,
      newStatus: AppointmentStatus.COMPLETED,
    });

    return savedAppointment;
  }

  async recordPayment(
    appointmentId: string,
    userId: string,
    paymentData: RecordPaymentDto,
  ): Promise<Appointment> {
    const appointment = await this.findAppointmentForClinic(appointmentId, userId, 'admin');

    if (paymentData.isAdvancePayment) {
      appointment.advancePaymentAmount = paymentData.amount;
    } else {
      appointment.totalAmount = paymentData.amount;
    }

    appointment.paymentMethod = paymentData.paymentMethod;
    appointment.notes = paymentData.notes || appointment.notes;

    const savedAppointment = await this.appointmentsRepository.save(appointment);

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

  async findAppointmentsInRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    return this.appointmentsRepository.find({
      where: {
        startTime: Between(startDate, endDate),
        status: AppointmentStatus.CONFIRMED,
      },
      relations: ['clinic', 'service', 'provider', 'client'],
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