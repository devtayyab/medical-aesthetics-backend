import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Lead } from './entities/lead.entity';
import { CustomerRecord } from './entities/customer-record.entity';
import { CommunicationLog } from './entities/communication-log.entity';
import { CrmAction } from './entities/crm-action.entity';
import { CustomerTag } from './entities/customer-tag.entity';
import { User } from '../users/entities/user.entity';
import { Appointment } from '../bookings/entities/appointment.entity';
import { AgentClinicAccess } from './entities/agent-clinic-access.entity';
import { ClinicOwnership } from './entities/clinic-ownership.entity';
import { AdCampaign } from './entities/ad-campaign.entity';
import { AdSpendLog } from './entities/ad-spend-log.entity';
import { AdAttribution } from './entities/ad-attribution.entity';
import { Clinic } from '../clinics/entities/clinic.entity';
import { UserRole } from '@/common/enums/user-role.enum';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { FacebookWebhookDto } from './dto/facebook-webhook.dto';
import { LeadStatus } from '../../common/enums/lead-status.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { TaskAutomationService } from './task-automation.service';
import { FacebookService, ParsedFacebookLead } from './facebook.service';
import { QueueService } from '../queue/queue.service';
import { DuplicateDetectionService } from './duplicate-detection.service';
import { CustomerAffiliationService } from './customer-affiliation.service';
import { MandatoryFieldValidationService } from './mandatory-field-validation.service';

@Injectable()
export class CrmService {
  constructor(
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
    @InjectRepository(CustomerRecord)
    private customerRecordsRepository: Repository<CustomerRecord>,
    @InjectRepository(CommunicationLog)
    private communicationLogsRepository: Repository<CommunicationLog>,
    @InjectRepository(CrmAction)
    private crmActionsRepository: Repository<CrmAction>,
    @InjectRepository(CustomerTag)
    private customerTagsRepository: Repository<CustomerTag>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(AgentClinicAccess)
    private agentClinicAccessRepository: Repository<AgentClinicAccess>,
    @InjectRepository(ClinicOwnership)
    private clinicOwnershipRepository: Repository<ClinicOwnership>,
    @InjectRepository(Clinic)
    private clinicsRepository: Repository<Clinic>,
    @InjectRepository(AdCampaign)
    private adCampaignsRepository: Repository<AdCampaign>,
    @InjectRepository(AdSpendLog)
    private adSpendLogsRepository: Repository<AdSpendLog>,
    private eventEmitter: EventEmitter2,
    private notificationsService: NotificationsService,
    private facebookService: FacebookService,
    private duplicateDetectionService: DuplicateDetectionService,
    private customerAffiliationService: CustomerAffiliationService,
    private mandatoryFieldValidationService: MandatoryFieldValidationService,
    private taskAutomationService: TaskAutomationService,
    private queueService: QueueService,
  ) { }

  private async userHasAccessToCustomer(userId: string, customerId: string): Promise<boolean> {
    if (!userId) return false;
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return false;

    if (user.role === UserRole.SALESPERSON) {
      const record = await this.customerRecordsRepository.findOne({ where: { customerId } });
      return record?.assignedSalespersonId === userId;
    }

    if (user.role === UserRole.CLINIC_OWNER) {
      const ownerships = await this.clinicOwnershipRepository.find({ where: { ownerUserId: userId } });
      const ownedClinicIds = ownerships.map(o => o.clinicId);
      if (ownedClinicIds.length === 0) return false;
      const apt = await this.appointmentsRepository.findOne({
        where: { clientId: customerId },
        relations: ['clinic'],
        order: { startTime: 'DESC' },
      });
      return !!apt && ownedClinicIds.includes(apt.clinic?.id);
    }

    // default deny
    return false;
  }

  async create(createLeadDto: CreateLeadDto): Promise<Lead> {
    // Use enhanced duplicate detection
    const duplicateCheck = await this.duplicateDetectionService.checkForDuplicates(
      createLeadDto.email,
      createLeadDto.phone,
      createLeadDto.firstName,
      createLeadDto.lastName,
    );

    if (duplicateCheck.isDuplicate && duplicateCheck.existingCustomer) {
      // Update existing customer record instead of creating duplicate lead
      return this.updateExistingCustomerWithNewLead(duplicateCheck.existingCustomer, createLeadDto);
    }

    const lead = this.leadsRepository.create(createLeadDto);
    const savedLead = await this.leadsRepository.save(lead);

    // Emit event for notifications and task creation
    this.eventEmitter.emit('lead.created', savedLead);

    return savedLead;
  }

  async scheduleRecurringAppointment(data: any): Promise<any> {
    const { customerId, serviceId, frequency } = data;

    // Validate customer exists
    const customer = await this.usersRepository.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Resolve CustomerRecord
    let record = await this.customerRecordsRepository.findOne({ where: { customerId } });
    if (!record) {
      record = await this.createCustomerRecord(customerId);
    }

    // Use QueueService to schedule repetition
    await this.queueService.scheduleRecurringAppointments(
      serviceId, // we treat serviceId as templateId/service description for now
      frequency,
      customerId,
    );

    return {
      success: true,
      message: `Recurring appointment scheduled for client ${customerId} with ${frequency} frequency`,
    };
  }

  async handleFacebookWebhook(webhookData: FacebookWebhookDto): Promise<void> {
    for (const entry of webhookData.entry) {
      try {
        // Get full lead data from Facebook
        const leadData = await this.facebookService.getLead(entry.id);
        const parsedLead = this.facebookService.parseLeadData(leadData);

        // Use enhanced duplicate detection
        const duplicateCheck = await this.duplicateDetectionService.checkForDuplicates(
          parsedLead.email,
          parsedLead.phone,
          parsedLead.firstName,
          parsedLead.lastName,
        );

        if (duplicateCheck.isDuplicate && duplicateCheck.existingCustomer) {
          await this.updateExistingCustomerWithFacebookLead(duplicateCheck.existingCustomer, parsedLead, leadData);
        } else {
          await this.createLeadFromFacebook(parsedLead, leadData);
        }
      } catch (error) {
        console.error(`Error processing Facebook lead ${entry.id}:`, error);
        // Continue processing other leads even if one fails
      }
    }
  }

  async importFacebookLeads(formId: string, limit: number = 50): Promise<Lead[]> {
    const leadsData = await this.facebookService.getLeadsByForm(formId, limit);
    const createdLeads: Lead[] = [];

    for (const leadData of leadsData) {
      try {
        const parsedLead = this.facebookService.parseLeadData(leadData);

        // Use enhanced duplicate detection
        const duplicateCheck = await this.duplicateDetectionService.checkForDuplicates(
          parsedLead.email,
          parsedLead.phone,
          parsedLead.firstName,
          parsedLead.lastName,
        );

        if (duplicateCheck.isDuplicate && duplicateCheck.existingCustomer) {
          await this.updateExistingCustomerWithFacebookLead(duplicateCheck.existingCustomer, parsedLead, leadData);
        } else {
          const lead = await this.createLeadFromFacebook(parsedLead, leadData);
          createdLeads.push(lead);
        }
      } catch (error) {
        console.error(`Error processing Facebook lead ${leadData.id}:`, error);
      }
    }

    return createdLeads;
  }

  private async findExistingCustomer(email?: string, phone?: string): Promise<User | null> {
    if (!email && !phone) return null;

    const query = this.usersRepository.createQueryBuilder('user');

    if (email) {
      query.orWhere('user.email = :email', { email });
    }

    if (phone) {
      query.orWhere('user.phone = :phone', { phone });
    }

    return query.getOne();
  }

