import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Lead } from './entities/lead.entity';
import { CustomerRecord } from './entities/customer-record.entity';
import { CommunicationLog } from './entities/communication-log.entity';
import { CrmAction } from './entities/crm-action.entity';
import { CustomerTag } from './entities/customer-tag.entity';
import { FormSubmission } from './entities/form-submission.entity';
import { User } from '../users/entities/user.entity';
import { Appointment } from '../bookings/entities/appointment.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { FacebookWebhookDto } from './dto/facebook-webhook.dto';
import { LeadStatus } from '../../common/enums/lead-status.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../common/enums/notification-type.enum';

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

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
    @InjectRepository(FormSubmission)
    private formSubmissionsRepository: Repository<FormSubmission>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    private eventEmitter: EventEmitter2,
    private notificationsService: NotificationsService,
  ) {}

  async create(createLeadDto: CreateLeadDto): Promise<Lead> {
    const lead = this.leadsRepository.create(createLeadDto);
    const savedLead = await this.leadsRepository.save(lead);

    // Emit event for notifications and task creation
    this.eventEmitter.emit('lead.created', savedLead);

    return savedLead;
  }

  async findAll(filters: any = {}): Promise<Lead[]> {
    const queryBuilder = this.leadsRepository.createQueryBuilder('lead')
      .leftJoinAndSelect('lead.assignedSales', 'sales')
      .leftJoinAndSelect('lead.tags', 'tags');

    if (filters.status) {
      queryBuilder.where('lead.status = :status', { status: filters.status });
    }

    if (filters.assignedSalesId) {
      queryBuilder.andWhere('lead.assignedSalesId = :assignedSalesId', {
        assignedSalesId: filters.assignedSalesId,
      });
    }

    if (filters.source) {
      queryBuilder.andWhere('lead.source = :source', { source: filters.source });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(lead.firstName ILIKE :search OR lead.lastName ILIKE :search OR lead.email ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    return queryBuilder.getMany();
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

  // Customer Record Management
  async getCustomerRecord(customerId: string, salespersonId?: string): Promise<any> {
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
      summary: {
        totalAppointments: record.totalAppointments,
        completedAppointments: record.completedAppointments,
        lifetimeValue: record.lifetimeValue,
        lastAppointment: record.lastAppointmentDate,
        nextAppointment: record.nextAppointmentDate,
        isRepeatCustomer: record.isRepeatCustomer,
        repeatCount: record.repeatCount,
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
    salespersonId: string,
    filters?: { status?: string; priority?: string; customerId?: string }
  ): Promise<CrmAction[]> {
    const queryBuilder = this.crmActionsRepository
      .createQueryBuilder('action')
      .leftJoinAndSelect('action.customer', 'customer')
      .where('action.salespersonId = :salespersonId', { salespersonId });

    if (filters?.status) {
      queryBuilder.andWhere('action.status = :status', { status: filters.status });
    }

    if (filters?.priority) {
      queryBuilder.andWhere('action.priority = :priority', { priority: filters.priority });
    }

    if (filters?.customerId) {
      queryBuilder.andWhere('action.customerId = :customerId', { customerId: filters.customerId });
    }

    return queryBuilder.orderBy('action.dueDate', 'ASC').getMany();
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

  async getCustomersByTag(tagId: string, salespersonId?: string): Promise<any[]> {
    const queryBuilder = this.customerTagsRepository
      .createQueryBuilder('customerTag')
      .leftJoinAndSelect('customerTag.customer', 'customer')
      .leftJoinAndSelect('customerTag.tag', 'tag')
      .where('customerTag.tagId = :tagId', { tagId });

    if (salespersonId) {
      queryBuilder.andWhere('customerTag.addedBy = :salespersonId', { salespersonId });
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
  async identifyRepeatCustomers(salespersonId?: string): Promise<any[]> {
    const queryBuilder = this.customerRecordsRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.customer', 'customer')
      .where('record.isRepeatCustomer = :isRepeat', { isRepeat: true });

    if (salespersonId) {
      queryBuilder.andWhere('record.assignedSalespersonId = :salespersonId', { salespersonId });
    }

    return queryBuilder
      .orderBy('record.repeatCount', 'DESC')
      .getMany();
  }

  async getCustomersDueForFollowUp(salespersonId?: string, daysThreshold: number = 30): Promise<any[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    const queryBuilder = this.customerRecordsRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.customer', 'customer')
      .where('record.lastContactDate < :thresholdDate', { thresholdDate })
      .orWhere('record.lastContactDate IS NULL');

    if (salespersonId) {
      queryBuilder.andWhere('record.assignedSalespersonId = :salespersonId', { salespersonId });
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
      communications: {
        total: parseInt(communicationStats.totalCommunications) || 0,
        calls: parseInt(communicationStats.totalCalls) || 0,
        missedCalls: parseInt(communicationStats.missedCalls) || 0,
        emails: parseInt(communicationStats.totalEmails) || 0,
      },
      actions: {
        total: parseInt(actionStats.totalActions) || 0,
        pending: parseInt(actionStats.pendingActions) || 0,
        completed: parseInt(actionStats.completedActions) || 0,
        missed: parseInt(actionStats.missedActions) || 0,
      },
      customers: {
        total: parseInt(customerStats.totalCustomers) || 0,
        repeat: parseInt(customerStats.repeatCustomers) || 0,
        totalRevenue: parseFloat(customerStats.totalRevenue) || 0,
      },
    };
  }

  // ==================== FACEBOOK LEAD INTEGRATION ====================

  /**
   * Process Facebook lead webhook and handle duplicate detection
   */
  async processFacebookLead(webhookData: FacebookWebhookDto): Promise<any> {
    this.logger.log(`Processing Facebook lead: ${webhookData.leadgen_id}`);

    const { field_data, created_time, form_id, ad_id, page_id } = webhookData;
    
    // Extract contact info
    const email = field_data.email?.trim().toLowerCase();
    const phone = this.normalizePhone(field_data.phone_number);
    const firstName = field_data.first_name || field_data.full_name?.split(' ')[0] || 'Unknown';
    const lastName = field_data.last_name || field_data.full_name?.split(' ').slice(1).join(' ') || '';

    if (!email && !phone) {
      throw new Error('Lead must have either email or phone');
    }

    // Step 1: Check for duplicate by phone or email
    const duplicateResult = await this.findDuplicateCustomer(email, phone);

    let customerId: string;
    let leadId: string;
    let isDuplicate = false;
    let matchedBy: string;

    if (duplicateResult.found) {
      // DUPLICATE FOUND - Merge with existing customer
      this.logger.log(`Duplicate found! Matched by: ${duplicateResult.matchedBy}, Customer ID: ${duplicateResult.customerId}`);
      
      customerId = duplicateResult.customerId;
      isDuplicate = true;
      matchedBy = duplicateResult.matchedBy;

      // Update customer record with new form submission
      await this.updateCustomerRecord(customerId, {
        lastContactDate: new Date(),
      });

      // Create a note about the new form submission
      await this.logCommunication({
        customerId,
        salespersonId: null, // System-generated
        type: 'note',
        direction: 'incoming',
        status: 'completed',
        subject: `New Facebook form submission (${form_id})`,
        notes: `Customer submitted form again. Previous contact exists. Form data: ${JSON.stringify(field_data.custom_fields || {})}`,
        metadata: {
          source: 'facebook_webhook',
          leadgen_id: webhookData.leadgen_id,
          ad_id,
          page_id,
        },
      });

    } else {
      // NEW LEAD - Create new customer record
      this.logger.log('New lead - creating new record');

      // Create lead first
      const newLead = await this.create({
        source: 'facebook_ads',
        firstName,
        lastName,
        email,
        phone,
        status: LeadStatus.NEW,
        notes: `Submitted form ${form_id} at ${created_time}`,
        metadata: {
          leadgen_id: webhookData.leadgen_id,
          form_id,
          ad_id,
          page_id,
          custom_fields: field_data.custom_fields,
        },
      });

      leadId = newLead.id;

      // Try to find if a user already exists (registered client)
      const existingUser = await this.usersRepository.findOne({
        where: email ? { email } : { phone },
      });

      if (existingUser) {
        customerId = existingUser.id;
        // Create customer record if doesn't exist
        await this.createCustomerRecord(customerId);
      }
    }

    // Step 2: Save form submission record
    const formSubmission = this.formSubmissionsRepository.create({
      source: 'facebook_ads',
      formType: 'interest',
      mergedCustomerId: customerId,
      leadId,
      rawName: `${firstName} ${lastName}`.trim(),
      rawEmail: email,
      rawPhone: phone,
      formData: {
        ...field_data,
        form_id,
        ad_id,
        page_id,
        leadgen_id: webhookData.leadgen_id,
      },
      submittedAt: new Date(created_time),
      isDuplicate,
      duplicateMatchedBy: matchedBy,
    });

    await this.formSubmissionsRepository.save(formSubmission);

    // Step 3: Create task for salesperson (if customer has assigned salesperson)
    if (customerId) {
      const customerRecord = await this.customerRecordsRepository.findOne({
        where: { customerId },
      });

      if (customerRecord?.assignedSalespersonId) {
        await this.createAction({
          customerId,
          salespersonId: customerRecord.assignedSalespersonId,
          actionType: 'follow_up',
          title: isDuplicate ? 'Follow up - Repeat form submission' : 'Contact new Facebook lead',
          description: `${isDuplicate ? 'Customer submitted form again' : 'New lead from Facebook'}. Form: ${form_id}`,
          status: 'pending',
          priority: 'high',
          dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
          metadata: {
            formSubmissionId: formSubmission.id,
            source: 'facebook_webhook',
          },
        });
      }
    }

    return {
      success: true,
      isDuplicate,
      matchedBy,
      customerId,
      leadId,
      formSubmissionId: formSubmission.id,
      message: isDuplicate 
        ? `Duplicate found and merged with existing customer (matched by ${matchedBy})`
        : 'New lead created successfully',
    };
  }

  /**
   * Find duplicate customer by email or phone
   */
  private async findDuplicateCustomer(
    email: string,
    phone: string,
  ): Promise<{ found: boolean; customerId?: string; matchedBy?: string }> {
    // Search in Users table (registered clients)
    let user: User;

    if (email) {
      user = await this.usersRepository.findOne({ where: { email } });
      if (user) {
        return { found: true, customerId: user.id, matchedBy: 'email' };
      }
    }

    if (phone) {
      user = await this.usersRepository.findOne({ where: { phone } });
      if (user) {
        return { found: true, customerId: user.id, matchedBy: 'phone' };
      }
    }

    // Search in Leads table
    let lead: Lead;

    if (email && phone) {
      lead = await this.leadsRepository.findOne({
        where: [{ email }, { phone }],
      });
      if (lead) {
        // Check which field matched
        const matchedBy = lead.email === email && lead.phone === phone ? 'both' : 
                         lead.email === email ? 'email' : 'phone';
        // Convert lead to user if not already
        return { found: true, customerId: lead.id, matchedBy };
      }
    } else if (email) {
      lead = await this.leadsRepository.findOne({ where: { email } });
      if (lead) {
        return { found: true, customerId: lead.id, matchedBy: 'email' };
      }
    } else if (phone) {
      lead = await this.leadsRepository.findOne({ where: { phone } });
      if (lead) {
        return { found: true, customerId: lead.id, matchedBy: 'phone' };
      }
    }

    return { found: false };
  }

  /**
   * Normalize phone number for consistent comparison
   */
  private normalizePhone(phone: string): string {
    if (!phone) return null;
    // Remove all non-numeric characters except +
    return phone.replace(/[^0-9+]/g, '');
  }

  /**
   * Get all form submissions for a customer
   */
  async getCustomerFormSubmissions(customerId: string): Promise<FormSubmission[]> {
    return this.formSubmissionsRepository.find({
      where: { mergedCustomerId: customerId },
      order: { submittedAt: 'DESC' },
    });
  }

  /**
   * Get form submission statistics
   */
  async getFormSubmissionStats(filters?: { startDate?: Date; endDate?: Date; source?: string }): Promise<any> {
    const queryBuilder = this.formSubmissionsRepository.createQueryBuilder('submission');

    if (filters?.startDate && filters?.endDate) {
      queryBuilder.where('submission.submittedAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    if (filters?.source) {
      queryBuilder.andWhere('submission.source = :source', { source: filters.source });
    }

    const [total, duplicates] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder.andWhere('submission.isDuplicate = :isDuplicate', { isDuplicate: true }).getCount(),
    ]);

    return {
      total,
      duplicates,
      newLeads: total - duplicates,
      duplicateRate: total > 0 ? ((duplicates / total) * 100).toFixed(2) + '%' : '0%',
    };
  }
}