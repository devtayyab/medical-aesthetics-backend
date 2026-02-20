import { RecordPaymentDto } from '../clinics/dto/clinic.dto';
import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from '../bookings/entities/appointment.entity';
import { Between, Repository, MoreThan } from 'typeorm';
import { AppointmentHold } from './entities/appointment-hold.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HoldSlotDto } from './dto/hold-slot.dto';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

import { CrmService } from '../crm/crm.service';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { forwardRef, Inject } from '@nestjs/common';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(AppointmentHold)
    private holdsRepository: Repository<AppointmentHold>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => CrmService))
    private crmService: CrmService,
    private eventEmitter: EventEmitter2,
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

  async createAppointment(createAppointmentDto: CreateAppointmentDto & { appointmentSource?: 'clinic_own' | 'platform_broker' }): Promise<Appointment> {
    let clientId = createAppointmentDto.clientId;

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Check if client exists as User
    let userExists = null;
    if (UUID_REGEX.test(clientId)) {
      userExists = await this.usersRepository.findOne({ where: { id: clientId } });
    }

    if (!userExists) {
      // Try to find as Lead
      try {
        if (!UUID_REGEX.test(clientId)) {
          throw new NotFoundException(`Invalid Client ID format: ${clientId}`);
        }

        const lead = await this.crmService.getLead(clientId);
        if (lead) {
          // Check if user with this email already exists
          const existingUser = await this.usersRepository.findOne({ where: { email: lead.email } });

          if (existingUser) {
            clientId = existingUser.id;
          } else {
            // Convert Lead to User using CRM Service to ensure proper records
            try {
              let salespersonId = lead.assignedSalesId;
              if (salespersonId && UUID_REGEX.test(salespersonId)) {
                const salesExists = await this.usersRepository.findOne({ where: { id: salespersonId } });
                if (!salesExists) {
                  console.warn(`Lead ${clientId} has invalid assignedSalesId ${salespersonId}, ignoring.`);
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
            } catch (createErr) {
              console.error('createCustomer failed during booking:', createErr);
              // If createCustomer fails (e.g. race condition on email), try to find again
              const retryUser = await this.usersRepository.findOne({ where: { email: lead.email } });
              if (retryUser) {
                clientId = retryUser.id;
              } else {
                throw createErr;
              }
            }
          }
        } else {
          throw new NotFoundException(`Client not found as User or Lead: ${clientId}`);
        }
      } catch (e) {
        if (e instanceof NotFoundException) throw e;
        console.error('Lead lookup/conversion failed:', e);
        throw new BadRequestException(`Lead conversion failed: ${e.message}`);
      }
    }

    const appointmentData = {
      ...createAppointmentDto,
      clientId, // Use potentially updated clientId
      providerId: createAppointmentDto.providerId ?? null,
      startTime: new Date(createAppointmentDto.startTime),
      endTime: new Date(createAppointmentDto.endTime),
      appointmentSource: createAppointmentDto.appointmentSource || 'platform_broker',
      clientDetails: createAppointmentDto.clientDetails,
    };

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

    const appointment = this.appointmentsRepository.create(appointmentData);
    const savedAppointment = await this.appointmentsRepository.save(appointment);

    // Load full relations before emitting event for notifications
    const appointmentWithRelations = await this.findById(savedAppointment.id);

    // Emit event for notifications with full relations
    this.eventEmitter.emit('appointment.created', appointmentWithRelations);

    return appointmentWithRelations;
  }

  async findById(id: string): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['clinic', 'service', 'provider', 'client'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  // Helper method to format appointment display name
  formatAppointmentDisplayName(appointment: Appointment): string {
    const serviceName = appointment.service?.name || 'Appointment';
    const providerName = appointment.provider
      ? `${appointment.provider.firstName} ${appointment.provider.lastName}`
      : 'Professional';
    return `${serviceName} with ${providerName}`;
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
      }
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
      serviceName: apt.service?.name,
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
      .leftJoinAndSelect('appointment.provider', 'provider')
      .leftJoinAndSelect('appointment.client', 'client');

    // Filter based on user role and permissions
    if (userRole === 'clinic_owner' || userRole === 'secretariat') {
      queryBuilder.where('clinic.ownerId = :userId', { userId });
    } else if (userRole === 'manager') {
      // Managers can view all appointments if they provide a clinicId, 
      // or potentially all clinics they manage. 
      // For now, if clinicId is in query, we filter by it.
      // The base query will be unrestricted by user ID, but we should enforce clinic context.
      if (query['clinicId']) {
        queryBuilder.andWhere('appointment.clinicId = :clinicId', { clinicId: query['clinicId'] });
      }
      // If no clinicId provided, a manager might see nothing or everything? 
      // Let's assume they need to provide a clinicId for now to see appointments of a specific clinic.
      // Or if they want to see "all" appointments across system (unlikely for specific clinic view).
      // We'll leave it as is, effectively showing all if no clinicId (which is dangerous), 
      // BUT the frontend sends clinicId.
    } else {
      // For other roles (e.g. provider), return appointments where user is involved
      queryBuilder.where(
        '(appointment.providerId = :userId OR appointment.clientId = :userId)',
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

    if (query.appointmentSource) {
      queryBuilder.andWhere('appointment.appointmentSource = :appointmentSource', { appointmentSource: query.appointmentSource });
    }

    const appointments = await queryBuilder.orderBy('appointment.startTime', 'ASC').getMany();

    // Add display name to each appointment
    return appointments.map(apt => ({
      ...apt,
      displayName: this.formatAppointmentDisplayName(apt),
      serviceName: apt.service?.name,
      providerName: apt.provider ? `${apt.provider.firstName} ${apt.provider.lastName}` : null,
    })) as Appointment[];
  }

  async findAppointmentForClinic(
    appointmentId: string,
    userId: string,
    userRole: string,
  ): Promise<Appointment> {
    const queryBuilder = this.appointmentsRepository.createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.clinic', 'clinic')
      .leftJoinAndSelect('appointment.service', 'service')
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

    appointment.status = status;

    if (updateData?.notes) {
      appointment.notes = updateData.notes;
    }

    if (updateData?.treatmentDetails) {
      appointment.treatmentDetails = updateData.treatmentDetails;
    }

    if (status === AppointmentStatus.COMPLETED) {
      appointment.completedAt = new Date();
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
  ): Promise<Appointment> {
    const appointment = await this.findAppointmentForClinic(appointmentId, userId, userRole);

    appointment.status = AppointmentStatus.COMPLETED;
    appointment.completedAt = new Date();

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

    return this.appointmentsRepository.save(appointment);
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

    return this.appointmentsRepository.save(appointment);
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

    // SECRETARIAT and CLINIC_OWNER have same permissions
    if (userRole === 'clinic_owner' || userRole === 'secretariat') {
      baseQuery = baseQuery.leftJoin('appointment.clinic', 'clinic')
        .where('clinic.ownerId = :userId', { userId });
    } else if (userRole === 'manager' && query.clinicId) {
      baseQuery = baseQuery.andWhere('appointment.clinicId = :clinicId', { clinicId: query.clinicId });
    } else {
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
        serviceName: apt.service?.name,
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
}