  private async updateExistingCustomerWithNewLead(existingCustomer: User, leadDto: CreateLeadDto): Promise<Lead> {
    // Get the customer record to find assigned salesperson
    const customerRecord = await this.customerRecordsRepository.findOne({
      where: { customerId: existingCustomer.id },
    });

    // Create a new lead but link it to the existing customer
    const lead = this.leadsRepository.create({
      ...leadDto,
      status: LeadStatus.CONTACTED, // Mark as contacted since they already exist
      metadata: {
        ...leadDto.metadata,
        existingCustomerId: existingCustomer.id,
        mergedLead: true,
      },
    });

    const savedLead = await this.leadsRepository.save(lead);

    // Create communication log instead of trying to update CustomerRecord with notes
    if (customerRecord?.assignedSalespersonId) {
      await this.logCommunication({
        customerId: existingCustomer.id,
        salespersonId: customerRecord.assignedSalespersonId,
        type: 'form_submission',
        direction: 'incoming',
        status: 'completed',
        subject: 'New Form Submission',
        notes: `New form submission received: ${leadDto.notes || 'No notes'}`,
        metadata: {
          source: 'web_form',
          leadId: savedLead.id,
        },
      });
    }

    // Update customer record with last contact date only
    await this.updateCustomerRecord(existingCustomer.id, {
      lastContactDate: new Date(),
    });

    // Emit event for the merged lead
    this.eventEmitter.emit('lead.created', savedLead);

    return savedLead;
  }

  private async updateExistingCustomerWithFacebookLead(
    existingCustomer: User,
    parsedLead: ParsedFacebookLead,
    leadData: any
  ): Promise<void> {
    // Get the customer record to find assigned salesperson
    const customerRecord = await this.customerRecordsRepository.findOne({
      where: { customerId: existingCustomer.id },
    });

    // Update customer record with last contact date only
    await this.updateCustomerRecord(existingCustomer.id, {
      lastContactDate: new Date(),
    });

    // Create a communication log entry for the Facebook form submission
    if (customerRecord?.assignedSalespersonId) {
      await this.logCommunication({
        customerId: existingCustomer.id,
        salespersonId: customerRecord.assignedSalespersonId,
        type: 'form_submission',
        direction: 'incoming',
        status: 'completed',
        subject: 'Facebook Lead Form Submission',
        notes: `Form submitted via Facebook. Campaign: ${parsedLead.facebookCampaignId || 'Unknown'}. Form: ${parsedLead.facebookFormId || 'Unknown form'}.`,
        metadata: {
          facebookLeadId: parsedLead.facebookLeadId,
          facebookFormId: parsedLead.facebookFormId,
          facebookCampaignId: parsedLead.facebookCampaignId,
          leadData: leadData,
        },
      });
    }

    // Create an action for the salesperson to follow up
    const action = this.crmActionsRepository.create({
      customerId: existingCustomer.id,
      actionType: 'follow_up',
      title: 'Facebook Form Submission - Follow Up',
      description: `Customer submitted form via Facebook. Please contact them.`,
      status: 'pending',
      priority: 'high',
      metadata: {
        source: 'facebook',
        facebookLeadId: parsedLead.facebookLeadId,
        originalSubmission: true, // This is the original submission, not a duplicate
      },
    });

    await this.crmActionsRepository.save(action);

    // Emit event for notifications
    this.eventEmitter.emit('facebook.lead.merged', {
      customer: existingCustomer,
      facebookLead: parsedLead,
      action,
    });
  }

  private async createLeadFromFacebook(parsedLead: ParsedFacebookLead, leadData: any): Promise<Lead> {
    const leadDto: CreateLeadDto = {
      source: 'facebook_ads',
      firstName: parsedLead.firstName || '',
      lastName: parsedLead.lastName || '',
      email: parsedLead.email || '',
      phone: parsedLead.phone,
      facebookLeadId: parsedLead.facebookLeadId,
      facebookFormId: parsedLead.facebookFormId,
      facebookCampaignId: parsedLead.facebookCampaignId,
      facebookAdSetId: parsedLead.facebookAdSetId,
      facebookAdId: parsedLead.facebookAdId,
      facebookLeadData: parsedLead.facebookLeadData,
      status: LeadStatus.NEW,
      metadata: {
        importedFromFacebook: true,
        importDate: new Date(),
      },
    };

    return this.create(leadDto);
  }

  async checkForDuplicates(
    email?: string,
    phone?: string,
    firstName?: string,
    lastName?: string,
  ) {
    return this.duplicateDetectionService.checkForDuplicates(email, phone, firstName, lastName);
  }

  async getDuplicateSuggestions(
    email?: string,
    phone?: string,
    firstName?: string,
    lastName?: string,
  ) {
    return this.duplicateDetectionService.getDuplicateSuggestions(email, phone, firstName, lastName);
  }

  async getRequiredFieldsForCall() {
    return this.mandatoryFieldValidationService.getRequiredFieldsForCall();
  }

  async getRequiredFieldsForAction(actionType: string) {
    return this.mandatoryFieldValidationService.getRequiredFieldsForAction(actionType);
  }

  async validateActionFields(customerId: string, actionData: Partial<CrmAction>) {
    return this.mandatoryFieldValidationService.validateActionFields(customerId, actionData);
  }

  async validateCommunicationFields(customerId: string, communicationData: Partial<CommunicationLog>) {
    return this.mandatoryFieldValidationService.validateCommunicationFields(customerId, communicationData);
  }

  async getOverdueTasks(salespersonId?: string) {
    return this.taskAutomationService.getOverdueTasks(salespersonId);
  }

  async getAutomationRules() {
    return this.taskAutomationService.getAutomationRules();
  }

  async runTaskAutomationCheck() {
    return this.taskAutomationService.runTaskAutomationCheck();
  }

