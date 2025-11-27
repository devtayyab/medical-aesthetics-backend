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
import { Clinic } from '../clinics/entities/clinic.entity';
import { AdCampaign } from './entities/ad-campaign.entity';
import { AdSpendLog } from './entities/ad-spend-log.entity';
import { UserRole } from '@/common/enums/user-role.enum';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { FacebookWebhookDto } from './dto/facebook-webhook.dto';
import { LeadStatus } from '../../common/enums/lead-status.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { TaskAutomationService } from './task-automation.service';
import { FacebookService, ParsedFacebookLead } from './facebook.service';
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
      qb.leftJoin('customer.clientAppointments', 'apt')
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
    console.log("dateRange" , dateRange)
    Logger.log("dateRange" , dateRange)
    // Total communications per agent (exclude no_answer)
    let commQ = this.communicationLogsRepository
      .createQueryBuilder('log')
      .select('log.salespersonId', 'salespersonId')
      .addSelect('COUNT(log.id)', 'totalCommunications')
      .addSelect("COUNT(CASE WHEN log.type = 'call' AND (log.metadata->>'callOutcome') <> 'no_answer' THEN 1 END)", 'realCalls')
      .groupBy('log.salespersonId');

    if (dateRange) {
      commQ = commQ.where('log.createdAt BETWEEN :startDate AND :endDate', dateRange);
    }

    const comm = await commQ.getRawMany();

    // Appointments outcome per agent (booked/attended/treatments/cancel/no-show)
    let aptQ = this.appointmentsRepository
      .createQueryBuilder('apt')
      .select('apt.clientId', 'salespersonId')
      .addSelect('COUNT(apt.id)', 'totalAppointments')
      .addSelect("COUNT(CASE WHEN apt.status = 'completed' THEN 1 END)", 'completed')
      .addSelect("COUNT(CASE WHEN apt.status = 'cancelled' THEN 1 END)", 'cancelled')
      .addSelect("COUNT(CASE WHEN apt.status = 'no_show' THEN 1 END)", 'noShow')
      .groupBy('apt.clientId');

    if (dateRange) {
      aptQ = aptQ.where('apt.startTime BETWEEN :startDate AND :endDate', dateRange);
    }

    const apts = await aptQ.getRawMany();

    // Merge
    const map = new Map<string, any>();
    for (const r of comm) map.set(r.salespersonId, { salespersonId: r.salespersonId, ...r });
    for (const r of apts) {
      const prev = map.get(r.salespersonId) || { salespersonId: r.salespersonId };
      map.set(r.salespersonId, { ...prev, ...r });
    }
    return Array.from(map.values());
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
    console.log("userId" , userId)
    Logger.log("userId" , userId)
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
}