import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Lead } from './entities/lead.entity';
import { CustomerRecord } from './entities/customer-record.entity';
import { CommunicationLog } from './entities/communication-log.entity';
import { CrmAction } from './entities/crm-action.entity';
import { CustomerTag } from './entities/customer-tag.entity';
import { User } from '../users/entities/user.entity';
import { Appointment } from '../bookings/entities/appointment.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadStatus } from '../../common/enums/lead-status.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../common/enums/notification-type.enum';

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
}