  async findAll(filters: any = {}): Promise<Lead[]> {
    const qb = this.leadsRepository.createQueryBuilder('lead')
      .leftJoinAndSelect('lead.assignedSales', 'sales')
      .leftJoinAndSelect('lead.tags', 'tags');

    if (filters.status) {
      qb.where('lead.status = :status', { status: filters.status });
    }

    if (filters.source) {
      qb.andWhere('lead.source = :source', { source: filters.source });
    }

    if (filters.search) {
      qb.andWhere(
        '(lead.firstName ILIKE :search OR lead.lastName ILIKE :search OR lead.email ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // ACL: if requester is salesperson, only show leads assigned to them
    if (filters._requesterId) {
      const user = await this.usersRepository.findOne({ where: { id: filters._requesterId } });
      if (user?.role === UserRole.SALESPERSON) {
        qb.andWhere('lead.assignedSalesId = :sid', { sid: filters._requesterId });
      }
      // For clinic owners, leave as-is for now (leads may not be linked to clinics). Future: relate leads to clinic and filter.
    }

    return qb.getMany();
  }

  async findById(id: string): Promise<Lead> {
    const lead = await this.leadsRepository.findOne({
      where: { id },
      relations: ['assignedSales', 'tags', 'tasks'],
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  async update(id: string, updateLeadDto: UpdateLeadDto): Promise<Lead> {
    const lead = await this.findById(id);

    // Check for status changes
    if (updateLeadDto.status && updateLeadDto.status !== lead.status) {
      if (updateLeadDto.status === LeadStatus.CONVERTED) {
        updateLeadDto['convertedAt'] = new Date();
      }

      this.eventEmitter.emit('lead.status.changed', {
        lead,
        oldStatus: lead.status,
        newStatus: updateLeadDto.status,
      });
    }

    await this.leadsRepository.update(id, updateLeadDto);
    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.leadsRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Lead not found');
    }
  }

  async updateLastContacted(id: string): Promise<void> {
    await this.leadsRepository.update(id, { lastContactedAt: new Date() });
  }

  async getCustomer(id: string): Promise<any> {
    const customer = await this.usersRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  // Customer Record Management
  async getCustomerRecord(customerId: string, salespersonId?: string): Promise<any> {
    if (salespersonId) {
      const access = await this.userHasAccessToCustomer(salespersonId, customerId);
      if (!access) {
        throw new NotFoundException('Customer not found');
      }
    }
    let record = await this.customerRecordsRepository.findOne({
      where: { customerId },
      relations: ['customer', 'assignedSalesperson', 'communications', 'actions', 'tags'],
    });

    if (!record) {
      // Create new record if doesn't exist
      record = await this.createCustomerRecord(customerId, salespersonId);
    }

    // Get appointments
    const appointments = await this.appointmentsRepository.find({
      where: { clientId: customerId },
      relations: ['service', 'clinic'],
      order: { startTime: 'DESC' },
    });

    // Get communication history
    const communications = await this.communicationLogsRepository.find({
      where: { customerId },
      relations: ['salesperson'],
      order: { createdAt: 'DESC' },
      take: 50,
    });

    // Get actions/tasks
    const actions = await this.crmActionsRepository.find({
      where: { customerId },
      relations: ['salesperson'],
      order: { createdAt: 'DESC' },
    });

    // Get tags
    const tags = await this.customerTagsRepository.find({
      where: { customerId },
      relations: ['tag', 'addedByUser'],
    });

    // Get clinic and doctor affiliations
    const clinicAffiliations = await this.customerAffiliationService.getClinicAffiliations(customerId);
    const doctorAffiliations = await this.customerAffiliationService.getDoctorAffiliations(customerId);
    const preferredClinic = await this.customerAffiliationService.getPreferredClinic(customerId);
    const preferredDoctor = await this.customerAffiliationService.getPreferredDoctor(customerId);

    return {
      record,
      appointments: appointments.map(apt => ({
        id: apt.id,
        serviceName: apt.service?.name,
        clinicName: apt.clinic?.name,
        startTime: apt.startTime,
        status: apt.status,
        totalAmount: apt.totalAmount,
        treatmentDetails: apt.treatmentDetails,
      })),
      communications,
      actions,
      tags: tags.map(t => ({
        id: t.id,
        tag: t.tag,
        addedBy: t.addedByUser,
        notes: t.notes,
        createdAt: t.createdAt,
      })),
      affiliations: {
        clinics: clinicAffiliations,
        doctors: doctorAffiliations,
        preferredClinic,
        preferredDoctor,
      },
      summary: {
        totalAppointments: record.totalAppointments,
        completedAppointments: record.completedAppointments,
        lifetimeValue: record.lifetimeValue,
        lastAppointment: record.lastAppointmentDate,
        nextAppointment: record.nextAppointmentDate,
        isRepeatCustomer: record.isRepeatCustomer,
        repeatCount: record.repeatCount,
        preferredClinic: preferredClinic?.clinicName,
        preferredDoctor: preferredDoctor?.doctorName,
      },
    };
  }

  async createCustomerRecord(customerId: string, salespersonId?: string): Promise<CustomerRecord> {
    const record = this.customerRecordsRepository.create({
      customerId,
      assignedSalespersonId: salespersonId,
    });
    return this.customerRecordsRepository.save(record);
  }

  async createCustomer(data: any, salespersonId: string): Promise<User> {
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: [{ email: data.email }, { phone: data.phone }],
    });

    if (existingUser) {
      throw new BadRequestException('Customer with this email or phone already exists');
    }

    const newUser = this.usersRepository.create({
      ...data,
      role: UserRole.CLIENT,
      isActive: true,
      passwordHash: Math.random().toString(36).slice(-10), // Random temporary password
    } as Partial<User>);

    const savedUser = await this.usersRepository.save(newUser);

    // Create customer record
    await this.createCustomerRecord(savedUser.id, salespersonId);

    return savedUser;
  }

  async getCustomers(filters: any): Promise<any[]> {
    const requesterId = filters._requesterId;

    const query = this.customerRecordsRepository.createQueryBuilder('record')
      .leftJoinAndSelect('record.customer', 'customer')
      .leftJoinAndSelect('record.assignedSalesperson', 'salesperson');

    if (requesterId) {
      const user = await this.usersRepository.findOne({ where: { id: requesterId } });
      if (user?.role === UserRole.SALESPERSON) {
        query.andWhere('record.assignedSalespersonId = :requesterId', { requesterId });
      }
    }

    if (filters.search) {
      query.andWhere(
        '(customer.firstName ILIKE :search OR customer.lastName ILIKE :search OR customer.email ILIKE :search OR customer.phone ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.status) {
      query.andWhere('record.customerStatus = :status', { status: filters.status });
    }

    return query.getMany();
  }

  async updateCustomerRecord(customerId: string, updateData: Partial<CustomerRecord>): Promise<CustomerRecord> {
    let record = await this.customerRecordsRepository.findOne({ where: { customerId } });

    if (!record) {
      record = await this.createCustomerRecord(customerId);
    }

    Object.assign(record, updateData);
    return this.customerRecordsRepository.save(record);
  }

  // Communication Log Management
  async logCommunication(data: Partial<CommunicationLog>): Promise<CommunicationLog> {
    // Enforce mandatory field validation for call communications, except click-only logs
    if (data.type === 'call' && !(data.metadata && (data.metadata as any).clickOnly === true)) {
      await this.mandatoryFieldValidationService.enforceFieldCompletion(data.customerId, data);
    }

    const log = this.communicationLogsRepository.create(data);
    const savedLog = await this.communicationLogsRepository.save(log);

    // Update last contact date
    await this.updateCustomerRecord(data.customerId, {
      lastContactDate: new Date(),
    });

    // Emit event for notifications
    this.eventEmitter.emit('communication.logged', savedLog);

    return savedLog;
  }

  async getCommunicationHistory(
    customerId: string,
    filters?: { type?: string; startDate?: Date; endDate?: Date }
  ): Promise<CommunicationLog[]> {
    // Enforce ACL when requester provided
    const anyFilters: any = filters || {};
    if (anyFilters._requesterId) {
      const allowed = await this.userHasAccessToCustomer(anyFilters._requesterId, customerId);
      if (!allowed) {
        throw new NotFoundException('Customer not found');
      }
    }
    const queryBuilder = this.communicationLogsRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.salesperson', 'salesperson')
      .where('log.customerId = :customerId', { customerId });

    if (filters?.type) {
      queryBuilder.andWhere('log.type = :type', { type: filters.type });
    }

    if (filters?.startDate && filters?.endDate) {
      queryBuilder.andWhere('log.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    return queryBuilder.orderBy('log.createdAt', 'DESC').getMany();
  }

  // Action/Task Management
  async createAction(data: Partial<CrmAction>): Promise<CrmAction> {
    // Resolve customerRecord if customerId (User ID) is provided
    if (data.customerId) {
      const record = await this.customerRecordsRepository.findOne({
        where: { customerId: data.customerId }
      });

      if (record) {
        // Here we assume data.customerId was actually the User.id
        // The entity's customerId field is the FK to CustomerRecord.id
        data.customerId = record.id;
      }
    }

    // Enforce mandatory field validation for phone call actions
    if (data.actionType === 'phone_call') {
      await this.mandatoryFieldValidationService.enforceActionCompletion(data.customerId, data);
    }

    const action = this.crmActionsRepository.create(data);
    const savedAction = await this.crmActionsRepository.save(action);

    // Send notification if it's a pending task
    if (data.status === 'pending' && data.dueDate) {
      await this.notificationsService.create(
        data.salespersonId,
        NotificationType.PUSH,
        'New Task Created',
        `${data.title} - Due: ${data.dueDate}`,
        { actionId: savedAction.id },
      );
    }

    this.eventEmitter.emit('crm.action.created', savedAction);
    return savedAction;
  }

  async updateAction(id: string, updateData: Partial<CrmAction>): Promise<CrmAction> {
    const action = await this.crmActionsRepository.findOne({ where: { id } });

    if (!action) {
      throw new NotFoundException('Action not found');
    }

    if (updateData.status === 'completed' && action.status !== 'completed') {
      updateData.completedAt = new Date();
    }

    Object.assign(action, updateData);
    return this.crmActionsRepository.save(action);
  }

  async getActions(
    requesterId: string,
    filters?: { status?: string; priority?: string; customerId?: string }
  ): Promise<CrmAction[]> {
    const user = await this.usersRepository.findOne({ where: { id: requesterId } });
    const qb = this.crmActionsRepository
      .createQueryBuilder('action')
      .leftJoinAndSelect('action.customer', 'customer');

    if (user?.role === UserRole.SALESPERSON) {
      qb.where('action.salespersonId = :sid', { sid: requesterId });
    } else if (user?.role === UserRole.CLINIC_OWNER) {
      // Actions for customers in owned clinics
      const ownerships = await this.clinicOwnershipRepository.find({ where: { ownerUserId: requesterId } });
      const ownedClinicIds = ownerships.map(o => o.clinicId);
      if (ownedClinicIds.length === 0) return [];
      qb.leftJoin('customer.customer', 'u')
        .leftJoin('u.clientAppointments', 'apt')
        .andWhere('apt.clinicId IN (:...ids)', { ids: ownedClinicIds });
    } else {
      // Default: nothing
      qb.where('1=0');
    }

    if (filters?.status) {
      qb.andWhere('action.status = :status', { status: filters.status });
    }

    if (filters?.priority) {
      qb.andWhere('action.priority = :priority', { priority: filters.priority });
    }

    if (filters?.customerId) {
      qb.andWhere('action.customerId = :customerId', { customerId: filters.customerId });
    }

    return qb.orderBy('action.dueDate', 'ASC').getMany();
  }

  async getPendingActions(salespersonId: string): Promise<CrmAction[]> {
    return this.crmActionsRepository.find({
      where: {
        salespersonId,
        status: 'pending',
      },
      relations: ['customer'],
      order: { dueDate: 'ASC' },
    });
  }

  // Customer Tag Management
  async addCustomerTag(
    customerId: string,
    tagId: string,
    addedBy: string,
    notes?: string
  ): Promise<CustomerTag> {
    const tag = this.customerTagsRepository.create({
      customerId,
      tagId,
      addedBy,
      notes,
    });
    return this.customerTagsRepository.save(tag);
  }

  async removeCustomerTag(id: string): Promise<void> {
    await this.customerTagsRepository.delete(id);
  }

  async getCustomersByTag(tagId: string, requesterId?: string): Promise<any[]> {
    const user = requesterId ? await this.usersRepository.findOne({ where: { id: requesterId } }) : null;
    const queryBuilder = this.customerTagsRepository
      .createQueryBuilder('customerTag')
      .leftJoinAndSelect('customerTag.customer', 'customer')
      .leftJoinAndSelect('customerTag.tag', 'tag')
      .where('customerTag.tagId = :tagId', { tagId });

    if (user?.role === UserRole.SALESPERSON) {
      queryBuilder.andWhere('customerTag.addedBy = :sid', { sid: requesterId });
    } else if (user?.role === UserRole.CLINIC_OWNER) {
      const ownerships = await this.clinicOwnershipRepository.find({ where: { ownerUserId: requesterId } });
      const ownedClinicIds = ownerships.map(o => o.clinicId);
      if (ownedClinicIds.length > 0) {
        const clientIds = await this.appointmentsRepository.createQueryBuilder('apt')
          .select('DISTINCT apt.clientId', 'clientId')
          .where('apt.clinicId IN (:...ids)', { ids: ownedClinicIds })
          .getRawMany();
        const ids = clientIds.map(r => r.clientId);
        if (ids.length > 0) {
          queryBuilder.andWhere('customerTag.customerId IN (:...ids)', { ids });
        } else {
          return [];
        }
      } else {
        return [];
      }
    }

    const tags = await queryBuilder.getMany();
    return tags.map(t => ({
      customer: t.customer,
      tag: t.tag,
      notes: t.notes,
      addedAt: t.createdAt,
    }));
  }

  // Repeat Customer Management
  async identifyRepeatCustomers(requesterId?: string): Promise<any[]> {
    const user = requesterId ? await this.usersRepository.findOne({ where: { id: requesterId } }) : null;
    const qb = this.customerRecordsRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.customer', 'customer')
      .where('record.isRepeatCustomer = :isRepeat', { isRepeat: true });

    if (user?.role === UserRole.SALESPERSON) {
      qb.andWhere('record.assignedSalespersonId = :sid', { sid: requesterId });
    }

    if (user?.role === UserRole.CLINIC_OWNER) {
      const ownerships = await this.clinicOwnershipRepository.find({ where: { ownerUserId: requesterId } });
      const ownedClinicIds = ownerships.map(o => o.clinicId);
      if (ownedClinicIds.length === 0) return [];
      // Filter customers who had appointments in owned clinics
      const clientIds = await this.appointmentsRepository.createQueryBuilder('apt')
        .select('DISTINCT apt.clientId', 'clientId')
        .where('apt.clinicId IN (:...ids)', { ids: ownedClinicIds })
        .getRawMany();
      const ids = clientIds.map(r => r.clientId);
      if (ids.length === 0) return [];
      qb.andWhere('record.customerId IN (:...ids)', { ids });
    }

    return qb.orderBy('record.repeatCount', 'DESC').getMany();
  }

  async getCustomersDueForFollowUp(requesterId?: string, daysThreshold: number = 30): Promise<any[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    const queryBuilder = this.customerRecordsRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.customer', 'customer')
      .where('record.lastContactDate < :thresholdDate', { thresholdDate })
      .orWhere('record.lastContactDate IS NULL');

    if (requesterId) {
      const user = await this.usersRepository.findOne({ where: { id: requesterId } });
      if (user?.role === UserRole.SALESPERSON) {
        queryBuilder.andWhere('record.assignedSalespersonId = :sid', { sid: requesterId });
      } else if (user?.role === UserRole.CLINIC_OWNER) {
        const ownerships = await this.clinicOwnershipRepository.find({ where: { ownerUserId: requesterId } });
        const ownedClinicIds = ownerships.map(o => o.clinicId);
        if (ownedClinicIds.length === 0) return [];
        const clientIds = await this.appointmentsRepository.createQueryBuilder('apt')
          .select('DISTINCT apt.clientId', 'clientId')
          .where('apt.clinicId IN (:...ids)', { ids: ownedClinicIds })
          .getRawMany();
        const ids = clientIds.map(r => r.clientId);
        if (ids.length === 0) return [];
        queryBuilder.andWhere('record.customerId IN (:...ids)', { ids });
      }
    }

    return queryBuilder
      .orderBy('record.lastContactDate', 'ASC')
      .getMany();
  }

  // Analytics for Salesperson
  async getSalespersonAnalytics(salespersonId: string, dateRange?: { startDate: Date; endDate: Date }): Promise<any> {
    let communicationQuery = this.communicationLogsRepository
      .createQueryBuilder('log')
      .where('log.salespersonId = :salespersonId', { salespersonId });

    if (dateRange) {
      communicationQuery = communicationQuery.andWhere(
        'log.createdAt BETWEEN :startDate AND :endDate',
        dateRange
      );
    }

    const communicationStats = await communicationQuery
      .select([
        'COUNT(log.id) as totalCommunications',
        'COUNT(CASE WHEN log.type = \'call\' THEN 1 END) as totalCalls',
        'COUNT(CASE WHEN log.status = \'missed\' THEN 1 END) as missedCalls',
        'COUNT(CASE WHEN log.type = \'email\' THEN 1 END) as totalEmails',
      ])
      .getRawOne();

    const actionStats = await this.crmActionsRepository
      .createQueryBuilder('action')
      .where('action.salespersonId = :salespersonId', { salespersonId })
      .select([
        'COUNT(action.id) as totalActions',
        'COUNT(CASE WHEN action.status = \'pending\' THEN 1 END) as pendingActions',
        'COUNT(CASE WHEN action.status = \'completed\' THEN 1 END) as completedActions',
        'COUNT(CASE WHEN action.status = \'missed\' THEN 1 END) as missedActions',
      ])
      .getRawOne();

    const customerStats = await this.customerRecordsRepository
      .createQueryBuilder('record')
      .where('record.assignedSalespersonId = :salespersonId', { salespersonId })
      .select([
        'COUNT(record.id) as totalCustomers',
        'COUNT(CASE WHEN record.isRepeatCustomer = true THEN 1 END) as repeatCustomers',
        'SUM(record.lifetimeValue) as totalRevenue',
      ])
      .getRawOne();

    return {
      communicationStats,
      actionStats,
      customerStats,
    };
  }

  async testFacebookConnection(): Promise<{ success: boolean; message: string }> {
    return this.facebookService.testFacebookConnection();
  }

  // Manager analytics: aggregate KPIs across agents
  async getManagerAgentKpis(dateRange?: { startDate: Date; endDate: Date }): Promise<any> {
    // 1. Get communication statistics per agent
    let commQ = this.communicationLogsRepository
      .createQueryBuilder('log')
      .select('log.salespersonId', 'agentId')
      .addSelect('COUNT(log.id)', 'totalCommunications')
      .addSelect("COUNT(CASE WHEN log.type = 'call' AND (log.metadata->>'callOutcome') <> 'no_answer' THEN 1 END)", 'realCalls')
      .groupBy('log.salespersonId');

    if (dateRange) {
      commQ = commQ.where('log.createdAt BETWEEN :startDate AND :endDate', dateRange);
    }

    const commStats = await commQ.getRawMany();

    // 2. Get appointment statistics per agent (via CustomerRecord)
    let aptQ = this.appointmentsRepository
      .createQueryBuilder('apt')
      .innerJoin('customer_records', 'rec', 'rec.customerId = apt.clientId')
      .innerJoin('users', 'agent', 'agent.id = rec.assignedSalespersonId')
      .select('rec.assignedSalespersonId', 'agentId')
      .addSelect("CONCAT(agent.firstName, ' ', agent.lastName)", 'agentName')
      .addSelect('COUNT(apt.id)', 'totalAppointments')
      .addSelect("COUNT(CASE WHEN apt.status = 'completed' THEN 1 END)", 'completedAppointments')
      .addSelect("COUNT(CASE WHEN apt.status = 'no_show' THEN 1 END)", 'noShows')
      .addSelect("COUNT(CASE WHEN apt.status = 'cancelled' THEN 1 END)", 'cancellations')
      .addSelect('COALESCE(SUM(CASE WHEN apt.status = \'completed\' THEN apt.totalAmount ELSE 0 END), 0)', 'totalRevenue')
      .where('rec.assignedSalespersonId IS NOT NULL')
      .groupBy('rec.assignedSalespersonId, agent.firstName, agent.lastName');

    if (dateRange) {
      aptQ = aptQ.andWhere('apt.startTime BETWEEN :startDate AND :endDate', dateRange);
    }

    const aptStats = await aptQ.getRawMany();

    // 3. Merge communications and appointment stats
    const agentMap = new Map<string, any>();

    // Initialize with communication stats
    for (const comm of commStats) {
      agentMap.set(comm.agentId, {
        agentId: comm.agentId,
        totalCommunications: parseInt(comm.totalCommunications, 10) || 0,
        realCalls: parseInt(comm.realCalls, 10) || 0,
        totalAppointments: 0,
        completedAppointments: 0,
        noShows: 0,
        cancellations: 0,
        totalRevenue: 0,
      });
    }

    // Merge with appointment stats
    for (const apt of aptStats) {
      const existing = agentMap.get(apt.agentId) || {
        agentId: apt.agentId,
        totalCommunications: 0,
        realCalls: 0,
      };

      const completedAppointments = parseInt(apt.completedAppointments, 10) || 0;
      const totalAppointments = parseInt(apt.totalAppointments, 10) || 0;
      const totalRevenue = parseFloat(apt.totalRevenue) || 0;

      agentMap.set(apt.agentId, {
        ...existing,
        agentName: apt.agentName,
        totalAppointments,
        completedAppointments,
        noShows: parseInt(apt.noShows, 10) || 0,
        cancellations: parseInt(apt.cancellations, 10) || 0,
        totalRevenue,
        avgAppointmentValue: completedAppointments > 0 ? totalRevenue / completedAppointments : 0,
        conversionRate: totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0
      });
    }

    // For agents who have no name (only comm stats), try to fetch their names
    const finalResult = await Promise.all(Array.from(agentMap.values()).map(async (agent) => {
      if (!agent.agentName) {
        const user = await this.usersRepository.findOne({ where: { id: agent.agentId }, select: ['firstName', 'lastName'] });
        agent.agentName = user ? `${user.firstName} ${user.lastName}` : 'Unknown Agent';
      }
      return agent;
    }));

    return finalResult;
  }

  async getServiceStats(dateRange?: { startDate: Date; endDate: Date }): Promise<any[]> {
    let q = this.appointmentsRepository
      .createQueryBuilder('apt')
      .leftJoin('apt.service', 'service')
      .select('service.name', 'serviceName')
      .addSelect('COUNT(apt.id)', 'count')
      .addSelect('SUM(apt.totalAmount)', 'revenue')
      .groupBy('service.name');
    if (dateRange) {
      q = q.where('apt.startTime BETWEEN :startDate AND :endDate', dateRange);
    }
    return q.getRawMany();
  }

  async getClinicAnalytics(dateRange?: { startDate: Date; endDate: Date }): Promise<any[]> {
    let qb = this.appointmentsRepository
      .createQueryBuilder('apt')
      .leftJoin('apt.clinic', 'clinic')
      .select('clinic.id', 'clinicId')
      .addSelect('clinic.name', 'clinicName')
      .addSelect('COUNT(apt.id)', 'totalAppointments')
      .addSelect('COUNT(DISTINCT apt.clientId)', 'uniqueClients')
      .addSelect("COUNT(CASE WHEN apt.status = 'completed' THEN 1 END)", 'completed')
      .addSelect("COUNT(CASE WHEN apt.status = 'cancelled' THEN 1 END)", 'cancelled')
      .addSelect("COUNT(CASE WHEN apt.status = 'no_show' THEN 1 END)", 'noShow')
      .addSelect('COALESCE(SUM(apt.totalAmount), 0)', 'totalRevenue')
      .groupBy('clinic.id')
      .addGroupBy('clinic.name');
    if (dateRange) {
      qb = qb.where('apt.startTime BETWEEN :startDate AND :endDate', dateRange);
    }
    return qb.getRawMany();
  }

  async getCampaignPerformance(dateRange?: { startDate: Date; endDate: Date }): Promise<any[]> {
    const spendQ = this.adSpendLogsRepository
      .createQueryBuilder('s')
      .select('s.campaignId', 'campaignId')
      .addSelect('COALESCE(SUM(s.spend), 0)', 'totalSpend')
      .addSelect('COALESCE(SUM(s.clicks), 0)', 'clicks')
      .addSelect('COALESCE(SUM(s.impressions), 0)', 'impressions')
      .addSelect('COALESCE(SUM(s.leads), 0)', 'loggedLeads');
    if (dateRange) {
      spendQ.where('s.date BETWEEN :startDate AND :endDate', dateRange);
    }
    const spendRows = await spendQ.groupBy('s.campaignId').getRawMany();

    const campaigns = await this.adCampaignsRepository.createQueryBuilder('c').getMany();
    const campaignMap = new Map<string, AdCampaign>();
    for (const c of campaigns) campaignMap.set(c.id, c);

    const externalToCampaign = new Map<string, string>();
    for (const c of campaigns) externalToCampaign.set(c.externalId, c.id);

    let leadQ = this.leadsRepository
      .createQueryBuilder('l')
      .select('l.facebookCampaignId', 'externalId')
      .addSelect('COUNT(l.id)', 'leadCount');
    if (dateRange) {
      leadQ = leadQ.where('l.createdAt BETWEEN :startDate AND :endDate', dateRange);
    }
    const leadRows = await leadQ.groupBy('l.facebookCampaignId').getRawMany();

    let revQ = this.appointmentsRepository
      .createQueryBuilder('apt')
      .leftJoin('customer_records', 'cr', 'cr.customerId = apt.clientId')
      .select('cr.facebookCampaignId', 'externalId')
      .addSelect('COUNT(apt.id)', 'totalAppointments')
      .addSelect("COUNT(CASE WHEN apt.status = 'completed' THEN 1 END)", 'completedAppointments')
      .addSelect("COUNT(CASE WHEN apt.status = 'cancelled' THEN 1 END)", 'cancelledAppointments')
      .addSelect("COUNT(CASE WHEN apt.status = 'no_show' THEN 1 END)", 'noShowAppointments')
      .addSelect('COALESCE(SUM(apt.totalAmount), 0)', 'revenue');
    if (dateRange) {
      revQ = revQ.where('apt.startTime BETWEEN :startDate AND :endDate', dateRange);
    }
    const revRows = await revQ.groupBy('cr.facebookCampaignId').getRawMany();

    const byCampaign = new Map<string, any>();
    for (const s of spendRows) {
      byCampaign.set(s.campaignId, {
        campaignId: s.campaignId,
        totalSpend: Number(s.totalSpend) || 0,
        clicks: Number(s.clicks) || 0,
        impressions: Number(s.impressions) || 0,
        loggedLeads: Number(s.loggedLeads) || 0,
        leads: 0,
        totalAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        noShowAppointments: 0,
        revenue: 0,
      });
    }

    for (const l of leadRows) {
      const campaignId = externalToCampaign.get(l.externalId || '');
      if (!campaignId) continue;
      const curr = byCampaign.get(campaignId) || { campaignId };
      byCampaign.set(campaignId, { ...curr, leads: Number(l.leadCount) || 0 });
    }

    for (const r of revRows) {
      const campaignId = externalToCampaign.get(r.externalId || '');
      if (!campaignId) continue;
      const curr = byCampaign.get(campaignId) || { campaignId };
      byCampaign.set(campaignId, {
        ...curr,
        totalAppointments: Number(r.totalAppointments) || 0,
        completedAppointments: Number(r.completedAppointments) || 0,
        cancelledAppointments: Number(r.cancelledAppointments) || 0,
        noShowAppointments: Number(r.noShowAppointments) || 0,
        revenue: Number(r.revenue) || 0,
      });
    }

    const rows = Array.from(byCampaign.values()).map((row) => {
      const meta = campaignMap.get(row.campaignId);
      const roas = row.totalSpend > 0 ? Number((row.revenue / row.totalSpend).toFixed(2)) : 0;
      return {
        campaignId: row.campaignId,
        campaignName: meta?.name || '',
        ownerAgentId: meta?.ownerAgentId || null,
        platform: meta?.platform || null,
        totalSpend: row.totalSpend,
        clicks: row.clicks,
        impressions: row.impressions,
        loggedLeads: row.loggedLeads,
        leads: row.leads,
        totalAppointments: row.totalAppointments,
        completedAppointments: row.completedAppointments,
        cancelledAppointments: row.cancelledAppointments,
        noShowAppointments: row.noShowAppointments,
        revenue: row.revenue,
        roas,
      };
    });
    return rows;
  }

  async sendWeeklyAgentReports(): Promise<{ sent: number }> {
    // naive weekly window
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    const agents = await this.usersRepository.find({ where: { role: UserRole.SALESPERSON } });
    let sent = 0;
    for (const agent of agents) {
      const kpis = await this.getSalespersonAnalytics(agent.id, { startDate, endDate });
      await this.notificationsService.create(
        agent.id,
        NotificationType.EMAIL,
        'Weekly CRM Report',
        'Your weekly performance report is ready.',
        { kpis }
      );
      sent++;
    }
    return { sent };
  }

  async getAccessibleClinicsForUser(userId: string) {
    console.log("userId", userId)
    Logger.log("userId", userId)
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['clinics'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If user is admin or super admin, return all clinics
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return this.clinicsRepository.find();
    }

    // If user is clinic owner, get their clinics through clinic ownership
    if (user.role === UserRole.CLINIC_OWNER) {
      const ownerships = await this.clinicOwnershipRepository.find({
        where: { ownerUserId: userId },
        relations: ['clinic']
      });
      return ownerships.map(o => o.clinicId);
    }

    // If user is salesperson, return clinics they have access to
    if (user.role === UserRole.SALESPERSON) {
      const accesses = await this.agentClinicAccessRepository.find({
        where: { agentUserId: userId },
        relations: ['clinic']
      });

      // Since we don't have a direct relation in the entity, we need to fetch the clinics
      const clinicIds = accesses.map(access => access.clinicId);
      if (clinicIds.length === 0) return [];

      return this.clinicsRepository.find({
        where: { id: In(clinicIds) }
      });
    }

    // For other roles, return empty array
    return [];
  }

  // Agent Management Methods
  async getAgentEmails() {
    const agents = await this.usersRepository.find({
      where: { role: UserRole.SALESPERSON },
      select: ['id', 'firstName', 'lastName', 'email']
    });

    return agents.map(agent => ({
      agentId: agent.id,
      agentName: `${agent.firstName} ${agent.lastName}`,
      email: agent.email
    }));
  }

  async getAgentFormStats(dateRange?: { startDate: Date; endDate: Date }) {
    // Count leads by assigned salesperson
    let query = this.leadsRepository
      .createQueryBuilder('lead')
      .leftJoin('lead.assignedSales', 'agent')
      .select('agent.id', 'agentId')
      .addSelect("CONCAT(agent.firstName, ' ', agent.lastName)", 'agentName')
      .addSelect('COUNT(lead.id)', 'formsReceived')
      .where('agent.id IS NOT NULL');

    if (dateRange) {
      query = query.andWhere('lead.createdAt BETWEEN :startDate AND :endDate', dateRange);
    }

    query = query.groupBy('agent.id, agent.firstName, agent.lastName');

    const results = await query.getRawMany();
    return results.map(row => ({
      agentId: row.agentId,
      agentName: row.agentName,
      formsReceived: parseInt(row.formsReceived) || 0
    }));
  }

  async getAgentCommunicationStats(dateRange?: { startDate: Date; endDate: Date }) {
    let query = this.communicationLogsRepository
      .createQueryBuilder('log')
      .leftJoin('log.salesperson', 'agent')
      .select('log.salespersonId', 'agentId')
      .addSelect("CONCAT(agent.firstName, ' ', agent.lastName)", 'agentName')
      .addSelect('COUNT(log.id)', 'totalContacts')
      .addSelect("COUNT(CASE WHEN log.type = 'call' AND (log.metadata->>'callOutcome') <> 'no_answer' THEN 1 END)", 'realCommunications')
      .where('log.salespersonId IS NOT NULL');

    if (dateRange) {
      query = query.andWhere('log.createdAt BETWEEN :startDate AND :endDate', dateRange);
    }

    query = query.groupBy('log.salespersonId, agent.firstName, agent.lastName');

    const results = await query.getRawMany();
    return results.map(row => ({
      agentId: row.agentId,
      agentName: row.agentName,
      totalContacts: parseInt(row.totalContacts) || 0,
      realCommunications: parseInt(row.realCommunications) || 0
    }));
  }

  async getAgentAppointmentStats(dateRange?: { startDate: Date; endDate: Date }) {
    let query = this.appointmentsRepository
      .createQueryBuilder('apt')
      .leftJoin('apt.client', 'agent')
      .select('apt.clientId', 'agentId')
      .addSelect("CONCAT(agent.firstName, ' ', agent.lastName)", 'agentName')
      .addSelect('COUNT(apt.id)', 'booked')
      .addSelect("COUNT(CASE WHEN apt.status = 'completed' THEN 1 END)", 'attended')
      .addSelect("COUNT(CASE WHEN apt.status = 'completed' AND apt.treatmentDetails IS NOT NULL THEN 1 END)", 'treatmentsCompleted')
      .addSelect("COUNT(CASE WHEN apt.status = 'cancelled' THEN 1 END)", 'cancelled')
      .addSelect("COUNT(CASE WHEN apt.status = 'no_show' THEN 1 END)", 'noShows')
      .where('apt.clientId IS NOT NULL')
      .andWhere('agent.role = :role', { role: UserRole.SALESPERSON });

    if (dateRange) {
      query = query.andWhere('apt.startTime BETWEEN :startDate AND :endDate', dateRange);
    }

    query = query.groupBy('apt.clientId, agent.firstName, agent.lastName');

    const results = await query.getRawMany();
    return results.map(row => ({
      agentId: row.agentId,
      agentName: row.agentName,
      booked: parseInt(row.booked) || 0,
      attended: parseInt(row.attended) || 0,
      treatmentsCompleted: parseInt(row.treatmentsCompleted) || 0,
      cancelled: parseInt(row.cancelled) || 0,
      noShows: parseInt(row.noShows) || 0
    }));
  }

  async getAgentCashflow(dateRange?: { startDate: Date; endDate: Date }) {
    let query = this.appointmentsRepository
      .createQueryBuilder('apt')
      .leftJoin('apt.client', 'agent')
      .select('apt.clientId', 'agentId')
      .addSelect("CONCAT(agent.firstName, ' ', agent.lastName)", 'agentName')
      .addSelect('COALESCE(SUM(apt.totalAmount), 0)', 'revenue')
      .addSelect('COALESCE(SUM(CASE WHEN apt.status = \'cancelled\' AND apt.totalAmount > 0 THEN apt.totalAmount ELSE 0 END), 0)', 'refunds')
      .where('apt.clientId IS NOT NULL')
      .andWhere('agent.role = :role', { role: UserRole.SALESPERSON });

    if (dateRange) {
      query = query.andWhere('apt.startTime BETWEEN :startDate AND :endDate', dateRange);
    }

    query = query.groupBy('apt.clientId, agent.firstName, agent.lastName');

    const results = await query.getRawMany();
    return results.map(row => ({
      agentId: row.agentId,
      agentName: row.agentName,
      revenue: parseFloat(row.revenue) || 0,
      refunds: parseFloat(row.refunds) || 0,
      net: (parseFloat(row.revenue) || 0) - (parseFloat(row.refunds) || 0)
    }));
  }

  // Access Control Methods
  async getAccessMatrix() {
    const agents = await this.usersRepository.find({
      where: { role: UserRole.SALESPERSON },
      select: ['id', 'firstName', 'lastName']
    });

    const clinics = await this.clinicsRepository.find({
      select: ['id', 'name']
    });

    // Use raw query since AgentClinicAccess entity might not be registered
    const accessRecords = await this.usersRepository.query(
      `SELECT * FROM agent_clinic_access`
    );

    const result = agents.map(agent => {
      const agentAccess = accessRecords.filter(ar => ar.agentUserId === agent.id);
      const clinicAccess = clinics.map(clinic => {
        const access = agentAccess.find(aa => aa.clinicId === clinic.id);
        return {
          clinicId: clinic.id,
          clinicName: clinic.name,
          hasAccess: !!access,
          isPrivateToOwner: false // This would be determined by clinic ownership
        };
      });

      return {
        agentId: agent.id,
        agentName: `${agent.firstName} ${agent.lastName}`,
        clinics: clinicAccess
      };
    });

    return result;
  }

  async updateAgentAccess(agentId: string, clinicAccess: { clinicId: string; hasAccess: boolean }[]) {
    // Delete existing access records for this agent
    await this.usersRepository.query(
      `DELETE FROM agent_clinic_access WHERE agentUserId = $1`,
      [agentId]
    );

    // Create new access records for clinics that should have access
    for (const access of clinicAccess) {
      if (access.hasAccess) {
        await this.usersRepository.query(
          `INSERT INTO agent_clinic_access (agentUserId, clinicId) VALUES ($1, $2)`,
          [agentId, access.clinicId]
        );
      }
    }

    return { success: true };
  }

  // Client Benefits Methods
  async getClientBenefits(query: { search?: string; clinicId?: string }) {
    // This would typically query a client benefits table
    // For now, returning mock data based on customer records
    let qb = this.customerRecordsRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.customer', 'customer')
      .leftJoinAndSelect('record.assignedSalesperson', 'agent');

    if (query.search) {
      qb = qb.where('customer.firstName ILIKE :search OR customer.lastName ILIKE :search',
        { search: `%${query.search}%` });
    }

    if (query.clinicId) {
      // Filter by clinic through appointments
      const subQuery = this.appointmentsRepository
        .createQueryBuilder('apt')
        .select('apt.clientId')
        .where('apt.clinicId = :clinicId', { clinicId: query.clinicId });

      qb = qb.andWhere(`record.customerId IN (${subQuery.getQuery()})`);
    }

    const records = await qb.limit(50).getMany();

    return records.map(record => ({
      customerId: record.customerId,
      customerName: `${record.customer?.firstName || ''} ${record.customer?.lastName || ''}`.trim(),
      clinicName: 'Default Clinic', // Would be determined from appointments
      discount: record.preferences?.discount || null,
      gift: record.preferences?.gift || null,
      membership: record.preferences?.membership || null,
      lastUpdated: record.updatedAt
    }));
  }

  async updateClientBenefit(customerId: string, data: any) {
    const record = await this.customerRecordsRepository.findOne({
      where: { customerId }
    });

    if (!record) {
      throw new NotFoundException('Customer record not found');
    }

    // Update preferences with benefit information
    const preferences = record.preferences || {};
    Object.assign(preferences, data);
    record.preferences = preferences;

    await this.customerRecordsRepository.save(record);
    return record;
  }

  // No-Show Management Methods
  async getNoShowAlerts(query: { daysAgo?: number; status?: 'pending' | 'resolved' }) {
    const daysAgo = query.daysAgo || 7;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysAgo);

    let qb = this.appointmentsRepository
      .createQueryBuilder('apt')
      .leftJoin('apt.client', 'agent')
      .leftJoin('apt.clinic', 'clinic')
      .leftJoin('users', 'client', 'client.id = apt.clientId')
      .select('apt.id', 'appointmentId')
      .addSelect("CONCAT(agent.firstName, ' ', agent.lastName)", 'agentName')
      .addSelect('clinic.name', 'clinicName')
      .addSelect('apt.startTime', 'date')
      .addSelect('EXTRACT(DAY FROM CURRENT_DATE - apt.startTime)', 'daysAgo')
      .addSelect("CONCAT(COALESCE(client.firstName, ''), ' ', COALESCE(client.lastName, ''))", 'patientName')
      .where('apt.status = :status', { status: 'no_show' })
      .andWhere('apt.startTime >= :thresholdDate', { thresholdDate });

    // Note: Since Appointment doesn't have metadata field, we'll return all no-shows
    // In a real implementation, you might add a separate table for tracking no-show resolutions
    const results = await qb.getRawMany();
    return results.map(row => ({
      appointmentId: row.appointmentId,
      patientName: row.patientName?.trim() || 'Unknown',
      agentName: row.agentName,
      clinicName: row.clinicName,
      date: row.date.toISOString().split('T')[0],
      daysAgo: parseInt(row.daysAgo) || 0,
      actionRecommended: 'Call patient to reschedule'
    }));
  }

  async resolveNoShowAlert(appointmentId: string, actionTaken: string) {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id: appointmentId }
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Since Appointment doesn't have metadata, we'll update the notes field
    // In a real implementation, you might add a separate table for tracking no-show resolutions
    const resolutionNote = `No-show resolved on ${new Date().toISOString()}: ${actionTaken}`;
    appointment.notes = appointment.notes ? `${appointment.notes}\n${resolutionNote}` : resolutionNote;

    await this.appointmentsRepository.save(appointment);
    return { success: true };
  }

  // Additional Analytics Methods
  async getClinicReturnRates() {
    const clinics = await this.clinicsRepository.find({
      select: ['id', 'name']
    });

    const results = await Promise.all(
      clinics.map(async (clinic) => {
        // Get appointments in the last 30 and 90 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        // Get unique clients in the last 30 days
        const last30DaysClients = await this.appointmentsRepository
          .createQueryBuilder('apt')
          .select('DISTINCT apt.clientId')
          .where('apt.clinicId = :clinicId', { clinicId: clinic.id })
          .andWhere('apt.status = :status', { status: 'completed' })
          .andWhere('apt.startTime >= :date', { date: thirtyDaysAgo })
          .getRawMany();

        // Get unique clients in the last 90 days
        const last90DaysClients = await this.appointmentsRepository
          .createQueryBuilder('apt')
          .select('DISTINCT apt.clientId')
          .where('apt.clinicId = :clinicId', { clinicId: clinic.id })
          .andWhere('apt.status = :status', { status: 'completed' })
          .andWhere('apt.startTime >= :date', { date: ninetyDaysAgo })
          .getRawMany();

        // Get all unique clients who have ever visited
        const allTimeClients = await this.appointmentsRepository
          .createQueryBuilder('apt')
          .select('DISTINCT apt.clientId')
          .where('apt.clinicId = :clinicId', { clinicId: clinic.id })
          .andWhere('apt.status = :status', { status: 'completed' })
          .getRawMany();

        // Count repeat clients in last 30 days (clients who had more than one appointment)
        const repeatClients30 = await this.appointmentsRepository
          .createQueryBuilder('apt')
          .select('apt.clientId')
          .addSelect('COUNT(apt.id)', 'appointmentCount')
          .where('apt.clinicId = :clinicId', { clinicId: clinic.id })
          .andWhere('apt.status = :status', { status: 'completed' })
          .andWhere('apt.startTime >= :date', { date: thirtyDaysAgo })
          .groupBy('apt.clientId')
          .having('COUNT(apt.id) > 1')
          .getRawMany();

        const returnRate = allTimeClients.length > 0
          ? repeatClients30.length / allTimeClients.length
          : 0;

        return {
          clinicId: clinic.id,
          clinicName: clinic.name,
          returnRate: parseFloat(returnRate.toFixed(2)),
          last30Days: repeatClients30.length,
          last90Days: last90DaysClients.length
        };
      })
    );

    return results;
  }

  async getServicePerformance(dateRange?: { startDate: Date; endDate: Date }) {
    let query = this.appointmentsRepository
      .createQueryBuilder('apt')
      .leftJoin('apt.service', 'service')
      .select('service.id', 'serviceId')
      .addSelect('service.name', 'serviceName')
      .addSelect('COUNT(apt.id)', 'totalAppointments')
      .addSelect('COALESCE(SUM(apt.totalAmount), 0)', 'totalRevenue')
      .addSelect("COUNT(CASE WHEN apt.status = 'cancelled' THEN 1 END)", 'cancellations')
      .where('service.id IS NOT NULL');

    if (dateRange) {
      query = query.andWhere('apt.startTime BETWEEN :startDate AND :endDate', dateRange);
    }

    query = query.groupBy('service.id, service.name');

    const results = await query.getRawMany();
    return results.map(row => ({
      serviceId: row.serviceId,
      serviceName: row.serviceName,
      totalAppointments: parseInt(row.totalAppointments) || 0,
      totalRevenue: parseFloat(row.totalRevenue) || 0,
      cancellations: parseInt(row.cancellations) || 0
    }));
  }

  async getAdvertisementStats(dateRange?: { startDate: Date; endDate: Date }) {
    // Use raw query since AdSpendLog entity might not be registered
    let sql = `
      SELECT 
        campaign.id as "adId",
        COALESCE(campaign.channel, campaign.platform) as "channel",
        campaign.name as "campaignName",
        COALESCE(SUM(adLog.amount), 0) as "spent",
        COALESCE(CONCAT(agent."firstName", ' ', agent."lastName"), 'Unassigned') as "agentBudgetOwner"
      FROM ad_spend_logs adLog
      LEFT JOIN ad_campaigns campaign ON campaign.id = adLog."campaignId"
      LEFT JOIN users agent ON agent.id = campaign."ownerAgentId"
      WHERE campaign.id IS NOT NULL
    `;

    const params: any[] = [];

    if (dateRange) {
      sql += ` AND adLog.date BETWEEN $1 AND $2`;
      params.push(dateRange.startDate.toISOString().split('T')[0], dateRange.endDate.toISOString().split('T')[0]);
    }

    sql += ` GROUP BY campaign.id, campaign.channel, campaign.platform, campaign.name, agent."firstName", agent."lastName"`;

    const adResults = await this.usersRepository.query(sql, params);


    console.log(adResults);

    // Now get appointment attribution for each campaign
    const results = await Promise.all(
      adResults.map(async (row) => {
        // Get appointments attributed to this campaign
        const aptQuery = this.appointmentsRepository
          .createQueryBuilder('apt')
          .leftJoin('apt.client', 'client')
          .leftJoin('customer_records', 'cr', 'cr.customerId = client.id')
          .leftJoin('ad_attributions', 'aa', 'aa.customerRecordId = cr.id')
          .select('COUNT(apt.id)', 'patientsCame')
          .addSelect("COUNT(CASE WHEN apt.status = 'cancelled' THEN 1 END)", 'cancelled')
          .addSelect('COALESCE(SUM(apt.totalAmount), 0)', 'totalRevenue')
          .where('aa.campaignId = :campaignId', { campaignId: row.adId });

        if (dateRange) {
          aptQuery.andWhere('apt.startTime BETWEEN :startDate AND :endDate', dateRange);
        }

        const aptResults = await aptQuery.getRawOne();

        return {
          adId: row.adId,
          channel: row.channel || 'Unknown',
          campaignName: row.campaignName || 'Unknown Campaign',
          spent: parseFloat(row.spent) || 0,
          patientsCame: parseInt(aptResults?.patientsCame) || 0,
          cancelled: parseInt(aptResults?.cancelled) || 0,
          totalRevenue: parseFloat(aptResults?.totalRevenue) || 0,
          agentBudgetOwner: row.agentBudgetOwner || 'Unassigned'
        };
      })
    );

    return results;
  }
}