import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, DataSource, IsNull, Not } from 'typeorm';
import { validate as isUuid } from 'uuid';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Lead } from './entities/lead.entity';
import { CustomerRecord } from './entities/customer-record.entity';
import { CommunicationLog } from './entities/communication-log.entity';
import { CrmAction } from './entities/crm-action.entity';
import { CustomerTag } from './entities/customer-tag.entity';
import { Tag } from '../admin/entities/tag.entity';
import { User } from '../users/entities/user.entity';
import { Appointment } from '../bookings/entities/appointment.entity';
import { AgentClinicAccess } from './entities/agent-clinic-access.entity';
import { ClinicOwnership } from './entities/clinic-ownership.entity';
import { AdCampaign } from './entities/ad-campaign.entity';
import { AdSpendLog } from './entities/ad-spend-log.entity';
import { AdAttribution } from './entities/ad-attribution.entity';
import { Clinic } from '../clinics/entities/clinic.entity';
import { LeadClinicStatus } from './entities/lead-clinic-status.entity';
import { UserRole } from '../../common/enums/user-role.enum';
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
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { Service } from '../clinics/entities/service.entity';
import { Task } from '../tasks/entities/task.entity';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class CrmService implements OnModuleInit {
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
    @InjectRepository(LeadClinicStatus)
    private leadClinicStatusesRepository: Repository<LeadClinicStatus>,
    private eventEmitter: EventEmitter2,
    private notificationsService: NotificationsService,
    private facebookService: FacebookService,
    private duplicateDetectionService: DuplicateDetectionService,
    private customerAffiliationService: CustomerAffiliationService,
    private mandatoryFieldValidationService: MandatoryFieldValidationService,
    private taskAutomationService: TaskAutomationService,
    private queueService: QueueService,
    @Inject(forwardRef(() => BookingsService))
    private bookingsService: BookingsService,
    private configService: ConfigService,
    private dataSource: DataSource,
  ) { }

  async onModuleInit() {
    // Automatically fix schema issue if migration failed or wasn't run
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      const checkResult = await queryRunner.query(`
        SELECT is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'crm_actions' AND column_name = 'customerId'
      `);

      if (checkResult && checkResult.length > 0 && checkResult[0].is_nullable === 'NO') {
        this.logger.warn('Detected NOT NULL constraint on crm_actions.customerId. Attempting to fix...');
        await queryRunner.query('ALTER TABLE "crm_actions" ALTER COLUMN "customerId" DROP NOT NULL');
        this.logger.log('Successfully altered crm_actions.customerId to be nullable.');
      }

      // Add treatmentRooms to clinics if missing
      const hasTreatmentRooms = await queryRunner.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'clinics' AND column_name = 'treatmentRooms'
      `);

      if (hasTreatmentRooms && hasTreatmentRooms.length === 0) {
        this.logger.warn('Detected missing treatmentRooms column in clinics table. Adding...');
        await queryRunner.query('ALTER TABLE "clinics" ADD COLUMN "treatmentRooms" integer DEFAULT 1');
        this.logger.log('Successfully added treatmentRooms column to clinics table.');
      }

      await queryRunner.release();
    } catch (err) {
      this.logger.error('Failed to auto-fix DB schema in CrmService', err);
    }
  }

  private async userHasAccessToCustomer(userId: string, customerId: string): Promise<boolean> {
    if (!userId) return false;
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return false;

    // Direct platform managers/admins have full access
    if ([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER].includes(user.role as UserRole)) {
      return true;
    }

    if (!user) return false;
    
    // Explicitly allow high-level roles
    if ([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER].includes(user.role)) {
      return true;
    }

    if (user.role === UserRole.SALESPERSON) {
      // First check if it's a lead
      const lead = await this.leadsRepository.findOne({ 
        where: { id: customerId },
        withDeleted: true 
      });
      if (lead) {
        return !lead.assignedSalesId || lead.assignedSalesId === userId;
      }

      const record = await this.customerRecordsRepository.findOne({
        where: [
          { customerId: customerId },
          { id: customerId }
        ]
      });
      return !record?.assignedSalespersonId || record?.assignedSalespersonId === userId;
    }

    if (user.role === UserRole.CLINIC_OWNER) {
      const ownerships = await this.clinicOwnershipRepository.find({ where: { ownerUserId: userId } });
      const ownedClinicIds = ownerships.map(o => o.clinicId);
      if (ownedClinicIds.length === 0) return false;

      // Check for appointments in owned clinics
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

    const { multiOwnerIds, clinicAffiliations, ...baseDto } = createLeadDto;
    const lead = this.leadsRepository.create(baseDto);
    const savedLead = await this.leadsRepository.save(lead);

    // Initial sync of relations
    await this.syncLeadRelations(savedLead.id, { multiOwnerIds, clinicAffiliations });

    const finalLead = await this.findById(savedLead.id);

    // Emit event for notifications and task creation
    this.eventEmitter.emit('lead.created', finalLead);

    return finalLead;
  }

  async bulkCreate(leads: CreateLeadDto[]): Promise<{ created: number; skipped: number; results: any[] }> {
    const results = [];
    let createdCount = 0;
    let skippedCount = 0;

    for (const leadDto of leads) {
      try {
        const lead = await this.create(leadDto);
        results.push({ status: 'success', email: leadDto.email, id: lead.id });
        createdCount++;
      } catch (error) {
        this.logger.error(`Failed to create lead for ${leadDto.email}: ${error.message}`);
        results.push({ status: 'error', email: leadDto.email, message: error.message });
        skippedCount++;
      }
    }

    return {
      created: createdCount,
      skipped: skippedCount,
      results,
    };
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

    const { multiOwnerIds, clinicAffiliations, ...baseUpdates } = updateLeadDto;

    // Apply base updates
    await this.leadsRepository.update(id, baseUpdates);

    // Sync complex relations if provided
    if (multiOwnerIds !== undefined || clinicAffiliations !== undefined) {
      await this.syncLeadRelations(id, { multiOwnerIds, clinicAffiliations });
    }

    return this.findById(id);
  }

  private async syncLeadRelations(
    leadId: string,
    data: { multiOwnerIds?: string[]; clinicAffiliations?: Array<{ clinicId: string; status: LeadStatus }> }
  ) {
    try {
      const lead = await this.leadsRepository.findOne({
        where: { id: leadId },
        relations: ['multiOwners', 'clinics', 'clinicStatuses']
      });

      if (!lead) return;

      // Handle Owners
      if (data.multiOwnerIds !== undefined) {
        if (data.multiOwnerIds.length > 0) {
          lead.multiOwners = await this.usersRepository.find({ where: { id: In(data.multiOwnerIds) } });
        } else {
          lead.multiOwners = [];
        }
      }

      // Handle Clinics and Statuses
      if (data.clinicAffiliations !== undefined) {
        const clinicIds = data.clinicAffiliations.map(a => a.clinicId);
        if (clinicIds.length > 0) {
          lead.clinics = await this.clinicsRepository.find({ where: { id: In(clinicIds) } });

          // Update clinic-specific statuses
          // Clear old ones
          await this.leadClinicStatusesRepository.delete({ leadId });

          // Create new ones
          const statuses = data.clinicAffiliations.map(aff => {
            return this.leadClinicStatusesRepository.create({
              leadId,
              clinicId: aff.clinicId,
              status: aff.status || lead.status
            });
          });
          await this.leadClinicStatusesRepository.save(statuses);
        } else {
          lead.clinics = [];
          await this.leadClinicStatusesRepository.delete({ leadId });
        }
      }

      await this.leadsRepository.save(lead);
    } catch (err) {
      // Gracefully skip if optional relation tables (lead_owners, lead_clinic_statuses, lead_clinics) do not exist yet in DB
      this.logger.warn(`[syncLeadRelations] Skipped relation sync for lead ${leadId} due to missing tables or error: ${err?.message}`);
    }
  }

  async scheduleRecurringAppointment(data: any): Promise<any> {
    console.log('🚀 [CrmService] scheduleRecurringAppointment request received');
    console.log('Payload Data:', JSON.stringify(data, null, 2));
    
    const { customerId, serviceId, frequency, clinicId, startDate, providerId } = data;

    // Descriptive check for required fields
    if (!customerId || !serviceId || !frequency || !clinicId) {
      const missing = [];
      if (!customerId) missing.push('customerId');
      if (!clinicId) missing.push('clinicId');
      if (!serviceId) missing.push('serviceId');
      if (!frequency) missing.push('frequency');
      
      console.error('❌ [CrmService] Validation failed. Missing:', missing.join(', '));
      throw new BadRequestException(`Missing required fields: ${missing.join(', ')}`);
    }

    try {
      // 1. Validate Customer
      console.log(`[CrmService] 1. Looking up customer: ${customerId}`);
      const customer = await this.usersRepository.findOne({ where: { id: customerId } });
      if (!customer) {
        console.error(`❌ [CrmService] Customer not found: ${customerId}`);
        throw new NotFoundException(`Customer not found with ID: ${customerId}`);
      }

      // 2. Resolve CustomerRecord
      console.log('[CrmService] 2. Resolving customer record');
      let record = await this.customerRecordsRepository.findOne({ where: { customerId } });
      if (!record) {
        console.log('[CrmService] No record found, creating new one');
        record = await this.createCustomerRecord(customerId);
      }

      // 3. Create First Appointment
      if (startDate) {
        console.log(`[CrmService] 3. Creating first appointment at ${startDate} for staff ${providerId || 'unassigned'}`);
        const start = new Date(startDate);
        const end = new Date(start.getTime() + 60 * 60 * 1000);

        if (!customer.phone) {
             console.error('❌ [CrmService] Phone number missing for recurring sequence');
             throw new BadRequestException('Customer must have a phone number to schedule appointments.');
        }

        try {
          await this.bookingsService.createAppointment({
            clientId: customerId,
            clinicId: clinicId,
            serviceId: serviceId,
            providerId: providerId || undefined,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            status: AppointmentStatus.CONFIRMED,
            paymentMethod: 'cash',
            appointmentSource: 'platform_broker',
            clientDetails: {
                fullName: `${customer.firstName} ${customer.lastName}`,
                email: customer.email,
                phone: customer.phone
            }
          });
          console.log('[CrmService] First appointment created successfully');
        } catch (bookingError) {
          console.error('❌ [CrmService] BookingsService.createAppointment failed:', bookingError);
          // Preserve the original error (like ConflictException) if it already has a status
          if (bookingError.status && bookingError.status >= 400) {
              throw bookingError;
          }
          throw new BadRequestException(`Failed to create the first appointment: ${bookingError.message}`);
        }
      }

      // 4. Queue Repetitions
      console.log('[CrmService] 4. Scheduling future repetitions in background queue');
      await this.queueService.scheduleRecurringAppointments(
        serviceId,
        frequency,
        customerId,
        clinicId,
        providerId,
      );

      console.log('✅ [CrmService] Recurring sequence scheduled successfully');
      return {
        success: true,
        message: `Recurring sequence started. First appointment created and future sessions scheduled.`,
      };
    } catch (error) {
      console.error('❌ [CrmService] CRITICAL ERROR in scheduleRecurringAppointment:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'An unexpected error occurred while scheduling recurring appointments');
    }
  }

  async verifyWebhook(mode: string, verifyToken: string, challenge: string): Promise<string> {
    const WEBHOOK_VERIFY_TOKEN = this.configService.get<string>('FACEBOOK_WEBHOOK_VERIFY_TOKEN') || 'my_secure_verify_token';

    this.logger.log(`Received Webhook Verification Request: Mode=${mode}, Token=${verifyToken}`);

    if (mode === 'subscribe' && verifyToken === WEBHOOK_VERIFY_TOKEN) {
      this.logger.log('Webhook verified successfully');
      return challenge;
    }

    this.logger.warn(`Webhook verification failed. Expected '${WEBHOOK_VERIFY_TOKEN}', got '${verifyToken}'`);
    throw new ForbiddenException('Invalid verify token');
  }

  validateFacebookSignature(signature: string, payload: any): boolean {
    return this.facebookService.validateSignature(signature, payload);
  }

  async handleFacebookWebhook(webhookData: FacebookWebhookDto): Promise<void> {
    for (const entry of webhookData.entry) {
      for (const change of entry.changes) {
        if (change.field !== 'leadgen') continue;

        const leadgenId = change.value.leadgen_id;
        if (!leadgenId) continue;

        try {
          // Get full lead data from Facebook using the lead ID from the webhook
          const leadData = await this.facebookService.getLead(leadgenId);
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
          console.error(`Error processing Facebook lead ${leadgenId}:`, error);
          this.eventEmitter.emit('audit.log', {
            action: 'META_INGESTION_ERROR',
            resource: 'leads',
            resourceId: leadgenId,
            data: { error: error.message, leadgen_id: leadgenId },
          });
        }
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
      lastMetaFormSubmittedAt: leadDto.lastMetaFormSubmittedAt,
      lastMetaFormName: leadDto.lastMetaFormName,
      lastContactedAt: new Date(),
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

    // We must also update the Lead entity if there's an existing one to update the meta form details,
    // or just rely on the new lead logic. Ah, wait. Over here we are merging with a User (Existing Customer).
    // The Lead table needs to be updated. Since it's a Customer, maybe there is a Lead associated?
    // Let's find an existing lead for this customer.
    const existingLead = await this.leadsRepository.findOne({ where: { email: existingCustomer.email } });
    if (existingLead) {
      await this.leadsRepository.update(existingLead.id, {
        lastMetaFormSubmittedAt: leadData.created_time ? new Date(leadData.created_time) : new Date(),
        lastMetaFormName: parsedLead.facebookFormId ? `Facebook Form ${parsedLead.facebookFormId}` : 'Unknown Facebook Form',
        lastContactedAt: new Date(),
      });
    }

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
    // Extract Facebook Ad Name from form fields if available (multiple-choice answer rule)
    const facebookAdNameField = parsedLead.facebookLeadData?.field_data?.find(
      (f: any) => f.name.toLowerCase().includes('ad_name') || f.name.toLowerCase().includes('campaign')
    );
    const facebookAdName = facebookAdNameField ? facebookAdNameField.values[0] : 'Unknown Ad';

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
      facebookAdName: facebookAdName, // Direct column
      status: LeadStatus.NEW,
      metadata: {
        importedFromFacebook: true,
        importDate: new Date(),
        facebookAdName: facebookAdName, // Sourced from form submission as requested
      },
      lastMetaFormSubmittedAt: leadData.created_time ? new Date(leadData.created_time) : new Date(),
      lastMetaFormName: parsedLead.facebookFormId ? `Facebook Form ${parsedLead.facebookFormId}` : 'Unknown Facebook Form',
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
    try {
      return await this.taskAutomationService.getOverdueTasks(salespersonId);
    } catch (error) {
      this.logger.error(`Error in getOverdueTasks: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAutomationRules() {
    return this.taskAutomationService.getAutomationRules();
  }

  async runTaskAutomationCheck() {
    return this.taskAutomationService.runTaskAutomationCheck();
  }

  async runTaskRemindersOnly(): Promise<number> {
    return this.taskAutomationService.sendTaskReminders();
  }

  async findAll(filters: any = {}): Promise<Lead[]> {
    const qb = this.leadsRepository.createQueryBuilder('lead')
      .leftJoinAndSelect('lead.assignedSales', 'sales')
      .leftJoinAndSelect('lead.tags', 'tags');

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        qb.andWhere('lead.status IN (:...status)', { status: filters.status });
      } else {
        qb.andWhere('lead.status = :status', { status: filters.status });
      }
    }

    if (filters.source) {
      qb.andWhere('lead.source = :source', { source: filters.source });
    }

    if (filters.search) {
      qb.andWhere(
        '(lead.firstName ILIKE :search OR lead.lastName ILIKE :search OR lead.email ILIKE :search OR lead.phone ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Advanced Filters
    if (filters.formNames) {
      const formNamesArray = Array.isArray(filters.formNames) ? filters.formNames : [filters.formNames];
      qb.andWhere('lead.lastMetaFormName IN (:...formNames)', { formNames: formNamesArray });
    }

    if (filters.submissionDateFrom) {
      qb.andWhere('CAST(lead.lastMetaFormSubmittedAt AS DATE) >= :submissionDateFrom', { submissionDateFrom: filters.submissionDateFrom });
    }
    if (filters.submissionDateTo) {
      qb.andWhere('CAST(lead.lastMetaFormSubmittedAt AS DATE) <= :submissionDateTo', { submissionDateTo: filters.submissionDateTo });
    }

    if (filters.lastContactedFrom) {
      qb.andWhere('CAST(lead.lastContactedAt AS DATE) >= :lastContactedFrom', { lastContactedFrom: filters.lastContactedFrom });
    }
    if (filters.lastContactedTo) {
      qb.andWhere('CAST(lead.lastContactedAt AS DATE) <= :lastContactedTo', { lastContactedTo: filters.lastContactedTo });
    }

    // ACL: if requester is salesperson, only show leads assigned to them
    if (filters._requesterId) {
      const user = await this.usersRepository.findOne({ where: { id: filters._requesterId } });
      if (user?.role === UserRole.SALESPERSON) {
        qb.andWhere('lead.assignedSalesId = :sid', { sid: filters._requesterId });
      }
      // For clinic owners, leave as-is for now (leads may not be linked to clinics). Future: relate leads to clinic and filter.
    }

    // Default Sorting
    qb.orderBy('lead.lastMetaFormSubmittedAt', 'DESC', 'NULLS LAST');
    qb.addOrderBy('lead.createdAt', 'DESC');

    return qb.getMany();
  }

  async getLead(id: string): Promise<Lead> {
    return this.findById(id);
  }

  async findById(id: string): Promise<Lead> {
    try {
      if (!id || !isUuid(id)) {
        this.logger.warn(`[findById] Invalid UUID format received: "${id}"`);
        throw new BadRequestException(`Invalid Lead ID format: "${id}"`);
      }

      const lead = await this.leadsRepository.findOne({
        where: { id },
        relations: ['assignedSales', 'tags', 'tasks', 'multiOwners', 'clinics', 'clinicStatuses', 'clinicStatuses.clinic'],
      });

      if (!lead) {
        this.logger.warn(`[findById] Lead ${id} not found in database`);
        throw new NotFoundException('Lead not found');
      }

      return lead;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`[findById] Unexpected error fetching lead ${id}: ${error.message}`, error.stack);
      throw new BadRequestException(`Error fetching lead details: ${error.message}`);
    }
  }


  async findUserByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
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

  /**
   * Helper to resolve an ID that could be a User ID, a CustomerRecord ID, or a Lead ID.
   * Returns the resolved User ID (if customer) or the original ID if it's a lead.
   */
  private async resolveEntityIds(id: string): Promise<{ userId?: string; leadId?: string; type: 'customer' | 'lead' | 'unknown' }> {
    if (!id || !isUuid(id)) return { type: 'unknown' };

    // 1. Check if it's a direct User ID
    const user = await this.usersRepository.findOne({ 
      where: { id },
      withDeleted: true 
    });
    if (user) return { userId: id, type: 'customer' };

    // 2. Check if it's a CustomerRecord ID
    const record = await this.customerRecordsRepository.findOne({ 
      where: { id },
      withDeleted: true 
    });
    if (record) return { userId: record.customerId, type: 'customer' };

    // 3. Check if it's a Lead ID
    const lead = await this.leadsRepository.findOne({ 
      where: { id },
      withDeleted: true 
    });
    if (lead) return { leadId: id, id, type: 'lead' } as any;

    return { type: 'unknown' };
  }

  // Customer Record Management
  async getCustomerRecord(customerId: string, salespersonId?: string): Promise<any> {
    // 0. Validate UUID format to avoid DB crashes
    if (!isUuid(customerId)) {
      throw new NotFoundException('Invalid Customer or Lead ID format');
    }

    const resolved = await this.resolveEntityIds(customerId);

    if (resolved.type === 'unknown') {
      throw new NotFoundException('Customer or Lead not found');
    }

    if (resolved.type === 'lead') {
      const lead = await this.leadsRepository.findOne({
        where: { id: resolved.leadId },
        relations: ['assignedSales', 'tags']
      });

      if (!lead) {
        throw new NotFoundException('Customer or Lead not found');
      }

      const linkedCustomerId = (lead.metadata as any)?.convertedToCustomerId;
      const idMatchList = [lead.id];
      if (linkedCustomerId) {
        idMatchList.push(linkedCustomerId);
        // Also add the CustomerRecord ID if it exists to catch post-conversion actions
        const record = await this.customerRecordsRepository.findOne({ where: { customerId: linkedCustomerId } });
        if (record) idMatchList.push(record.id);
      }

      const leadAppointments = await this.appointmentsRepository.createQueryBuilder('apt')
        .leftJoinAndSelect('apt.service', 'service')
        .leftJoinAndSelect('service.treatment', 'treatment')
        .leftJoinAndSelect('apt.clinic', 'clinic')
        .where('apt.clientId IN (:...ids)', { ids: idMatchList })
        .orWhere("LOWER(apt.\"clientDetails\"->>'email') = LOWER(:email)", { email: lead.email })
        .orWhere("apt.\"clientDetails\"->>'phone' = :phone", { phone: lead.phone })
        .orderBy('apt.startTime', 'DESC')
        .getMany();

      const compApts = leadAppointments.filter(a => a.status === AppointmentStatus.COMPLETED);
      const ltv = compApts.reduce((sum, apt) => sum + Number(apt.totalAmount || 0), 0);
      const isRepeat = compApts.length > 1;

      // Return synthetic record for Lead
      return {
        record: {
          id: 'lead-' + lead.id,
          customerId: lead.id,
          customerStatus: lead.status, // Map lead status to customer status
          customer: {
            id: lead.id,
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email,
            phone: lead.phone,
            role: 'lead', // Virtual role
          },
          assignedSalespersonId: lead.assignedSalesId,
          assignedSalesperson: lead.assignedSales,
          lifetimeValue: ltv,
          totalAppointments: leadAppointments.length,
          completedAppointments: compApts.length,
          isRepeatCustomer: isRepeat,
          notes: lead.notes,
          source: lead.source,
          metadata: lead.metadata,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
          tags: lead.tags || [],
        },
        appointments: leadAppointments.map(apt => ({
          id: apt.id,
          serviceName: apt.service?.treatment?.name,
          clinicName: apt.clinic?.name,
          startTime: apt.startTime,
          status: apt.status,
          totalAmount: apt.totalAmount,
          treatmentDetails: apt.treatmentDetails,
        })),
        communications: [
          ...(await this.communicationLogsRepository.find({
            where: { customerId: In(idMatchList) },
            relations: ['salesperson'],
            order: { createdAt: 'DESC' },
            take: 50,
          })),
          ...((lead.metadata as any)?.interactionHistory || [])
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50),
        actions: await this.crmActionsRepository.find({
          where: [
            { customerId: In(idMatchList) },
            { relatedLeadId: In(idMatchList) },
          ],
          relations: ['salesperson'],
          order: { createdAt: 'DESC' },
        }),
        tags: (lead.tags || []).map(t => ({
          id: t.id,
          tag: t, // Assuming tag relation is properly loaded or mapped
          addedBy: null,
          createdAt: new Date()
        })),
        affiliations: {
          clinics: [],
          doctors: [],
          preferredClinic: null,
          preferredDoctor: null,
        },
        summary: {
          type: 'lead', // Frontend can use this to show specific badges
          status: lead.status,
          totalAppointments: leadAppointments.length,
          completedAppointments: compApts.length,
          lifetimeValue: ltv,
          repeatCount: isRepeat ? compApts.length : 0,
        }
      };
    }

    const resolvedUserId = resolved.userId;

    // Existing logic for real Customers
    let record = await this.customerRecordsRepository.findOne({
      where: [
        { customerId: resolvedUserId },
        { id: customerId } // Handle if record ID was passed
      ],
      relations: ['customer', 'assignedSalesperson', 'communications', 'actions', 'tags'],
    });

    if (record && salespersonId) {
      const access = await this.userHasAccessToCustomer(salespersonId, resolvedUserId);
      if (!access) {
        throw new NotFoundException('Customer not found (Access Denied)');
      }
    }

    if (!record) {
      // User exists (checked above), ensure record exists
      record = await this.createCustomerRecord(resolvedUserId, salespersonId);
      // Reload with relations
      record = await this.customerRecordsRepository.findOne({
        where: { customerId: resolvedUserId },
        relations: ['customer', 'assignedSalesperson', 'communications', 'actions', 'tags'],
      });
    }

    // Get appointments - include any booked while they were a lead
    const originalLead = await this.leadsRepository.createQueryBuilder('lead')
      .where("lead.metadata->>'convertedToCustomerId' = :resolvedUserId", { resolvedUserId })
      .getOne();

    const idMatchList = [resolvedUserId, record.id];
    if (originalLead) idMatchList.push(originalLead.id);

    const appointments = await this.appointmentsRepository.createQueryBuilder('apt')
      .leftJoinAndSelect('apt.service', 'service')
      .leftJoinAndSelect('service.treatment', 'treatment')
      .leftJoinAndSelect('apt.clinic', 'clinic')
      .where('apt.clientId IN (:...ids)', { ids: idMatchList })
      .orWhere("LOWER(apt.\"clientDetails\"->>'email') = LOWER(:email)", { email: record.customer?.email })
      .orWhere("apt.\"clientDetails\"->>'phone' = :phone", { phone: record.customer?.phone })
      .orderBy('apt.startTime', 'DESC')
      .getMany();

    // Get communication history - merge database logs and legacy metadata logs
    const dbLogs = await this.communicationLogsRepository.find({
      where: { customerId: In(idMatchList) },
      relations: ['salesperson'],
      order: { createdAt: 'DESC' },
      take: 50,
    });

    const metadataLogs = originalLead ? ((originalLead.metadata as any)?.interactionHistory || []) : [];

    const communications = [...dbLogs, ...metadataLogs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);

    this.logger.log(`[getCustomerRecord] resolvedUserId: ${resolvedUserId}, dbLogs: ${dbLogs.length}, metadataLogs: ${metadataLogs.length}, total: ${communications.length}`);

    // Get actions/tasks - include anything created while they were a lead
    const actions = await this.crmActionsRepository.find({
      where: [
        { customerId: In(idMatchList) },
        { relatedLeadId: In(idMatchList) },
      ],
      relations: ['salesperson'],
      order: { createdAt: 'DESC' },
    });

    // Get tags
    const tags = await this.customerTagsRepository.find({
      where: { customerId: resolvedUserId },
      relations: ['tag', 'addedByUser'],
    });

    // Get clinic and doctor affiliations
    const clinicAffiliations = await this.customerAffiliationService.getClinicAffiliations(resolvedUserId);
    const doctorAffiliations = await this.customerAffiliationService.getDoctorAffiliations(resolvedUserId);
    const preferredClinic = await this.customerAffiliationService.getPreferredClinic(resolvedUserId);
    const preferredDoctor = await this.customerAffiliationService.getPreferredDoctor(resolvedUserId);

    return {
      record,
      appointments: appointments.map(apt => ({
        id: apt.id,
        serviceName: apt.service?.treatment?.name,
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
    try {
      const record = this.customerRecordsRepository.create({
        customerId,
        assignedSalespersonId: salespersonId,
      });
      return await this.customerRecordsRepository.save(record);
    } catch (error) {
      if (error.code === '23505') { // PostgreSQL unique_violation
        return await this.customerRecordsRepository.findOne({ where: { customerId } });
      }
      throw error;
    }
  }

  async createCustomer(data: any, salespersonId?: string): Promise<{ user: User; password: string }> {
    // Check if user already exists
    const whereConditions: any[] = [{ email: data.email }];
    if (data.phone) {
      whereConditions.push({ phone: data.phone });
    }

    const existingUser = await this.usersRepository.findOne({
      where: whereConditions,
    });

    if (existingUser) {
      throw new BadRequestException('Customer with this email or phone already exists');
    }

    const password = Math.random().toString(36).slice(-10); // Random temporary password
    const newUser = this.usersRepository.create({
      ...data,
      role: UserRole.CLIENT,
      isActive: true,
      passwordHash: password,
    } as Partial<User>);

    const savedUser = await this.usersRepository.save(newUser);

    // Create customer record
    await this.createCustomerRecord(savedUser.id, salespersonId);

    return { user: savedUser, password };
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
    const resolved = await this.resolveEntityIds(customerId);
    const resolvedUserId = resolved.type === 'customer' ? resolved.userId : customerId;

    let record = await this.customerRecordsRepository.findOne({
      where: [
        { customerId: resolvedUserId },
        { id: customerId }
      ]
    });

    if (!record) {
      if (resolved.type !== 'customer') {
        throw new BadRequestException('Cannot update record for a lead as customer record doesn\'t exist');
      }
      record = await this.createCustomerRecord(resolvedUserId);
    }

    Object.assign(record, updateData);
    return this.customerRecordsRepository.save(record);
  }

  // Communication Log Management
  async logCommunication(data: Partial<CommunicationLog>): Promise<CommunicationLog> {
    // Sanitize IDs from frontend to avoid UUID syntax errors
    if (data.customerId === '' || data.customerId === 'undefined') data.customerId = null;
    if (data.relatedLeadId === '' || data.relatedLeadId === 'undefined') data.relatedLeadId = null;

    const inputId = data.customerId || data.relatedLeadId;
    if (!inputId) {
      throw new BadRequestException('Either customerId or relatedLeadId must be provided');
    }

    const resolved = await this.resolveEntityIds(inputId);
    let lead = null;

    if (resolved.type === 'lead') {
      lead = await this.leadsRepository.findOne({ where: { id: resolved.leadId } });
      data.relatedLeadId = resolved.leadId;
      data.customerId = null;
    } else if (resolved.type === 'customer') {
      data.customerId = resolved.userId;
      data.relatedLeadId = null;
    }

    if (lead) {
      // Append to Lead notes instead of ONLY metadata
      const newNote = `[${data.type?.toUpperCase()} - ${new Date().toISOString()}] ${data.subject || ''}: ${data.notes || ''}`;
      const updatedNotes = lead.notes ? `${lead.notes}\n\n${newNote}` : newNote;

      // Store structured history in metadata array (legacy support)
      const currentHistory = (lead.metadata as any)?.interactionHistory || [];
      const newInteraction = {
        id: `lead-log-${Date.now()}`,
        ...data,
        createdAt: new Date(),
        metadata: data.metadata || {}
      };
      const updatedHistory = [newInteraction, ...currentHistory];

      await this.leadsRepository.update(lead.id, {
        notes: updatedNotes,
        lastContactedAt: new Date(),
        metadata: {
          ...lead.metadata || {},
          lastInteraction: data,
          interactionHistory: updatedHistory
        }
      });

      // Move Lead ID to relatedLeadId and clear customerId (User ID) to avoid FK issues
      data.relatedLeadId = lead.id;
      data.customerId = null;
    }

    // Enforce mandatory field validation for call communications, except click-only logs
    if (data.type === 'call' && !(data.metadata && (data.metadata as any).clickOnly === true)) {
      await this.mandatoryFieldValidationService.enforceFieldCompletion(inputId, data);
    }

    // If durationSeconds is provided but not part of schema, ensure it's in metadata
    if (data.durationSeconds && !data.metadata?.durationSeconds) {
      data.metadata = { ...data.metadata, durationSeconds: data.durationSeconds };
    }

    // Ensure subject and type are not empty to avoid DB errors
    if (!data.type) {
      data.type = 'note';
    }

    if (!data.subject) {
      const typeStr = String(data.type);
      data.subject = `${typeStr.charAt(0).toUpperCase() + typeStr.slice(1)} Log - ${new Date().toLocaleDateString()}`;
    }

    const log = this.communicationLogsRepository.create(data);
    const savedLog = await this.communicationLogsRepository.save(log);

    // Update last contact date based on specific rules
    const CONTACT_TYPES = ['call', 'viber', 'email'];
    const isContactAttempt = CONTACT_TYPES.includes(data.type || '') ||
      (data.type === 'note' && (data.metadata as any)?.isContactAttempt === true);

    if (isContactAttempt) {
      if (lead) {
        await this.leadsRepository.update(lead.id, {
          lastContactedAt: new Date(),
        });
      } else {
        await this.updateCustomerRecord(inputId, {
          lastContactDate: new Date(),
        });
      }
    }

    // Emit event for notifications
    this.eventEmitter.emit('communication.logged', savedLog);

    return savedLog;
  }

  async getCommunicationHistory(
    customerId: string,
    filters?: { type?: string; startDate?: Date; endDate?: Date }
  ): Promise<CommunicationLog[]> {
    try {
      // Enforce ACL when requester provided
      const anyFilters: any = filters || {};
      if (anyFilters._requesterId) {
        const allowed = await this.userHasAccessToCustomer(anyFilters._requesterId, customerId);
        if (!allowed) {
          throw new NotFoundException('Customer not found');
        }
      }

      // Check for linked lead/customer IDs
      let originalLead = await this.leadsRepository.findOne({ where: { id: customerId } });

      if (!originalLead) {
        try {
          originalLead = await this.leadsRepository.createQueryBuilder('lead')
            .where("lead.metadata @> :convertedJson", {
              convertedJson: JSON.stringify({ convertedToCustomerId: customerId })
            })
            .getOne();
        } catch (e) {
          const recentLeads = await this.leadsRepository.find({ order: { createdAt: 'DESC' }, take: 500 });
          originalLead = recentLeads.find(l => {
            const meta = l.metadata as any;
            return meta && typeof meta === 'object' && meta.convertedToCustomerId === customerId;
          });
        }
      }

      const idMatchList: string[] = [customerId];
      let metadataLogs: any[] = [];

      if (originalLead) {
        if (originalLead.id && originalLead.id !== customerId) idMatchList.push(originalLead.id);
        const meta = originalLead.metadata as any;
        const linkedId = meta?.convertedToCustomerId;
        if (typeof linkedId === 'string' && linkedId !== customerId) idMatchList.push(linkedId);

        const history = meta?.interactionHistory;
        metadataLogs = Array.isArray(history) ? history : [];
      }

      // Get communication history - merge database logs and legacy metadata logs
      const dbLogs = await this.communicationLogsRepository.find({
        where: [
          { customerId: In(idMatchList) },
          { relatedLeadId: In(idMatchList) },
        ],
        relations: ['salesperson'],
        order: { createdAt: 'DESC' },
        take: 50,
      });

      // Merge and sort robustly
      const allLogs = [
        ...dbLogs,
        ...metadataLogs.map(log => ({
          ...log,
          createdAt: log.createdAt || log.created_at || new Date()
        }))
      ].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        if (isNaN(dateA) || isNaN(dateB)) return 0;
        return dateB - dateA;
      });

      return allLogs.slice(0, 50) as CommunicationLog[];
    } catch (error) {
      this.logger.error(`Error fetching communication history for customer ${customerId}:`, error);
      return [];
    }
  }

  async updateCommunication(id: string, updates: Partial<CommunicationLog>): Promise<CommunicationLog> {
    const log = await this.communicationLogsRepository.findOne({ where: { id } });
    if (!log) {
      throw new NotFoundException('Communication log not found');
    }

    Object.assign(log, updates);
    return this.communicationLogsRepository.save(log);
  }

  async deleteCommunication(id: string): Promise<void> {
    await this.communicationLogsRepository.delete(id);
  }

  // Call Log Management - Get calls with filters
  async getCallLogs(
    customerId: string,
    filters?: {
      status?: string;
      salespersonId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<CommunicationLog[]> {
    try {
      const qb = this.communicationLogsRepository.createQueryBuilder('log')
        .leftJoinAndSelect('log.salesperson', 'salesperson')
        .where('log.customerId = :customerId', { customerId })
        .andWhere('log.type = :type', { type: 'call' });

      if (filters?.status) {
        qb.andWhere('log.status = :status', { status: filters.status });
      }

      if (filters?.salespersonId) {
        qb.andWhere('log.salespersonId = :salespersonId', { salespersonId: filters.salespersonId });
      }

      if (filters?.startDate) {
        qb.andWhere('log.createdAt >= :startDate', { startDate: filters.startDate });
      }

      if (filters?.endDate) {
        qb.andWhere('log.createdAt <= :endDate', { endDate: filters.endDate });
      }

      return qb.orderBy('log.createdAt', 'DESC').getMany();
    } catch (error) {
      this.logger.error(`Error fetching call logs for customer ${customerId}:`, error);
      return [];
    }
  }

  // Update a specific call log entry
  async updateCallLog(id: string, updateData: Partial<CommunicationLog>): Promise<CommunicationLog> {
    const callLog = await this.communicationLogsRepository.findOne({ where: { id } });

    if (!callLog || callLog.type !== 'call') {
      throw new NotFoundException('Call log not found');
    }

    Object.assign(callLog, updateData);
    return this.communicationLogsRepository.save(callLog);
  }

  // Delete a specific call log entry  
  async deleteCallLog(id: string): Promise<void> {
    const result = await this.communicationLogsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Call log with ID "${id}" not found`);
    }
  }

  async createAction(data: Partial<CrmAction>): Promise<CrmAction> {
    // 1. Mandatory Reminder Logic - Fallback to dueDate or now if missing
    if (!data.reminderDate) {
      data.reminderDate = data.dueDate || new Date();
    }

    if (!data.dueDate) {
      data.dueDate = data.reminderDate;
    }

    const now = new Date();
    const reminderDate = new Date(data.reminderDate);
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(now.getFullYear() + 1);

    // Allow 15 minutes grace period for past dates (increased from 5 for better reliability)
    const gracePeriodMs = 15 * 60 * 1000;
    if (reminderDate.getTime() < now.getTime() - gracePeriodMs) {
      // Instead of failing, just set it to now if it's too far in the past
      data.reminderDate = new Date();
    }

    if (reminderDate > oneYearFromNow) {
      throw new BadRequestException('Reminder date cannot be more than 1 year in the future.');
    }

    if (!data.title) {
      data.title = `Task: ${data.actionType || 'Action'} for ${data.therapy || 'Patient'}`;
    }

    if (!data.customerId && !data.relatedLeadId) {
      throw new BadRequestException('Task must be associated with either a customer or a lead.');
    }

    this.logger.log(`[createAction] Data: ${JSON.stringify({ customerId: data.customerId, relatedLeadId: data.relatedLeadId, title: data.title })}`);

    // 0. Store original ID to check if resolution failed
    const originalCustomerId = data.customerId;

    // Resolve customerRecord if customerId (User ID) is provided
    if (data.customerId) {
      // 1. Check if it's already a CustomerRecord ID
      const recordById = await this.customerRecordsRepository.findOne({ where: { id: data.customerId } });
      if (recordById) {
        this.logger.log(`[createAction] customerId ${data.customerId} is already a CustomerRecord ID`);
      } else {
        // 1.5. Check if it's a User ID mapping to an existing CustomerRecord (handles inconsistent users/soft-deleted users)
        const recordByCustomerId = await this.customerRecordsRepository.findOne({ where: { customerId: data.customerId } });
        if (recordByCustomerId) {
          data.customerId = recordByCustomerId.id;
          this.logger.log(`[createAction] Resolved User ID ${originalCustomerId} to existing CustomerRecord ID ${recordByCustomerId.id}`);
        } else {
          // 2. Check if it's a User ID (Client) including soft-deleted ones
          const user = await this.usersRepository.findOne({ where: { id: data.customerId }, withDeleted: true });
          if (user) {
            let record = await this.customerRecordsRepository.findOne({ where: { customerId: user.id } });
            if (!record) {
              record = await this.createCustomerRecord(user.id);
            }
            data.customerId = record.id;
            this.logger.log(`[createAction] Resolved User ID ${user.id} to CustomerRecord ID ${record.id}`);
          } else {
            // 3. Check if it's a Lead ID including soft-deleted ones
            const lead = await this.leadsRepository.findOne({ where: { id: data.customerId }, withDeleted: true });
            if (lead) {
              data.relatedLeadId = lead.id;
              data.customerId = null;
              this.logger.log(`[createAction] customerId ${lead.id} is a Lead ID, moved to relatedLeadId`);
            }
          }
        }
      }
    }

    // 4. Ensure relatedLeadId is handled if customerId is still null
    if (!data.customerId && data.relatedLeadId) {
      const lead = await this.leadsRepository.findOne({ where: { id: data.relatedLeadId }, withDeleted: true });
      if (lead) {
        // Check both metadata and direct column if it exists
        const convertedId = (lead.metadata as any)?.convertedToCustomerId || (lead as any).customerId;
        if (convertedId) {
          const record = await this.customerRecordsRepository.findOne({ where: { customerId: convertedId } });
          if (record) {
            data.customerId = record.id;
            this.logger.log(`[createAction] Linked Lead ${lead.id} to CustomerRecord ${record.id} via conversion`);
          }
        }
      }
    }

    // Final Validation: Ensure any referenced IDs actually exist to prevent 500 DB crashes
    if (data.customerId) {
      const dbRecord = await this.customerRecordsRepository.findOne({ where: { id: data.customerId }, withDeleted: true });
      if (!dbRecord) {
        this.logger.warn(`[createAction] Resolved customerId ${data.customerId} does not exist in DB.`);
        // If we have a valid relatedLeadId, we can safely drop the invalid customerId instead of failing
        if (data.relatedLeadId) {
          const leadExists = await this.leadsRepository.findOne({ where: { id: data.relatedLeadId }, withDeleted: true });
          if (leadExists) {
            this.logger.warn(`[createAction] Nullifying invalid customerId because valid relatedLeadId exists.`);
            data.customerId = null;
          } else {
            throw new BadRequestException('Both provided Customer ID and Lead ID are invalid or deleted.');
          }
        } else {
          throw new BadRequestException('Invalid customer ID provided. The record may have been completely deleted.');
        }
      }
    }

    if (data.relatedLeadId) {
      const leadExists = await this.leadsRepository.findOne({ where: { id: data.relatedLeadId }, withDeleted: true });
      if (!leadExists) {
        if (data.customerId) {
          this.logger.warn(`[createAction] Nullifying invalid relatedLeadId because valid customerId exists.`);
          data.relatedLeadId = null;
        } else {
          throw new BadRequestException('Invalid lead ID provided.');
        }
      }
    }

    // 5. Assign salesperson if missing (use lead/customer assigned salesperson)
    if (!data.salespersonId) {
      if (data.customerId) {
        const record = await this.customerRecordsRepository.findOne({
          where: { id: data.customerId },
          relations: ['assignedSalesperson']
        });
        if (record?.assignedSalespersonId) {
          data.salespersonId = record.assignedSalespersonId;
        }
      } else if (data.relatedLeadId) {
        const lead = await this.leadsRepository.findOne({ where: { id: data.relatedLeadId } });
        if (lead?.assignedSalesId) {
          data.salespersonId = lead.assignedSalesId;
        }
      }
    }

    this.logger.log(`[createAction] Final Payload: ${JSON.stringify({ customerId: data.customerId, relatedLeadId: data.relatedLeadId, salespersonId: data.salespersonId })}`);

    let savedAction;
    try {
      const action = this.crmActionsRepository.create(data);
      savedAction = await this.crmActionsRepository.save(action);
    } catch (error) {
      if (error.code === '23503') {
        this.logger.warn(`[createAction] Database schema/FK mismatch detected for customerId: ${data.customerId}`);
        let fallbackSucceeded = false;

        // 1. AWS Schema Fallback: Try User ID instead of CustomerRecord ID
        try {
          const searchId = originalCustomerId || data.customerId;
          let record = await this.customerRecordsRepository.findOne({ where: { id: searchId } });

          if (!record && originalCustomerId !== data.customerId) {
            record = await this.customerRecordsRepository.findOne({ where: { id: data.customerId } });
          }

          if (record && record.customerId) {
            const fallbackData = { ...data, customerId: record.customerId };
            const actionFallback = this.crmActionsRepository.create(fallbackData);
            savedAction = await this.crmActionsRepository.save(actionFallback);
            this.logger.log(`[createAction] Successfully saved task using User ID fallback.`);
            fallbackSucceeded = true;
          }
        } catch (fallbackError) {
          this.logger.warn(`[createAction] AWS Schema fallback also failed with FK violation.`);
        }

        // 2. Ultimate Safe Fallback: Nullify customerId and persist data to avoid 500 crashes + data loss
        if (!fallbackSucceeded) {
          this.logger.warn(`[createAction] Proceeding with ULTIMATE safe fallback. Nullifying customerId and saving to metadata to bypass corrupt Postgres DB state.`);
          const safeData = {
            ...data,
            customerId: null,
            metadata: {
              ...(data.metadata || {}),
              orphanedReferenceId: data.customerId || originalCustomerId,
              fallbackReason: 'Database FK 23503 constraint violation'
            }
          };
          const safeAction = this.crmActionsRepository.create(safeData);
          savedAction = await this.crmActionsRepository.save(safeAction);
        }
      } else {
        throw error;
      }
    }

    // Send enhanced notification for dialer integration
    if (data.status === 'pending' && data.salespersonId) {
      let customerPhone = '';
      let customerName = data.therapy || 'Patient';

      try {
        if (data.relatedLeadId) {
          const lead = await this.leadsRepository.findOne({ where: { id: data.relatedLeadId } });
          customerPhone = lead?.phone || '';
          customerName = `${lead?.firstName} ${lead?.lastName}`;
        } else if (data.customerId) {
          const rec = await this.customerRecordsRepository.findOne({ where: { id: data.customerId }, relations: ['customer'] });
          customerPhone = rec?.customer?.phone || '';
          customerName = `${rec?.customer?.firstName} ${rec?.customer?.lastName}`;
        }
      } catch (e) {
        this.logger.warn(`Failed to fetch phone for dialer notification: ${e.message}`);
      }

      const isCallAction = data.actionType === 'follow_up_call' || data.actionType === 'call';
      
      await this.notificationsService.create(
        data.salespersonId,
        NotificationType.PUSH,
        isCallAction ? `📞 Call Back: ${customerName}` : 'New Task Created',
        isCallAction ? `Call ${customerPhone} now regarding ${data.title}` : `${data.title} - Due: ${data.dueDate}`,
        { 
          actionId: savedAction.id,
          trigger: isCallAction ? 'DIALER_CALLBACK' : 'TASK_OPEN',
          phoneNumber: customerPhone,
          customerName: customerName
        },
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

    // Reminder validation and auto-fix
    const now = new Date();

    // Ensure we have a reminderDate if it's missing from DB and not provided in update
    // (Happens with legacy tasks or tasks created before the strict rule)
    if (!action.reminderDate && !updateData.reminderDate &&
      action.status !== 'completed' && action.status !== 'cancelled' &&
      updateData.status !== 'completed' && updateData.status !== 'cancelled') {
      this.logger.log(`[updateAction] Action ${id} missing reminderDate. Auto-assigning current time.`);
      updateData.reminderDate = now;
    }

    if (updateData.reminderDate) {
      const reminderDate = new Date(updateData.reminderDate);
      const oneYearFromNow = new Date(action.createdAt || now);
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

      // Allow 15 minutes grace period (consistent with createAction)
      const gracePeriodMs = 15 * 60 * 1000;
      const isPast = reminderDate.getTime() < now.getTime() - gracePeriodMs;

      if (isPast) {
        // Auto-fix past dates instead of failing for better UX
        this.logger.warn(`[updateAction] Reminder date in the past for action ${id}. Auto-fixing to current time.`);
        updateData.reminderDate = now;
      }

      if (reminderDate > oneYearFromNow) {
        // If it's too far in the future, cap it at 1 year rather than failing
        this.logger.warn(`[updateAction] Reminder date too far in future for action ${id}. Capping at 1 year.`);
        updateData.reminderDate = oneYearFromNow;
      }
    }

    const wasCompleted = action.status === 'completed';
    const isNowCompleted = updateData.status === 'completed';

    if (isNowCompleted && !wasCompleted) {
      updateData.completedAt = new Date();

      // AUTO-CONFIRMATION FLOW: If this task was for an appointment confirmation, confirm the appointment
      if (action.metadata?.appointmentId && action.metadata?.workflow === 'call_center_confirmation') {
        try {
          const appointmentId = action.metadata.appointmentId;
          await this.appointmentsRepository.update(appointmentId, {
            status: AppointmentStatus.CONFIRMED,
            updatedAt: new Date()
          });
          this.logger.log(`[Flow] Appointment ${appointmentId} auto-confirmed via CRM task completion.`);

          // Trigger Notification for Confirmation
          this.eventEmitter.emit('appointment.confirmed', { id: appointmentId });
        } catch (confirmErr) {
          this.logger.error(`Failed to auto-confirm appointment upon task completion: ${confirmErr.message}`);
        }
      }

      // Handle Recurrence Logic
      if (action.isRecurring || updateData.isRecurring) {
        await this.handleTaskRecurrence(action, updateData);
      }
    }

    Object.assign(action, updateData);
    return this.crmActionsRepository.save(action);
  }

  async deleteAction(id: string): Promise<void> {
    throw new ForbiddenException('Tasks cannot be deleted. They should only be rescheduled or marked as cancelled/completed.');
  }

  private async handleTaskRecurrence(action: CrmAction, updateData: Partial<CrmAction>) {
    const type = updateData.recurrenceType || action.recurrenceType;
    const interval = updateData.recurrenceInterval || action.recurrenceInterval || 1;

    if (!type) return;

    const nextDueDate = new Date(updateData.dueDate || action.dueDate || new Date());
    const nextReminderDate = new Date(updateData.reminderDate || action.reminderDate || new Date());

    if (type === 'daily') {
      nextDueDate.setDate(nextDueDate.getDate() + 1);
      nextReminderDate.setDate(nextReminderDate.getDate() + 1);
    } else if (type === 'weekly') {
      nextDueDate.setDate(nextDueDate.getDate() + 7);
      nextReminderDate.setDate(nextReminderDate.getDate() + 7);
    } else if (type === 'monthly') {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      nextReminderDate.setMonth(nextReminderDate.getMonth() + 1);
    } else if (type === 'custom') {
      nextDueDate.setDate(nextDueDate.getDate() + interval);
      nextReminderDate.setDate(nextReminderDate.getDate() + interval);
    }

    const nextActionData: Partial<CrmAction> = {
      ...action,
      id: undefined, // TypeORM will generate new ID
      status: 'pending',
      dueDate: nextDueDate,
      reminderDate: nextReminderDate,
      completedAt: null,
      originalTaskId: action.originalTaskId || action.id,
      createdAt: undefined,
      updatedAt: undefined,
    };

    // Filter out some fields that shouldn't be copied
    delete nextActionData['createdAt'];
    delete nextActionData['updatedAt'];
    delete (nextActionData as any)['id'];

    const nextAction = this.crmActionsRepository.create(nextActionData);
    await this.crmActionsRepository.save(nextAction);
  }

  async getActions(
    requesterId: string,
    filters?: { status?: string; priority?: string; customerId?: string; salespersonId?: string }
  ): Promise<CrmAction[]> {
    try {
      const user = await this.usersRepository.findOne({ where: { id: requesterId } });
      const qb = this.crmActionsRepository
        .createQueryBuilder('action')
        .leftJoinAndSelect('action.customer', 'customer')
        .leftJoinAndSelect('customer.customer', 'clientUser') // Join with actual User for name
        .leftJoinAndSelect('action.relatedLead', 'relatedLead')
        .leftJoinAndSelect('action.salesperson', 'salesperson');

      // 1. Authorization Filter
      if (user?.role === UserRole.SALESPERSON) {
        // Salespeople only see their own tasks
        qb.where('action.salespersonId = :sid', { sid: requesterId });
      } else if (user?.role === UserRole.CLINIC_OWNER) {
        // Clinic owners see tasks for customers in their clinics
        const ownerships = await this.clinicOwnershipRepository.find({ where: { ownerUserId: requesterId } });
        const ownedClinicIds = ownerships.map(o => o.clinicId);
        if (ownedClinicIds.length === 0) return [];
        qb.leftJoin('customer.customer', 'u')
          .leftJoin('u.clientAppointments', 'apt')
          .andWhere('apt.clinicId IN (:...ids)', { ids: ownedClinicIds });
      } else if ([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER].includes(user?.role as UserRole)) {
        // Admins/Managers can see everything (initial state)
      } else {
        qb.where('1=0');
        return [];
      }

      // 2. Additional Filters from Query Params
      if (filters?.status) {
        qb.andWhere('action.status = :status', { status: filters.status });
      }

      if (filters?.priority) {
        qb.andWhere('action.priority = :priority', { priority: filters.priority });
      }

      if (filters?.customerId) {
        // Find record ID to match both possible storage locations
        const record = await this.customerRecordsRepository.findOne({ where: { customerId: filters.customerId } });
        const recordId = record?.id;

        if (recordId) {
          qb.andWhere('(action.customerId = :recordId OR action.customerId = :custId OR action.relatedLeadId = :custId)', {
            recordId: recordId,
            custId: filters.customerId
          });
        } else {
          qb.andWhere('(action.customerId = :customerId OR action.relatedLeadId = :customerId)', { customerId: filters.customerId });
        }
      }

      if (filters?.salespersonId) {
        qb.andWhere('action.salespersonId = :salespersonId', { salespersonId: filters.salespersonId });
      }

      const now = new Date();

      // Custom sorting: Overdue (pending + date < now) first, then upcoming
      // In TypeORM QueryBuilder, we can use CASE in orderBy
      return await qb
        .orderBy(`CASE 
          WHEN action.status = 'pending' AND action.dueDate < CURRENT_TIMESTAMP THEN 0 
          WHEN action.status = 'pending' AND action.dueDate >= CURRENT_TIMESTAMP THEN 1
          ELSE 2 
        END`, 'ASC')
        .addOrderBy('action.dueDate', 'ASC')
        .getMany();
    } catch (error) {
      this.logger.error(`Error in getActions: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getTaskKpis(salespersonId?: string): Promise<any> {
    const now = new Date();

    const qb = this.crmActionsRepository.createQueryBuilder('action');

    if (salespersonId && salespersonId !== 'all') {
      qb.where('action.salespersonId = :sid', { sid: salespersonId });
    }

    const stats = await qb
      .select('action.status', 'status')
      .addSelect('action.dueDate', 'dueDate')
      .getRawMany();

    const result = {
      total: stats.length,
      pending: stats.filter(s => s.status === 'pending').length,
      overdue: stats.filter(s => s.status === 'pending' && s.dueDate && new Date(s.dueDate) < now).length,
      inProgress: stats.filter(s => s.status === 'in_progress').length,
      completed: stats.filter(s => s.status === 'completed').length,
    };

    return result;
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
  ): Promise<any> {
    // 1. Check if it's a Lead ID
    const lead = await this.leadsRepository.findOne({
      where: { id: customerId },
      relations: ['tags']
    });

    if (lead) {
      const tag = await this.dataSource.getRepository(Tag).findOne({ where: { id: tagId } });
      if (!tag) throw new NotFoundException('Tag not found');

      const finalTag = tag as Tag;

      // Check if lead already has this tag
      const hasTag = lead.tags?.some(t => t.id === tagId);
      if (!hasTag) {
        lead.tags = [...(lead.tags || []), finalTag];
        await this.leadsRepository.save(lead);
      }
      return { success: true, message: 'Tag added to lead', data: lead };
    }

    // 2. Check if it's a User ID (Client)
    const user = await this.usersRepository.findOne({ where: { id: customerId } });
    let finalRecordId = customerId;

    if (user) {
      let record = await this.customerRecordsRepository.findOne({ where: { customerId: user.id } });
      if (!record) {
        record = await this.createCustomerRecord(user.id);
      }
      finalRecordId = record.id;
    } else {
      // 3. check if it's already a CustomerRecord ID
      const recordById = await this.customerRecordsRepository.findOne({ where: { id: customerId } });
      if (!recordById) {
        throw new NotFoundException('Customer or Lead not found');
      }
      finalRecordId = recordById.id;
    }

    // Ensure tag exists before creating CustomerTag
    const tagExists = await this.dataSource.getRepository(Tag).findOne({ where: { id: tagId } });
    if (!tagExists) throw new NotFoundException('Tag not found');

    const tag = this.customerTagsRepository.create({
      customerId: finalRecordId,
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
      .leftJoinAndSelect('customer.customer', 'actualUser')
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
      customer: t.customer?.customer || t.customer, // use nested user or fallback to record
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

  // Analytics
  async getCrmMetrics(): Promise<any> {
    const totalLeads = await this.leadsRepository.count();
    const convertedLeads = await this.leadsRepository.count({
      where: { status: LeadStatus.CONVERTED },
    });
    const totalActions = await this.crmActionsRepository.count();
    const completedActions = await this.crmActionsRepository.count({
      where: { status: 'completed' },
    });

    return {
      totalLeads,
      convertedLeads,
      conversionRate: totalLeads > 0 ? convertedLeads / totalLeads : 0,
      totalActions,
      completedActions,
    };
  }

  // Analytics for Salesperson
  async getSalespersonAnalytics(salespersonId: string, dateRange?: { startDate: Date; endDate: Date }): Promise<any> {
    const isAll = salespersonId === 'all' || salespersonId === '';

    // 1. Leads Analytics
    let leadsQuery = this.leadsRepository.createQueryBuilder('lead');
    if (!isAll) {
      leadsQuery = leadsQuery.where('lead.assignedSalesId = :salespersonId', { salespersonId });
    } else {
      leadsQuery = leadsQuery.where('1=1');
    }

    if (dateRange) {
      leadsQuery = leadsQuery.andWhere(
        'lead.createdAt BETWEEN :startDate AND :endDate',
        dateRange
      );
    }

    const leadsAssigned = await leadsQuery.getCount();
    const leadsConverted = await leadsQuery.clone()
      .andWhere('lead.status = :convertedStatus', { convertedStatus: LeadStatus.CONVERTED })
      .getCount();
    const leadsContacted = await leadsQuery.clone()
      .andWhere('lead.status != :newStatus', { newStatus: LeadStatus.NEW })
      .getCount();

    // 2. Communication Stats
    let communicationQuery = this.communicationLogsRepository.createQueryBuilder('log');
    if (!isAll) {
      communicationQuery = communicationQuery.where('log.salespersonId = :salespersonId', { salespersonId });
    } else {
      communicationQuery = communicationQuery.where('1=1');
    }

    if (dateRange) {
      communicationQuery = communicationQuery.andWhere(
        'log.createdAt BETWEEN :startDate AND :endDate',
        dateRange
      );
    }

    const communicationStats = await communicationQuery
      .select([
        'COUNT(log.id) as "totalCommunications"',
        'COUNT(CASE WHEN log.type = \'call\' THEN 1 END) as "totalCalls"',
        'COUNT(CASE WHEN log.type = \'call\' AND log.status = \'completed\' THEN 1 END) as "answeredCalls"',
        'COUNT(CASE WHEN log.type = \'call\' AND log.status = \'missed\' THEN 1 END) as "missedCalls"',
        'COUNT(CASE WHEN log.type = \'email\' THEN 1 END) as "totalEmails"',
        'SUM(CASE WHEN log.type = \'call\' THEN COALESCE(log.durationSeconds, 0) ELSE 0 END) as "totalDuration"',
      ])
      .getRawOne();

    // 3. Action Stats
    let actionQuery = this.crmActionsRepository.createQueryBuilder('action');
    if (!isAll) {
      actionQuery = actionQuery.where('action.salespersonId = :salespersonId', { salespersonId });
    } else {
      actionQuery = actionQuery.where('1=1');
    }

    if (dateRange) {
      actionQuery = actionQuery.andWhere(
        'action.createdAt BETWEEN :startDate AND :endDate',
        dateRange
      );
    }

    const actionStats = await actionQuery
      .select([
        'COUNT(action.id) as "totalActions"',
        'COUNT(CASE WHEN action.status = \'pending\' THEN 1 END) as "pendingActions"',
        'COUNT(CASE WHEN action.status = \'completed\' THEN 1 END) as "completedActions"',
        'COUNT(CASE WHEN action.status = \'missed\' THEN 1 END) as "missedActions"',
      ])
      .getRawOne();

    const tasksCompleted = parseInt(actionStats.completedActions || '0');
    const totalActions = parseInt(actionStats.totalActions || '0');

    // 4. Customer Stats (Lifetime Value, etc.)
    let customerQuery = this.customerRecordsRepository.createQueryBuilder('record');
    if (!isAll) {
      customerQuery = customerQuery.where('record.assignedSalespersonId = :salespersonId', { salespersonId });
    } else {
      customerQuery = customerQuery.where('1=1');
    }

    const customerStats = await customerQuery
      .select([
        'COUNT(record.id) as "totalCustomers"',
        'COUNT(CASE WHEN record.isRepeatCustomer = true THEN 1 END) as "repeatCustomers"',
        'SUM(record.lifetimeValue) as "totalRevenue"',
      ])
      .getRawOne();

    // 5. Appointments Funnel Stats
    const aptBaseQ = this.appointmentsRepository
      .createQueryBuilder('apt')
      .innerJoin('customer_records', 'rec', 'rec.customerId = apt.clientId');

    if (!isAll) {
      // ATTRIBUTION RULE: Use the provider assigned (Professional)
      aptBaseQ.where('apt.providerId = :salespersonId', { salespersonId });
    } else {
      aptBaseQ.where('1=1');
    }

    // Booked
    let bookedQ = aptBaseQ.clone();
    if (dateRange) {
      bookedQ = bookedQ.andWhere('apt.createdAt >= :startDate AND apt.createdAt <= :endDate', dateRange);
    }
    const bookedApts = await bookedQ.getCount();

    // Canceled 
    let cancelledQ = aptBaseQ.clone().andWhere('apt.status = :status', { status: 'CANCELLED' });
    if (dateRange) {
      cancelledQ = cancelledQ.andWhere('apt.updatedAt >= :startDate AND apt.updatedAt <= :endDate', dateRange);
    }
    const cancelledApts = await cancelledQ.getCount();

    // No-shows 
    let noShowQ = aptBaseQ.clone().andWhere('apt.status = :status', { status: 'NO_SHOW' });
    if (dateRange) {
      noShowQ = noShowQ.andWhere('apt.startTime >= :startDate AND apt.startTime <= :endDate', dateRange);
    }
    const noShowApts = await noShowQ.getCount();

    // Done / Completed 
    let completedQ = aptBaseQ.clone().andWhere('apt.status = :status', { status: 'COMPLETED' });
    if (dateRange) {
      completedQ = completedQ.andWhere('COALESCE(apt.completedAt, apt.updatedAt, apt.startTime) >= :startDate AND COALESCE(apt.completedAt, apt.updatedAt, apt.startTime) <= :endDate', dateRange);
    }
    const completedStats = await completedQ
      .leftJoin('services', 'svc', 'svc.id = apt.serviceId')
      .select([
        'COUNT(apt.id) as count',
        'SUM(COALESCE(apt.amountPaid, apt.totalAmount, svc.price, 0)) as revenue'
      ])
      .getRawOne();

    const completedApts = parseInt(completedStats?.count || '0');
    const totalRevenueInRange = parseFloat(completedStats?.revenue || '0');

    // Returned Appointments
    let returnedQ = aptBaseQ.clone();
    if (dateRange) {
      returnedQ = returnedQ.andWhere('apt.startTime >= :startDate AND apt.startTime <= :endDate', dateRange);
    }
    returnedQ = returnedQ.andWhere(`
      EXISTS (
        SELECT 1 FROM appointments prev
        WHERE prev."clientId" = apt."clientId"
        AND prev.status = 'COMPLETED'
        AND COALESCE(prev."completedAt", prev."updatedAt", prev."startTime") < apt."startTime"
      )
    `);
    const returnedApts = await returnedQ.getCount();

    // 6. Turnover MTD & Monthly Target
    let monthlyTarget = 0;
    let targetIsSet = false;

    if (!isAll) {
      const sp = await this.usersRepository.findOne({ where: { id: salespersonId } });
      if (sp?.profile?.monthly_target_eur) {
        monthlyTarget = parseFloat(sp.profile.monthly_target_eur);
        targetIsSet = true;
      }
    } else {
      const salespeople = await this.usersRepository.find({ where: { role: UserRole.SALESPERSON } });
      let totalTarget = 0;
      let anySet = false;
      for (const sp of salespeople) {
        if (sp?.profile?.monthly_target_eur) {
          totalTarget += parseFloat(sp.profile.monthly_target_eur);
          anySet = true;
        }
      }
      if (anySet) {
        monthlyTarget = totalTarget;
        targetIsSet = true;
      }
    }

    const now = new Date();
    // 6a. Dates for MTD Turnover logic MUST ignore custom dateRange filter
    const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const mtdEnd = now;

    // 6b. Keep the period dates for other charts (e.g. TimeSeries below)
    const startOfPeriod = dateRange ? dateRange.startDate : mtdStart;
    const endOfPeriod = dateRange ? dateRange.endDate : mtdEnd;

    let mtdAptQ = this.appointmentsRepository
      .createQueryBuilder('apt')
      .innerJoin('customer_records', 'rec', 'rec.customerId = apt.clientId')
      .leftJoin('services', 'svc', 'svc.id = apt.serviceId')
      .select([
        'COALESCE(SUM(COALESCE(apt.amountPaid, apt.totalAmount, svc.price, 0)), 0) as "totalRevenue"'
      ])
      .where('apt.status = :status', { status: 'COMPLETED' });

    if (!isAll) {
      // ATTRIBUTION RULE: Use the provider assigned (Professional)
      mtdAptQ = mtdAptQ.andWhere('apt.providerId = :salespersonId', { salespersonId });
    }

    // STRICTLY use MTD boundaries here
    mtdAptQ = mtdAptQ.andWhere('COALESCE(apt.completedAt, apt.updatedAt, apt.startTime) BETWEEN :mtdStart AND :mtdEnd', { mtdStart, mtdEnd });

    const mtdStats = await mtdAptQ.getRawOne();

    const achievedMtd = parseFloat(mtdStats?.totalRevenue || 0);

    // No scaling for Target. Target is full month.
    const progress = targetIsSet && monthlyTarget > 0 ? (achievedMtd / monthlyTarget) : 0;

    // Pacing calculation based on elapsed time vs total days in current month
    const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const elapsedDays = now.getDate();
    const expectedProgress = Math.min(1, Math.max(0, elapsedDays / totalDaysInMonth));

    let pacingDelta = 0;
    let pacingStatus = 'On Track';
    if (targetIsSet && monthlyTarget > 0) {
      pacingDelta = progress - expectedProgress;
      if (pacingDelta > 0.05) pacingStatus = 'Ahead';
      else if (pacingDelta < -0.05) pacingStatus = 'Behind';
    }

    // 7. Turnover Time Series Data for Chart (This CAN use the custom date range to show historical charts)
    const timeSeriesQ = this.appointmentsRepository
      .createQueryBuilder('apt')
      .innerJoin('customer_records', 'rec', 'rec.customerId = apt.clientId')
      .leftJoin('services', 'svc', 'svc.id = apt.serviceId')
      .select([
        "CAST(COALESCE(apt.completedAt, apt.updatedAt, apt.startTime) AS DATE) as date",
        "SUM(COALESCE(apt.amountPaid, apt.totalAmount, svc.price, 0)) as amount",
      ])
      .where('apt.status = :status', { status: 'COMPLETED' });

    if (!isAll) {
      // ATTRIBUTION RULE: Use the provider assigned (Professional)
      timeSeriesQ.andWhere('apt.providerId = :salespersonId', { salespersonId });
    }

    timeSeriesQ.andWhere('COALESCE(apt.completedAt, apt.updatedAt, apt.startTime) >= :startOfPeriod AND COALESCE(apt.completedAt, apt.updatedAt, apt.startTime) <= :endOfPeriod', { startOfPeriod, endOfPeriod });

    timeSeriesQ
      .groupBy("CAST(COALESCE(apt.completedAt, apt.updatedAt, apt.startTime) AS DATE)")
      .orderBy("date", "ASC");

    const tsStats = await timeSeriesQ.getRawMany();
    const turnoverTimeSeries = tsStats.map(t => ({
      date: t.date?.toISOString ? t.date.toISOString().split('T')[0] : t.date,
      amount: parseFloat(t.amount || 0)
    }));
    let agentLeaderboard = [];
    if (isAll) {
      const leaderboardQ = this.appointmentsRepository
        .createQueryBuilder('apt')
        .innerJoin('customer_records', 'rec', 'rec.customerId = apt.clientId')
        .leftJoin('services', 'svc', 'svc.id = apt.serviceId')
        .leftJoin('users', 'u', 'u.id = apt.bookedById')
        .select([
          "COALESCE(u.firstName || ' ' || u.lastName, 'Unknown Agent') as agent",
          "SUM(COALESCE(apt.amountPaid, apt.totalAmount, svc.price, 0)) as amount",
        ])
        .where('apt.status = :status', { status: 'completed' })
        .andWhere('COALESCE(apt.completedAt, apt.updatedAt, apt.startTime) >= :startOfPeriod AND COALESCE(apt.completedAt, apt.updatedAt, apt.startTime) <= :endOfPeriod', { startOfPeriod, endOfPeriod })
        .groupBy("u.firstName, u.lastName")
        .orderBy("amount", "DESC");

      const lbStats = await leaderboardQ.getRawMany();
      agentLeaderboard = lbStats.map(lb => ({
        agent: lb.agent,
        amount: parseFloat(lb.amount || 0)
      })).filter(lb => lb.amount > 0);
    }

    return {
      // Flattened metrics for Dashboard
      leadsAssigned,
      leadsContacted,
      salespersonConversionRate: leadsAssigned > 0 ? leadsConverted / leadsAssigned : 0,
      tasksCompleted,
      totalActions,
      completedActions: tasksCompleted,
      averageResponseTime: '24m', // Placeholder

      // Map to generic CRM metrics names for consistent UI display
      totalLeads: leadsAssigned,
      convertedLeads: leadsConverted,
      conversionRate: leadsAssigned > 0 ? leadsConverted / leadsAssigned : 0,

      // Turnover Performance
      turnoverStats: {
        monthlyTarget: Math.round(monthlyTarget),
        targetIsSet,
        achieved: achievedMtd,
        progress: targetIsSet ? parseFloat(progress.toFixed(4)) : null,
        expectedProgress: parseFloat(expectedProgress.toFixed(4)),
        pacingDelta: parseFloat(pacingDelta.toFixed(4)),
        pacingStatus
      },

      appointmentStats: {
        total: bookedApts,
        completed: completedApts,
        cancelled: cancelledApts,
        noShow: noShowApts,
        returned: returnedApts
      },
      turnoverTimeSeries,
      agentLeaderboard,

      // Detailed objects (legacy support)
      communicationStats: {
        total: parseInt(communicationStats?.totalCommunications || 0),
        calls: parseInt(communicationStats?.totalCalls || 0),
        answeredCalls: parseInt(communicationStats?.answeredCalls || 0),
        missedCalls: parseInt(communicationStats?.missedCalls || 0),
        emails: parseInt(communicationStats?.totalEmails || 0),
        totalDurationSeconds: parseInt(communicationStats?.totalDuration || 0),
        avgDurationMinutes: parseInt(communicationStats?.totalCalls || 0) > 0
          ? (parseInt(communicationStats?.totalDuration || 0) / parseInt(communicationStats?.totalCalls || 0) / 60).toFixed(1)
          : 0
      },
      actionStats: {
        total: totalActions,
        pending: parseInt(actionStats?.pendingActions || 0),
        completed: tasksCompleted,
        missed: parseInt(actionStats?.missedActions || 0),
      },
      customerStats: {
        totalCustomers: parseInt(customerStats?.totalCustomers || 0),
        repeatCustomers: parseInt(customerStats?.repeatCustomers || 0),
        totalRevenue: parseFloat(customerStats?.totalRevenue || 0),
      }
    };
  }

  async testFacebookConnection(): Promise<{ success: boolean; message: string }> {
    return this.facebookService.testFacebookConnection();
  }

  async getFacebookForms() {
    let fbForms = [];
    try {
      fbForms = await this.facebookService.getForms();
    } catch (e) {
      this.logger.warn('Failed to fetch forms from Facebook API, using DB fallback only');
    }

    // Get unique form names with counts from our database
    const dbFormStats = await this.leadsRepository
      .createQueryBuilder('lead')
      .select('lead.lastMetaFormName', 'name')
      .addSelect('COUNT(lead.id)', 'count')
      .where('lead.lastMetaFormName IS NOT NULL')
      .groupBy('lead.lastMetaFormName')
      .getRawMany();

    // Combine them, preferring real API data but enriching with DB counts
    const processedForms = (fbForms || []).map(f => {
      const dbStat = dbFormStats.find(d => d.name === f.name);
      return {
        ...f,
        leads_count: parseInt(dbStat?.count || '0')
      };
    });

    dbFormStats.forEach(dbf => {
      if (!processedForms.some(f => f.name === dbf.name)) {
        processedForms.push({
          id: `db_${dbf.name}`,
          name: dbf.name,
          status: 'READY',
          source: 'database',
          leads_count: parseInt(dbf.count || '0')
        });
      }
    });

    return processedForms;
  }

  async assignFormsToDay(formNames: string[], scheduledAt: Date) {
    if (!formNames || formNames.length === 0) {
      throw new BadRequestException('Form names are required');
    }

    // 1. Find all processable leads from these forms
    const leads = await this.leadsRepository.find({
      where: {
        lastMetaFormName: In(formNames),
        status: In([LeadStatus.NEW, LeadStatus.CONTACTED]),
      },
      select: ['id', 'firstName', 'lastName', 'assignedSalesId']
    });

    if (leads.length === 0) {
      return {
        success: true,
        affected: 0,
        message: 'No new or contacted leads found for these forms.'
      };
    }

    // 2. Update leads with scheduled date
    await this.leadsRepository.update(
      { id: In(leads.map(l => l.id)) },
      { scheduledAt }
    );

    // 3. Create Tasks (CrmActions) for each lead
    const tasks = leads.map(lead => {
      return this.crmActionsRepository.create({
        title: `Follow-up: ${lead.firstName} ${lead.lastName}`,
        actionType: 'follow_up_call' as any,
        status: 'pending',
        priority: 'medium',
        dueDate: scheduledAt,
        reminderDate: new Date(scheduledAt.getTime() - 30 * 60000), // 30 mins before
        relatedLeadId: lead.id,
        salespersonId: lead.assignedSalesId || (/* fallback to admin if unassigned */ (leads[0] as any).tempAdminId),
        description: `Scheduled bulk follow-up from Facebook Form: ${formNames.join(', ')}`
      });
    });

    // Special handling for salespersonId if missing (fetch a default admin ID)
    let defaultAdminId: string;
    if (leads.some(l => !l.assignedSalesId)) {
      const admin = await this.usersRepository.findOne({ where: { role: UserRole.SUPER_ADMIN } });
      defaultAdminId = admin?.id;
      tasks.forEach(t => {
        if (!t.salespersonId) t.salespersonId = defaultAdminId;
      });
    }

    await this.crmActionsRepository.save(tasks);

    this.logger.log(`Scheduled ${leads.length} leads and created tasks from forms [${formNames.join(', ')}] to ${scheduledAt}`);

    return {
      success: true,
      affected: leads.length,
      message: `Successfully scheduled ${leads.length} leads and created follow-up tasks for ${scheduledAt.toLocaleDateString()}`
    };
  }

  async getManagerAgentKpis(dateRange?: { startDate: Date; endDate: Date }): Promise<any> {
    // 0. Fetch all salespersons to ensure we include those with 0 activity
    const salespersons = await this.usersRepository.find({
      where: { role: UserRole.SALESPERSON },
      select: ['id', 'firstName', 'lastName']
    });

    const agentMap = new Map<string, any>();
    for (const s of salespersons) {
      agentMap.set(s.id, {
        agentId: s.id,
        agentName: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unnamed Agent',
        totalCommunications: 0,
        totalCalls: 0,
        answeredCalls: 0,
        missedCalls: 0,
        totalDuration: 0,
        totalAppointments: 0,
        completedAppointments: 0,
        noShows: 0,
        cancellations: 0,
        totalRevenue: 0,
        totalLeads: 0,
        convertedLeads: 0,
        avgAppointmentValue: 0,
        conversionRate: 0,
      });
    }

    // 1. Get communication statistics per agent
    let commQ = this.communicationLogsRepository
      .createQueryBuilder('log')
      .select('log.salespersonId', 'agentId')
      .addSelect('COUNT(log.id)', 'totalCommunications')
      .addSelect("COUNT(CASE WHEN log.type = 'call' THEN 1 END)", 'totalCalls')
      .addSelect("COUNT(CASE WHEN log.type = 'call' AND log.status = 'completed' THEN 1 END)", 'answeredCalls')
      .addSelect("COUNT(CASE WHEN log.type = 'call' AND log.status = 'missed' THEN 1 END)", 'missedCalls')
      .addSelect("SUM(CASE WHEN log.type = 'call' THEN COALESCE(log.durationSeconds, 0) ELSE 0 END)", 'totalDuration')
      .where('log.salespersonId IS NOT NULL')
      .groupBy('log.salespersonId');

    if (dateRange) {
      commQ = commQ.andWhere('log.createdAt BETWEEN :startDate AND :endDate', dateRange);
    }

    const commStats = await commQ.getRawMany();

    // Update with communication stats
    for (const comm of commStats) {
      const existing = agentMap.get(comm.agentId) || {
        agentId: comm.agentId,
        agentName: 'Unknown Agent',
        totalAppointments: 0,
        completedAppointments: 0,
        noShows: 0,
        cancellations: 0,
        totalRevenue: 0,
        totalLeads: 0,
        convertedLeads: 0,
        avgAppointmentValue: 0,
        conversionRate: 0,
      };

      agentMap.set(comm.agentId, {
        ...existing,
        totalCommunications: parseInt(comm.totalCommunications, 10) || 0,
        totalCalls: parseInt(comm.totalCalls, 10) || 0,
        answeredCalls: parseInt(comm.answeredCalls, 10) || 0,
        missedCalls: parseInt(comm.missedCalls, 10) || 0,
        totalDuration: parseInt(comm.totalDuration, 10) || 0,
      });
    }

    // 2. Get appointment statistics per agent (via CustomerRecord)
    let aptQ = this.appointmentsRepository
      .createQueryBuilder('apt')
      .innerJoin('customer_records', 'rec', 'rec.customerId = apt.clientId')
      .innerJoin('users', 'agent', 'agent.id = rec.assignedSalespersonId')
      .leftJoin('services', 'svc', 'svc.id = apt.serviceId')
      .select('rec.assignedSalespersonId', 'agentId')
      .addSelect("CONCAT(agent.firstName, ' ', agent.lastName)", 'agentName')
      .addSelect('COUNT(apt.id)', 'totalAppointments')
      .addSelect("COUNT(CASE WHEN apt.status = 'completed' THEN 1 END)", 'completedAppointments')
      .addSelect("COUNT(CASE WHEN apt.status = 'no_show' THEN 1 END)", 'noShows')
      .addSelect("COUNT(CASE WHEN apt.status = 'cancelled' THEN 1 END)", 'cancellations')
      .addSelect('COALESCE(SUM(CASE WHEN apt.status IN (\'completed\', \'confirmed\') THEN COALESCE(apt.totalAmount, svc.price, 0) ELSE 0 END), 0)', 'totalRevenue')
      .where('rec.assignedSalespersonId IS NOT NULL')
      .groupBy('rec.assignedSalespersonId, agent.firstName, agent.lastName');

    if (dateRange) {
      aptQ = aptQ.andWhere('apt.startTime BETWEEN :startDate AND :endDate', dateRange);
    }

    const aptStats = await aptQ.getRawMany();

    // Merge with appointment stats
    for (const apt of aptStats) {
      const existing = agentMap.get(apt.agentId) || {
        agentId: apt.agentId,
        agentName: apt.agentName,
        totalCommunications: 0,
        totalCalls: 0,
        answeredCalls: 0,
        missedCalls: 0,
        totalDuration: 0,
        totalLeads: 0,
        convertedLeads: 0,
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

    // 3. Get lead statistics per agent
    let leadQ = this.leadsRepository
      .createQueryBuilder('lead')
      .select('lead.assignedSalesId', 'agentId')
      .addSelect('COUNT(lead.id)', 'totalLeads')
      .addSelect("COUNT(CASE WHEN lead.status = 'converted' THEN 1 END)", 'convertedLeads')
      .where('lead.assignedSalesId IS NOT NULL')
      .groupBy('lead.assignedSalesId');

    if (dateRange) {
      leadQ = leadQ.andWhere('lead.createdAt BETWEEN :startDate AND :endDate', dateRange);
    }

    const leadStats = await leadQ.getRawMany();

    // Merge with lead stats
    for (const lead of leadStats) {
      if (!lead.agentId) continue;

      const existing = agentMap.get(lead.agentId) || {
        agentId: lead.agentId,
        agentName: 'Unknown Agent',
        totalCommunications: 0,
        totalCalls: 0,
        answeredCalls: 0,
        missedCalls: 0,
        totalDuration: 0,
        totalAppointments: 0,
        completedAppointments: 0,
        noShows: 0,
        cancellations: 0,
        totalRevenue: 0,
      };

      agentMap.set(lead.agentId, {
        ...existing,
        totalLeads: parseInt(lead.totalLeads, 10) || 0,
        convertedLeads: parseInt(lead.convertedLeads, 10) || 0,
      });
    }

    return Array.from(agentMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  async getServiceStats(dateRange?: { startDate: Date; endDate: Date }): Promise<any[]> {
    let q = this.appointmentsRepository
      .createQueryBuilder('apt')
      .leftJoin('apt.service', 'service')
      .leftJoin('service.treatment', 'treatment')
      .select('treatment.name', 'serviceName')
      .addSelect('COUNT(apt.id)', 'count')
      .addSelect('SUM(COALESCE(apt.totalAmount, service.price, 0))', 'revenue')
      .groupBy('treatment.name');
    if (dateRange) {
      q = q.andWhere('apt.startTime BETWEEN :startDate AND :endDate', dateRange);
    }
    return q.getRawMany();
  }

  async getClinicAnalytics(dateRange?: { startDate: Date; endDate: Date }, clinicId?: string): Promise<any[]> {
    // 1. Get clinics
    const clinics = await this.clinicsRepository.find({
      where: {
        isActive: true,
        ...(clinicId ? { id: clinicId } : {})
      },
    });

    // 2. Get appointment stats
    let qb = this.appointmentsRepository
      .createQueryBuilder('apt')
      .leftJoin('apt.service', 'svc')
      .select('apt.clinicId', 'clinicId')
      .addSelect('COUNT(apt.id)', 'totalAppointments')
      .addSelect('COUNT(DISTINCT apt.clientId)', 'uniqueClients')
      .addSelect("COUNT(CASE WHEN apt.status = 'completed' THEN 1 END)", 'completed')
      .addSelect("COUNT(CASE WHEN apt.status = 'cancelled' THEN 1 END)", 'cancelled')
      .addSelect("COUNT(CASE WHEN apt.status = 'no_show' THEN 1 END)", 'noShow')
      .addSelect('COALESCE(SUM(COALESCE(apt.totalAmount, svc.price, 0)), 0)', 'totalRevenue')
      .groupBy('apt.clinicId');

    if (dateRange) {
      qb = qb.andWhere('apt.startTime BETWEEN :startDate AND :endDate', dateRange);
    }

    if (clinicId) {
      qb = qb.andWhere('apt.clinicId = :clinicId', { clinicId });
    }

    const stats = await qb.getRawMany();

    // 3. Merge stats with clinics
    return clinics.map((clinic) => {
      // Find stats for this clinic, checking for case-sensitive keys from generic raw results
      const clinicStats = stats.find((s) => (s.clinicId || s.clinicid) === clinic.id) || {};
      return {
        clinicId: clinic.id,
        clinicName: clinic.name,
        phone: clinic.phone,
        address: clinic.address,
        treatmentRooms: clinic.treatmentRooms,
        totalAppointments: parseInt(clinicStats.totalAppointments || clinicStats.totalappointments) || 0,
        uniqueClients: parseInt(clinicStats.uniqueClients || clinicStats.uniqueclients) || 0,
        completed: parseInt(clinicStats.completed) || 0,
        cancelled: parseInt(clinicStats.cancelled) || 0,
        noShow: parseInt(clinicStats.noShow || clinicStats.noshow) || 0,
        totalRevenue: parseFloat(clinicStats.totalRevenue || clinicStats.totalrevenue) || 0,
      };
    });
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

  async getPerformanceDashboard(dateRange?: { startDate: Date; endDate: Date }, salespersonId?: string, clinicId?: string) {
    const defaultDateRange = dateRange || {
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
      endDate: new Date()
    };

    const aptQ = this.appointmentsRepository.createQueryBuilder('apt')
      .leftJoin('apt.client', 'client')
      .leftJoin('apt.service', 'service')
      .leftJoin('service.treatment', 'treatment')
      .leftJoin('users', 'agent', 'agent.id = apt.bookedById OR apt.providerId = agent.id')
      .select('apt.id', 'id')
      .addSelect('apt.startTime', 'date')
      .addSelect('treatment.name', 'eventType')
      .addSelect('apt.status', 'status')
      .addSelect('apt.totalAmount', 'revenue')
      .addSelect('apt.notes', 'notes')
      .addSelect("CONCAT(client.firstName, ' ', client.lastName)", 'clientName')
      .addSelect("CONCAT(agent.firstName, ' ', agent.lastName)", 'agentName')
      .addSelect('agent.id', 'agentId')
      .where('apt.startTime BETWEEN :startDate AND :endDate', defaultDateRange);

    if (salespersonId) {
      aptQ.andWhere('agent.id = :salespersonId', { salespersonId });
    }

    if (clinicId) {
      aptQ.andWhere('apt.clinicId = :clinicId', { clinicId });
    }

    const apts = await aptQ.getRawMany();

    const actQ = this.crmActionsRepository.createQueryBuilder('act')
      .leftJoin('act.salesperson', 'agent')
      .leftJoin('customer_records', 'cr', 'cr.customerId = act.customerId')
      .leftJoin('users', 'client', 'client.id = cr.customerId')
      .select('act.id', 'id')
      .addSelect('act.createdAt', 'date')
      .addSelect('act.actionType', 'eventType')
      .addSelect('act.title', 'taskPerformed')
      .addSelect('act.status', 'status')
      .addSelect("CONCAT(client.firstName, ' ', client.lastName)", 'clientName')
      .addSelect("CONCAT(agent.firstName, ' ', agent.lastName)", 'agentName')
      .addSelect('agent.id', 'agentId')
      .where('act.createdAt BETWEEN :startDate AND :endDate', defaultDateRange);

    if (salespersonId) {
      actQ.andWhere('agent.id = :salespersonId', { salespersonId });
    }

    // Actions are usually clinic-agnostic but if clinic filtering is active, we might limit to actions on customers linked to that clinic
    // For now, we mainly filter appointments and leads if they have clinic context.

    const actions = await actQ.getRawMany();

    const activities = [
      ...apts.map(a => ({
        id: a.id,
        salesPersonName: a.agentName || 'Unassigned',
        salesPersonId: a.agentId,
        clientName: a.clientName || 'Unknown',
        date: a.date,
        eventType: 'Appointment',
        taskPerformed: a.eventType,
        taskResult: a.status,
        bookingStatus: a.status,
        revenue: parseFloat(a.revenue) || 0,
        executionStatus: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW].includes(a.status as any) ? 'Executed' : 'Not Executed',
        rebookingRequest: a.notes?.toLowerCase().includes('rebook') ? 'Yes' : 'No'
      })),
      ...actions.map(a => ({
        id: a.id,
        salesPersonName: a.agentName || 'Unassigned',
        salesPersonId: a.agentId,
        clientName: a.clientName || 'Unknown',
        date: a.date,
        eventType: 'Task',
        taskPerformed: a.taskPerformed,
        taskResult: a.status,
        bookingStatus: 'N/A',
        revenue: 0,
        executionStatus: ['completed', 'cancelled', 'missed'].includes(a.status) ? 'Executed' : 'Not Executed',
        rebookingRequest: 'No'
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const dateMap = new Map();
    const startObj = new Date(defaultDateRange.startDate);
    const endObj = new Date(defaultDateRange.endDate);
    for (let d = new Date(startObj); d <= endObj; d.setDate(d.getDate() + 1)) {
      dateMap.set(d.toISOString().split('T')[0], { confirmed: 0, cancelled: 0, noShow: 0, revenue: 0, total: 0 });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let dailyStats = { total: 0, confirmed: 0, cancelled: 0, noShow: 0, revenue: 0 };

    for (const a of apts) {
      const dStr = new Date(a.date).toISOString().split('T')[0];
      if (dateMap.has(dStr)) {
        const m = dateMap.get(dStr);
        m.total++;
        if (a.status === AppointmentStatus.COMPLETED || a.status === AppointmentStatus.CONFIRMED) m.confirmed++;
        if (a.status === AppointmentStatus.CANCELLED) m.cancelled++;
        if (a.status === AppointmentStatus.NO_SHOW) m.noShow++;
        m.revenue += parseFloat(a.revenue) || 0;
        dateMap.set(dStr, m);
      }

      if (dStr === todayStr) {
        dailyStats.total++;
        if (a.status === AppointmentStatus.COMPLETED || a.status === AppointmentStatus.CONFIRMED) dailyStats.confirmed++;
        if (a.status === AppointmentStatus.CANCELLED) dailyStats.cancelled++;
        if (a.status === AppointmentStatus.NO_SHOW) dailyStats.noShow++;
        dailyStats.revenue += parseFloat(a.revenue) || 0;
      }
    }

    const dailyProgressChart = Array.from(dateMap.entries()).map(([date, stats]) => ({
      date,
      ...stats
    }));

    const salesPersonsMap = new Map();
    const getSpObj = (id: string, name: string) => {
      if (!salesPersonsMap.has(id)) {
        salesPersonsMap.set(id, { id, name, leads: 0, confirmedBookings: 0, revenue: 0, assignedTasks: 0, completedTasks: 0, executedBookings: 0, totalBookings: 0 });
      }
      return salesPersonsMap.get(id);
    };

    const leadQ = this.leadsRepository.createQueryBuilder('l')
      .select('l.assignedSalesId', 'agentId')
      .addSelect('COUNT(l.id)', 'count')
      .where('l.createdAt BETWEEN :startDate AND :endDate', defaultDateRange);
    if (salespersonId) leadQ.andWhere('l.assignedSalesId = :salespersonId', { salespersonId });

    // If Lead entity has clinic context, add it here. For now, we assume global or filtered by agent.

    const leadsData = await leadQ.groupBy('l.assignedSalesId').getRawMany();

    for (const ld of leadsData) {
      if (ld.agentId) {
        const sp = getSpObj(ld.agentId, 'Unknown');
        sp.leads += parseInt(ld.count);
      }
    }

    for (const a of activities) {
      if (!a.salesPersonId) continue;
      const sp = getSpObj(a.salesPersonId, a.salesPersonName);
      if (a.eventType === 'Appointment') {
        sp.totalBookings++;
        if (a.bookingStatus === AppointmentStatus.COMPLETED || a.bookingStatus === AppointmentStatus.CONFIRMED) sp.confirmedBookings++;
        sp.revenue += a.revenue;
        if (a.executionStatus === 'Executed') sp.executedBookings++;
      } else {
        sp.assignedTasks++;
        if (a.taskResult === 'completed') sp.completedTasks++;
      }
    }

    const performanceReport = Array.from(salesPersonsMap.values()).map(sp => {
      const conversionRate = sp.leads > 0 ? (sp.confirmedBookings / sp.leads) * 100 : (sp.confirmedBookings > 0 ? 100 : 0);
      const taskCompletionRate = sp.assignedTasks > 0 ? (sp.completedTasks / sp.assignedTasks) * 100 : 100;
      const bookingExecutionRate = sp.totalBookings > 0 ? (sp.executedBookings / sp.totalBookings) * 100 : 100;

      return {
        salesPerson: sp.name,
        leads: sp.leads,
        confirmedBookings: sp.confirmedBookings,
        revenue: sp.revenue,
        conversionRate: conversionRate.toFixed(1),
        taskCompletionRate: taskCompletionRate.toFixed(1),
        bookingExecutionRate: bookingExecutionRate.toFixed(1),
        assignedTasks: sp.assignedTasks,
        completedTasks: sp.completedTasks,
        totalBookings: sp.totalBookings,
        performanceScore: "0"
      };
    });

    const maxRev = Math.max(...performanceReport.map(r => r.revenue), 1);

    performanceReport.forEach(r => {
      r.performanceScore = (
        ((r.revenue / maxRev) * 30) +
        ((parseFloat(r.conversionRate) / 100) * 30) +
        ((parseFloat(r.taskCompletionRate) / 100) * 20) +
        ((parseFloat(r.bookingExecutionRate) / 100) * 20)
      ).toFixed(1);
    });

    const totals = {
      leads: performanceReport.reduce((sum, r) => sum + r.leads, 0),
      confirmedBookings: performanceReport.reduce((sum, r) => sum + r.confirmedBookings, 0),
      revenue: performanceReport.reduce((sum, r) => sum + r.revenue, 0),
      assignedTasks: performanceReport.reduce((sum, r) => sum + r.assignedTasks, 0),
      completedTasks: performanceReport.reduce((sum, r) => sum + r.completedTasks, 0),
      totalBookings: performanceReport.reduce((sum, r) => sum + r.totalBookings, 0)
    };

    // --- Action Center Metrics (Step 5 - Backend Queries) ---
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const hotLeadsCount = await this.leadsRepository.count({
      where: {
        status: LeadStatus.NEW,
        ...(salespersonId ? { assignedSalesId: salespersonId } : {}),
      }
    });

    const overdueTasksCount = await this.crmActionsRepository.count({
      where: {
        status: In(['pending', 'in_progress']),
        dueDate: Between(new Date(0), new Date()), // Any date in past including now
        ...(salespersonId ? { salespersonId: salespersonId } : {}),
      }
    });

    const followupsDueTodayCount = await this.crmActionsRepository.count({
      where: {
        status: In(['pending', 'in_progress']),
        dueDate: Between(todayStart, todayEnd),
        ...(salespersonId ? { salespersonId: salespersonId } : {}),
      }
    });

    const noContact7DaysCount = await this.leadsRepository.count({
      where: {
        status: In([LeadStatus.NEW, LeadStatus.CONTACTED]),
        lastContactedAt: Between(new Date(0), sevenDaysAgo),
        ...(salespersonId ? { assignedSalesId: salespersonId } : {}),
      }
    });

    const leadsByStatus = await this.leadsRepository.createQueryBuilder('l')
      .select('l.status', 'status')
      .addSelect('COUNT(l.id)', 'count')
      .where(salespersonId ? 'l.assignedSalesId = :salespersonId' : '1=1', { salespersonId })
      .groupBy('l.status')
      .getRawMany();

    const sourceBreakdown = await this.leadsRepository.createQueryBuilder('l')
      .select('l.source', 'source')
      .addSelect('COUNT(l.id)', 'count')
      .where(salespersonId ? 'l.assignedSalesId = :salespersonId' : '1=1', { salespersonId })
      .groupBy('l.source')
      .getRawMany();

    const clinicPerformance = await this.appointmentsRepository.createQueryBuilder('apt')
      .innerJoin('apt.clinic', 'clinic')
      .select('clinic.name', 'name')
      .addSelect('clinic.id', 'id')
      .addSelect('COALESCE(SUM(apt.totalAmount), 0)', 'revenue')
      .addSelect('COUNT(apt.id)', 'appointments')
      .where('apt.startTime BETWEEN :startDate AND :endDate', defaultDateRange)
      .groupBy('clinic.id, clinic.name')
      .getRawMany();

    return {
      reportTable: activities,
      dailyStats,
      dailyProgressChart,
      salesConversionAnalytics: totals,
      performanceReport,
      monthlyTarget: 125000, // Default target
      actionCenter: {
        hotLeads: hotLeadsCount,
        overdueTasks: overdueTasksCount,
        followupsDueToday: followupsDueTodayCount,
        noContact7Days: noContact7DaysCount
      },
      pipeline: {
        leadsByStatus,
        sourceBreakdown
      },
      clinicPerformance
    };
  }

  async sendWeeklyAgentReports(): Promise<{ sent: number }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    let sent = 0;

    // 1. Send individual reports to Salespersons
    const agents = await this.usersRepository.find({ where: { role: UserRole.SALESPERSON } });
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

    // 2. Send Global Report to Managers and Admins
    const managersAndAdmins = await this.usersRepository.find({
      where: [
        { role: UserRole.MANAGER },
        { role: UserRole.ADMIN },
        { role: UserRole.SUPER_ADMIN }
      ]
    });

    if (managersAndAdmins.length > 0) {
      const globalKpis = await this.getManagerAgentKpis({ startDate, endDate });
      for (const user of managersAndAdmins) {
        await this.notificationsService.create(
          user.id,
          NotificationType.EMAIL,
          'Weekly Global Sales Report (Manager View)',
          'The weekly aggregate sales report for all agents is ready.',
          { globalKpis }
        );
        sent++;
      }
    }

    return { sent };
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
      .addSelect("COUNT(CASE WHEN log.type = 'call' AND (log.status NOT IN ('missed', 'no_answer', 'voicemail') OR (log.metadata->>'callOutcome') = 'answered') THEN 1 END)", 'realCommunications')
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
      .leftJoin('users', 'agent', 'agent.id = apt.bookedById')
      .select('apt.bookedById', 'agentId')
      .addSelect("CONCAT(agent.firstName, ' ', agent.lastName)", 'agentName')
      .addSelect('COUNT(apt.id)', 'booked')
      .addSelect("COUNT(CASE WHEN apt.status = 'COMPLETED' THEN 1 END)", 'attended')
      .addSelect("COUNT(CASE WHEN apt.status = 'COMPLETED' AND (apt.treatmentDetails IS NOT NULL OR apt.serviceExecuted = true) THEN 1 END)", 'treatmentsCompleted')
      .addSelect("COUNT(CASE WHEN apt.status = 'CANCELLED' THEN 1 END)", 'cancelled')
      .addSelect("COUNT(CASE WHEN apt.status = 'NO_SHOW' THEN 1 END)", 'noShows')
      .where('apt.bookedById IS NOT NULL');

    if (dateRange) {
      query = query.andWhere('apt.startTime BETWEEN :startDate AND :endDate', dateRange);
    }

    query = query.groupBy('apt.bookedById, agent.firstName, agent.lastName');

    const results = await query.getRawMany();
    return results.map(row => ({
      agentId: row.agentId,
      agentName: row.agentName || 'Unknown Agent',
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
      .leftJoin('users', 'agent', 'agent.id = apt.bookedById')
      .select('apt.bookedById', 'agentId')
      .addSelect("CONCAT(agent.firstName, ' ', agent.lastName)", 'agentName')
      .addSelect('COALESCE(SUM(apt.totalAmount), 0)', 'revenue')
      .addSelect('COALESCE(SUM(CASE WHEN apt.status = \'cancelled\' AND apt.totalAmount > 0 THEN apt.totalAmount ELSE 0 END), 0)', 'refunds')
      .where('apt.bookedById IS NOT NULL');

    if (dateRange) {
      query = query.andWhere('apt.startTime BETWEEN :startDate AND :endDate', dateRange);
    }

    query = query.groupBy('apt.bookedById, agent.firstName, agent.lastName');

    const results = await query.getRawMany();
    return results.map(row => ({
      agentId: row.agentId,
      agentName: row.agentName || 'Unknown Agent',
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

    // Use repository to transparently handle column mapping
    const accessRecords = await this.agentClinicAccessRepository.find();

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
    // 1. Delete existing access records for this agent using repository to honor column mapping
    await this.agentClinicAccessRepository.delete({ agentUserId: agentId });

    // 2. Map and create new access entities for clinics that should have access
    const entitiesToCreate = clinicAccess
      .filter(access => access.hasAccess)
      .map(access => this.agentClinicAccessRepository.create({
        agentUserId: agentId,
        clinicId: access.clinicId
      }));

    // 3. Save all new access records in bulk
    if (entitiesToCreate.length > 0) {
      await this.agentClinicAccessRepository.save(entitiesToCreate);
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
      .leftJoin('apt.representative', 'rep')
      .leftJoin('apt.bookedBy', 'agent')
      .leftJoin('apt.clinic', 'clinic')
      .leftJoin('apt.client', 'client')
      .select('apt.id', 'appointmentId')
      .addSelect('apt.clientId', 'patientId')
      .addSelect("COALESCE(CONCAT(rep.firstName, ' ', rep.lastName), CONCAT(agent.firstName, ' ', agent.lastName))", 'agentName')
      .addSelect('clinic.name', 'clinicName')
      .addSelect('apt.startTime', 'date')
      .addSelect('EXTRACT(DAY FROM CURRENT_DATE - apt.startTime)', 'daysAgo')
      .addSelect("CONCAT(COALESCE(client.firstName, ''), ' ', COALESCE(client.lastName, ''))", 'patientName')
      .where('apt.status = :status', { status: AppointmentStatus.NO_SHOW })
      .andWhere('apt.startTime >= :thresholdDate', { thresholdDate });

    // Note: Since Appointment doesn't have metadata field, we'll return all no-shows
    // In a real implementation, you might add a separate table for tracking no-show resolutions
    const results = await qb.getRawMany();
    return results.map(row => ({
      appointmentId: row.appointmentId,
      patientId: row.patientId,
      patientName: row.patientName?.trim() || 'Unknown',
      agentName: row.agentName || 'Unassigned',
      clinicName: row.clinicName,
      date: row.date.toISOString().split('T')[0],
      daysAgo: parseInt(row.daysAgo) || 0,
      actionRecommended: 'Call patient to reschedule'
    }));
  }

  async resolveNoShowAlert(appointmentId: string, resolutionNote: string, salespersonId?: string) {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id: appointmentId },
      relations: ['client', 'representative', 'bookedBy']
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const record = await this.customerRecordsRepository.findOne({ where: { customerId: appointment.clientId } });

    // Assign to: salespersonId (if provided) -> appointment.representativeId -> appointment.bookedById -> customerRecord.assignedSalespersonId -> fallback
    let assignedId = salespersonId || appointment.representativeId || appointment.bookedById || record?.assignedSalespersonId;

    if (!assignedId) {
      const fallbackAgent = await this.usersRepository.findOne({
        where: { role: In([UserRole.SALESPERSON, UserRole.MANAGER, UserRole.ADMIN]) }
      });
      assignedId = fallbackAgent?.id;
    }

    if (assignedId && appointment.clientId) {
      this.logger.log(`[resolveNoShowAlert] Creating follow-up task for appointment ${appointmentId}, patient ${appointment.clientId}`);

      try {
        await this.createAction({
          customerId: appointment.clientId,
          salespersonId: assignedId,
          actionType: 'follow_up_call' as any,
          title: `High Priority: No-Show Follow-up`,
          description: `Patient missed appointment on ${appointment.startTime.toLocaleDateString()}. Resolution note: ${resolutionNote}. Please follow up to reschedule.`,
          priority: 'high',
          dueDate: new Date(Date.now() + 86400000), // Tomorrow
          status: 'pending'
        });
      } catch (error) {
        this.logger.error(`[resolveNoShowAlert] Failed to create follow-up task: ${error.message}`);
      }
    }

    return { success: true, message: 'No-show resolved and task created' };
  }

  // Additional Analytics Methods
  async getClinicReturnRates() {
    try {
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
            .andWhere('apt.status = :status', { status: AppointmentStatus.COMPLETED })
            .andWhere('apt.startTime >= :date', { date: thirtyDaysAgo })
            .getRawMany();

          // Get unique clients in the last 90 days
          const last90DaysClients = await this.appointmentsRepository
            .createQueryBuilder('apt')
            .select('DISTINCT apt.clientId')
            .where('apt.clinicId = :clinicId', { clinicId: clinic.id })
            .andWhere('apt.status = :status', { status: AppointmentStatus.COMPLETED })
            .andWhere('apt.startTime >= :date', { date: ninetyDaysAgo })
            .getRawMany();

          // Get all unique clients who have ever visited
          const allTimeClients = await this.appointmentsRepository
            .createQueryBuilder('apt')
            .select('DISTINCT apt.clientId')
            .where('apt.clinicId = :clinicId', { clinicId: clinic.id })
            .andWhere('apt.status = :status', { status: AppointmentStatus.COMPLETED })
            .getRawMany();

          // Count repeat clients in last 30 days (clients who had more than one appointment)
          const repeatClients30 = await this.appointmentsRepository
            .createQueryBuilder('apt')
            .select('apt.clientId')
            .addSelect('COUNT(apt.id)', 'appointmentCount')
            .where('apt.clinicId = :clinicId', { clinicId: clinic.id })
            .andWhere('apt.status = :status', { status: AppointmentStatus.COMPLETED })
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
    } catch (error) {
      console.error('Error fetching clinic return rates:', error);
      return [];
    }
  }

  async getServicePerformance(dateRange?: { startDate: Date; endDate: Date }) {
    let query = this.appointmentsRepository
      .createQueryBuilder('apt')
      .leftJoin('apt.service', 'service')
      .leftJoin('service.treatment', 'treatment')
      .select('service.id', 'serviceId')
      .addSelect('treatment.name', 'serviceName')
      .addSelect('COUNT(apt.id)', 'totalAppointments')
      .addSelect('COALESCE(SUM(apt.totalAmount), 0)', 'totalRevenue')
      .addSelect("COUNT(CASE WHEN apt.status = 'CANCELLED' THEN 1 END)", 'cancellations')
      .where('service.id IS NOT NULL');

    if (dateRange) {
      query = query.andWhere('apt.startTime BETWEEN :startDate AND :endDate', dateRange);
    }

    query = query.groupBy('service.id, treatment.name');

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
        COALESCE(SUM("ad_spend_logs"."amount"), 0) as "spent",
        COALESCE(CONCAT(agent."firstName", ' ', agent."lastName"), 'Unassigned') as "agentBudgetOwner"
      FROM "ad_spend_logs"
      LEFT JOIN "ad_campaigns" "campaign" ON "campaign"."id" = "ad_spend_logs"."campaignId"
      LEFT JOIN "users" "agent" ON "agent"."id" = "campaign"."ownerAgentId"
      WHERE "campaign"."id" IS NOT NULL
    `;

    const params: any[] = [];

    if (dateRange) {
      sql += ` AND "ad_spend_logs"."date" BETWEEN $1 AND $2`;
      params.push(dateRange.startDate, dateRange.endDate);
    }

    sql += ` GROUP BY "campaign"."id", "campaign"."channel", "campaign"."platform", "campaign"."name", "agent"."firstName", "agent"."lastName"`;

    try {
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
            .addSelect("COUNT(CASE WHEN apt.status = 'CANCELLED' THEN 1 END)", 'cancelled')
            .addSelect('COALESCE(SUM(apt.totalAmount), 0)', 'totalRevenue')
            .where('aa.adCampaignId = :campaignId', { campaignId: row.adId });

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

    } catch (error) {
      console.error('Error fetching ad stats:', error);
      return [];
    }
  }

  async getAccessibleClinicsForUser(userId: string): Promise<Clinic[]> {
    try {
      this.logger.debug(`[CrmService] Fetching accessible clinics for user: ${userId}`);
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Role-based access: Management roles see all active clinics
      if ([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.SALESPERSON].includes(user.role as UserRole)) {
        // Admins and Global Sales see all active clinics
        return this.clinicsRepository.find({
          where: { isActive: true },
          select: ['id', 'name', 'address', 'phone', 'email']
        });
      }

      const accessibleClinicIds = new Set<string>();

      // For CLINIC_OWNER, DOCTOR, SECRETARIAT, they see:
      // 1. Direct ownership (via clinics table ownerId)
      // 2. Ownership via clinic_ownership table
      // 3. Staff assignment (assignedClinicId in users table)
      // 4. Agent access grants

      // 1. Direct ownership
      const ownedDirectly = await this.clinicsRepository.find({
        where: { ownerId: userId, isActive: true },
        select: ['id']
      });
      ownedDirectly.forEach(c => accessibleClinicIds.add(c.id));

      // 2. Ownership via clinic_ownership table
      const ownershipTable = await this.clinicOwnershipRepository.find({
        where: { ownerUserId: userId }
      });
      ownershipTable.forEach(o => accessibleClinicIds.add(o.clinicId));

      // 3. Staff assignment (assignedClinicId in users table)
      if (user.assignedClinicId) {
        accessibleClinicIds.add(user.assignedClinicId);
      }

      // 4. Agent/Salesperson access grants
      const agentAccesses = await this.agentClinicAccessRepository.find({
        where: { agentUserId: userId }
      });
      agentAccesses.forEach(a => accessibleClinicIds.add(a.clinicId));

      if (accessibleClinicIds.size === 0) {
        this.logger.debug(`[CrmService] No accessible clinics found for user: ${userId}`);
        return [];
      }

      return this.clinicsRepository.find({
        where: { id: In(Array.from(accessibleClinicIds)), isActive: true },
        select: ['id', 'name', 'address', 'phone', 'email']
      });
    } catch (err) {
      this.logger.error(`[CrmService] Error in getAccessibleClinicsForUser: ${err.message}`, err.stack);
      throw err;
    }
  }

  async getSalespersons(): Promise<any[]> {
    const users = await this.usersRepository.find({
      where: {
        role: In([UserRole.SALESPERSON, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT]),
        isActive: true
      },
      select: ['id', 'firstName', 'lastName', 'email', 'phone', 'profilePictureUrl', 'role'],
    });

    const pendingCounts = await this.crmActionsRepository
      .createQueryBuilder('action')
      .select('action.salespersonId', 'salespersonId')
      .addSelect('COUNT(action.id)', 'count')
      .where('action.status = :status', { status: 'pending' })
      .groupBy('action.salespersonId')
      .getRawMany();

    const countMap = pendingCounts.reduce((acc, curr) => {
      acc[curr.salespersonId] = parseInt(curr.count);
      return acc;
    }, {});

    return users.map(user => ({
      ...user,
      pendingTasksCount: countMap[user.id] || 0
    }));
  }

  async getSalesActivities(date?: Date, salespersonId?: string): Promise<any[]> {
    const startDate = date ? new Date(date) : new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);

    const whereActionDueDate: any = {
      dueDate: Between(startDate, endDate),
    };
    if (salespersonId) whereActionDueDate.salespersonId = salespersonId;

    const whereActionCreatedAt: any = {
      createdAt: Between(startDate, endDate),
      dueDate: IsNull(),
    };
    if (salespersonId) whereActionCreatedAt.salespersonId = salespersonId;

    // Fetch CRM Actions
    const actions = await this.crmActionsRepository.find({
      where: [whereActionDueDate, whereActionCreatedAt],
      relations: ['salesperson', 'customer', 'customer.customer'],
    });

    const whereTask: any = {
      dueDate: Between(startDate, endDate),
    };
    if (salespersonId) whereTask.assigneeId = salespersonId;

    // Fetch Tasks
    const tasks = await this.dataSource.getRepository(Task).find({
      where: whereTask,
      relations: ['assignee', 'customer'],
    }) as any[];

    // Fetch Appointments (Self-booked or otherwise)
    const whereAppointment: any = {
      startTime: Between(startDate, endDate),
      status: Not(AppointmentStatus.CANCELLED)
    };

    const appointments = await this.appointmentsRepository.find({
      where: salespersonId ? [
        { ...whereAppointment, providerId: salespersonId },
        { ...whereAppointment, bookedById: salespersonId }
      ] : whereAppointment,
      relations: ['client', 'service', 'service.treatment', 'provider'],
    });

    // Standardize format for Diary
    const standardizedActivities = [
      ...actions.map(action => ({
        id: action.id,
        title: action.title,
        type: 'action',
        actionType: action.actionType,
        status: action.status,
        startTime: action.dueDate || action.createdAt,
        endTime: new Date(new Date(action.dueDate || action.createdAt).getTime() + 30 * 60000),
        salespersonId: action.salespersonId,
        customerName: action.customer?.customer
          ? `${action.customer.customer.firstName} ${action.customer.customer.lastName}`
          : 'N/A',
      })),
      ...tasks.map(task => ({
        id: task.id,
        title: task.title,
        type: 'task',
        taskType: task.type,
        status: task.status,
        startTime: task.dueDate,
        endTime: new Date(new Date(task.dueDate).getTime() + 30 * 60000),
        salespersonId: task.assigneeId,
        customerName: task.customer ? `${task.customer.firstName} ${task.customer.lastName}` : 'N/A',
      })),
      ...appointments.map(apt => ({
        id: apt.id,
        title: (apt as any).service?.treatment?.name || 'Appointment',
        type: 'appointment' as const,
        status: apt.status,
        startTime: apt.startTime,
        endTime: apt.endTime,
        salespersonId: apt.providerId || apt.bookedById,
        customerName: apt.client ? `${apt.client.firstName} ${apt.client.lastName}` : (apt.clientDetails?.fullName || 'Guest'),
        clinicId: apt.clinicId,
      })),
    ];

    return standardizedActivities;
  }

  @OnEvent('appointment.created')
  async handleAppointmentCreated(appointment: Appointment) {
    if (!appointment || !appointment.clientId) return;

    // 1. Handle Lead Conversion Visibility
    let lead = await this.leadsRepository.findOne({
      where: { id: appointment.clientId },
    });

    if (!lead && (appointment.client?.email || appointment.clientDetails?.email)) {
      const email = appointment.client?.email || appointment.clientDetails?.email;
      lead = await this.leadsRepository.findOne({
        where: { email },
      });
    }

    if (lead && lead.status !== LeadStatus.CONVERTED) {
      const oldStatus = lead.status;
      lead.status = LeadStatus.CONVERTED;
      lead.convertedAt = new Date();
      await this.leadsRepository.save(lead);

      this.eventEmitter.emit('lead.status.changed', {
        lead: lead,
        oldStatus: oldStatus,
        newStatus: LeadStatus.CONVERTED,
      });

      this.logger.log(`Changed lead status for ${lead.id} from ${oldStatus} to ${LeadStatus.CONVERTED} due to appointment created`);
    }

    // 2. Update Customer Record Summary
    // Note: Booked appointments should be "supposed" / credited to the client record immediately
    const customerId = appointment.clientId;
    let record = await this.customerRecordsRepository.findOne({ where: { customerId } });

    // If no record found (likely a new guest), search by phone/email to avoid duplicates
    if (!record && (appointment.client?.phone || appointment.clientDetails?.phone)) {
      const email = appointment.client?.email || appointment.clientDetails?.email;
      const phone = appointment.client?.phone || appointment.clientDetails?.phone;

      const existingUser = await this.usersRepository.findOne({
        where: [{ email }, { phone }]
      });

      if (existingUser) {
        record = await this.customerRecordsRepository.findOne({ where: { customerId: existingUser.id } });
      }
    }

    if (record) {
      // Increment total visits (booked)
      record.totalAppointments = (record.totalAppointments || 0) + 1;

      const aptDate = new Date(appointment.startTime);

      // Update visit dates
      if (!record.lastAppointmentDate || aptDate > record.lastAppointmentDate) {
        record.lastAppointmentDate = aptDate;
      }

      // Update next appointment if it's in the future
      if (aptDate > new Date()) {
        if (!record.nextAppointmentDate || aptDate < record.nextAppointmentDate) {
          record.nextAppointmentDate = aptDate;
        }
      }

      // Track clinic history
      record.lastClinicId = appointment.clinicId;
      if (appointment.providerId) record.lastDoctorId = appointment.providerId;

      await this.customerRecordsRepository.save(record);
      this.logger.log(`Updated CustomerRecord ${record.id} for client ${customerId} due to booking`);
    }
  }

  @OnEvent('appointment.status.changed')
  async handleAppointmentStatusChanged(eventData: any) {
    const { appointment, newStatus, oldStatus } = eventData;
    if (!appointment || !appointment.clientId) return;

    if (newStatus === AppointmentStatus.COMPLETED) {
      // 1. Conversion check (redundant but safe)
      const lead = await this.leadsRepository.findOne({ where: { id: appointment.clientId } });
      if (lead && lead.status !== LeadStatus.CONVERTED) {
        lead.status = LeadStatus.CONVERTED;
        lead.convertedAt = new Date();
        await this.leadsRepository.save(lead);
      }

      // 2. Update Customer Record execution stats
      const record = await this.customerRecordsRepository.findOne({
        where: { customerId: appointment.clientId }
      });

      if (record) {
        record.completedAppointments = (record.completedAppointments || 0) + 1;
        record.lifetimeValue = Number(record.lifetimeValue || 0) + Number(appointment.totalAmount || 0);
        record.isRepeatCustomer = record.completedAppointments > 1;
        await this.customerRecordsRepository.save(record);

        // 3. Update Clinic/Doctor Affiliation history
        try {
          const treatmentName = appointment.service?.treatment?.name || appointment.service?.name;
          await this.customerAffiliationService.updateClinicAffiliation(
            appointment.clientId,
            appointment.clinicId,
            appointment.providerId || undefined,
            {
              totalAmount: appointment.totalAmount,
              treatment: treatmentName,
              appointmentId: appointment.id
            }
          );
        } catch (affError) {
          this.logger.error(`Failed to update affiliation for client ${appointment.clientId}:`, affError);
        }
      }
    } else if (newStatus === AppointmentStatus.CANCELLED) {
      const record = await this.customerRecordsRepository.findOne({
        where: { customerId: appointment.clientId }
      });
      if (record) {
        record.cancelledAppointments = (record.cancelledAppointments || 0) + 1;
        await this.customerRecordsRepository.save(record);
      }
    }
  }

  async getGlobalCallLogs(filters?: { startDate?: Date; endDate?: Date; salespersonId?: string }): Promise<any> {
    const qb = this.communicationLogsRepository.createQueryBuilder("log")
      .leftJoinAndSelect("log.salesperson", "salesperson")
      .leftJoinAndSelect("log.customer", "customer")
      .leftJoinAndSelect("log.relatedLead", "lead")
      .where("log.type = 'call'");

    if (filters?.startDate && filters?.endDate) {
      qb.andWhere("log.createdAt BETWEEN :startDate AND :endDate", {
        startDate: filters.startDate,
        endDate: filters.endDate
      });
    }

    if (filters?.salespersonId && filters.salespersonId !== 'all') {
      qb.andWhere("log.salespersonId = :salespersonId", { salespersonId: filters.salespersonId });
    }

    qb.orderBy("log.createdAt", "DESC").limit(150);

    const logs = await qb.getMany();

    return logs.map(log => {
      const agentName = log.salesperson ? `${log.salesperson.firstName} ${log.salesperson.lastName}` : "System";
      const custName = log.customer ? `${log.customer.firstName} ${log.customer.lastName}` : (log.relatedLead ? `${log.relatedLead.firstName} ${log.relatedLead.lastName}` : "Unknown");
      const phone = log.customer?.phone || log.relatedLead?.phone || (log.metadata as any)?.phone || "N/A";

      return {
        id: log.id,
        customerId: log.customerId,
        relatedLeadId: log.relatedLeadId,
        timestamp: log.createdAt.toISOString(),
        agentName: agentName,
        customerName: custName,
        customerPhone: phone,
        outcome: log.status === "completed" ? "answered" : (log.status === "missed" ? "no_answer" : log.status),
        durationSec: log.durationSeconds || 0
      };
    });
  }

  /**
   * CRON: Inject "Confirmation Call Reminder" for upcoming appointments
   * Runs daily at midnight. Finds appointments happening in 24-48 hours.
   */
  async scheduledInjectConfirmationTask(): Promise<{ injected: number }> {
    const tomorrowStart = new Date();
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const dayAfterTomorrowEnd = new Date();
    dayAfterTomorrowEnd.setDate(dayAfterTomorrowEnd.getDate() + 2);
    dayAfterTomorrowEnd.setHours(23, 59, 59, 999);

    const upcomingAppointments = await this.appointmentsRepository.find({
      where: {
        startTime: Between(tomorrowStart, dayAfterTomorrowEnd),
        status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED])
      },
      relations: ['service', 'service.treatment']
    });

    let injected = 0;
    for (const apt of upcomingAppointments) {
      // Check if task already exists
      const existing = await this.crmActionsRepository.findOne({
        where: {
          relatedAppointmentId: apt.id,
          actionType: 'confirmation_call_reminder'
        }
      });

      if (!existing) {
        const record = await this.customerRecordsRepository.findOne({ where: { customerId: apt.clientId } });

        await this.crmActionsRepository.save({
          title: `Confirm Appointment: ${apt.service?.treatment?.name || 'Treatment'}`,
          actionType: 'confirmation_call_reminder',
          status: 'pending',
          priority: 'high',
          dueDate: new Date(apt.startTime.getTime() - 24 * 60 * 60 * 1000), // 24h before
          reminderDate: new Date(apt.startTime.getTime() - 24 * 60 * 60 * 1000 - 30 * 60 * 1000), // 30m before due
          customerId: record?.id,
          relatedLeadId: (apt.clientId && !record) ? apt.clientId : null,
          salespersonId: apt.bookedById || (record?.assignedSalespersonId) || (await this.usersRepository.findOne({ where: { role: UserRole.SUPER_ADMIN } })).id,
          relatedAppointmentId: apt.id,
          description: `Call client to confirm appointment at ${apt.startTime.toLocaleString()}`
        });
        injected++;
      }
    }
    return { injected };
  }

  /**
   * CRON: Inject "Next Day Follow-up" for completed appointments
   * Runs daily. Finds appointments completed yesterday.
   */
  async scheduledInjectNextDayFollowUp(): Promise<{ injected: number }> {
    const yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);

    const yesterdayEnd = new Date();
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const finishedAppointments = await this.appointmentsRepository.find({
      where: {
        startTime: Between(yesterdayStart, yesterdayEnd),
        status: AppointmentStatus.COMPLETED
      },
      relations: ['service', 'service.treatment']
    });

    let injected = 0;
    for (const apt of finishedAppointments) {
      const existing = await this.crmActionsRepository.findOne({
        where: {
          relatedAppointmentId: apt.id,
          actionType: 'follow_up_call' as 'call' | 'mobile_message' | 'follow_up_call' | 'email' | 'appointment' | 'confirmation_call_reminder' | 'satisfaction_check' | 'complaint'
        }
      });

      if (!existing) {
        const record = await this.customerRecordsRepository.findOne({ where: { customerId: apt.clientId } });

        await this.crmActionsRepository.save({
          title: `Post-Treatment Follow-up: ${apt.service?.treatment?.name || 'Treatment'}`,
          actionType: 'follow_up_call',
          status: 'pending',
          priority: 'medium',
          dueDate: new Date(), // Due today
          reminderDate: new Date(),
          customerId: record?.id,
          relatedLeadId: (apt.clientId && !record) ? apt.clientId : null,
          salespersonId: apt.bookedById || (record?.assignedSalespersonId) || (await this.usersRepository.findOne({ where: { role: UserRole.SUPER_ADMIN } })).id,
          relatedAppointmentId: apt.id,
          description: `Follow up after ${apt.service?.treatment?.name} appointment on ${apt.startTime.toDateString()}`
        });
        injected++;
      }
    }
    return { injected };
  }

  async seedMockCrmData(): Promise<any> {
    const clinics = await this.clinicsRepository.find();
    const agents = await this.usersRepository.find({ where: { role: UserRole.SALESPERSON } });
    const servicesRepository = this.dataSource.getRepository(Service);
    const services = await servicesRepository.find();

    const results = {
      leads: 0,
      calls: 0,
      appointments: 0
    };

    if (agents.length > 0) {
      const leadNames = [['John', 'Doe'], ['Jane', 'Smith'], ['Michael', 'Brown'], ['Emily', 'Davis'], ['Robert', 'Wilson']];
      for (const [f, l] of leadNames) {
        const lead = this.leadsRepository.create({
          firstName: f,
          lastName: l,
          email: `${f.toLowerCase()}@test_${Date.now()}_${Math.floor(Math.random() * 1000)}.com`,
          phone: '+44' + Math.floor(Math.random() * 1000000000).toString(),
          status: LeadStatus.NEW,
          assignedSalesId: agents[Math.floor(Math.random() * agents.length)].id,
          source: 'facebook_ads',
          createdAt: new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 30)))
        });
        const savedLead = await this.leadsRepository.save(lead);
        results.leads++;

        for (let i = 0; i < 3; i++) {
          await this.communicationLogsRepository.save({
            relatedLeadId: savedLead.id,
            salespersonId: savedLead.assignedSalesId,
            type: 'call',
            status: Math.random() > 0.3 ? 'completed' : 'missed',
            notes: `Follow up call ${i + 1} for lead ${savedLead.firstName}`,
            durationSeconds: Math.floor(Math.random() * 300),
            createdAt: new Date(new Date().getTime() - Math.random() * 1000000)
          });
          results.calls++;
        }
      }

      if (services.length > 0 && clinics.length > 0) {
        for (let i = 0; i < 50; i++) {
          const clinic = clinics[Math.floor(Math.random() * clinics.length)];
          const agent = agents[Math.floor(Math.random() * agents.length)];
          const service = services[Math.floor(Math.random() * services.length)];

          const apt = this.appointmentsRepository.create({
            clinicId: clinic.id,
            serviceId: service.id,
            clientId: agents[0].id,
            bookedById: agent.id,
            startTime: new Date(new Date().getTime() - (Math.random() * 30 * 24 * 60 * 60 * 1000)),
            endTime: new Date(),
            status: AppointmentStatus.COMPLETED,
            totalAmount: 150 + Math.random() * 500,
            amountPaid: 150 + Math.random() * 500,
            createdAt: new Date(),
          });
          await this.appointmentsRepository.save(apt);
          results.appointments++;
        }
      }
    }
    return { message: 'Mock data seeded successfully', ...results };
  }

  async seedFacebookTestLeads(): Promise<any> {
    const agents = await this.usersRepository.find({ where: { role: UserRole.SALESPERSON } });
    const admin = await this.usersRepository.findOne({ where: { role: UserRole.SUPER_ADMIN } });

    const testForms = ['Special Promo Form', 'Consultation Ad 2024', 'Website Leadgen'];
    const names = [['Ahmed', 'Khan'], ['Sara', 'Zafar'], ['Usman', 'Ali'], ['Zoya', 'Malik']];

    let seeded = 0;
    for (let i = 0; i < names.length; i++) {
      const lead = this.leadsRepository.create({
        firstName: names[i][0],
        lastName: names[i][1],
        email: `test_meta_${i}_${Date.now()}@example.com`,
        phone: `+92300123456${i}`,
        source: 'facebook_ads',
        status: LeadStatus.NEW,
        lastMetaFormName: testForms[i % testForms.length],
        assignedSalesId: agents.length > 0 ? agents[i % agents.length].id : (admin?.id || null),
        lastMetaFormSubmittedAt: new Date(),
        createdAt: new Date()
      });
      await this.leadsRepository.save(lead);
      seeded++;
    }

    return {
      message: `Successfully seeded ${seeded} test leads with Facebook form names`,
      forms: testForms
    };
  }

  async bulkCreateActions(leadIds: string[], taskData: Partial<CrmAction>): Promise<any> {
    const results = [];
    for (const leadId of leadIds) {
      try {
        // 1. Update the lead's owner (Assigned Salesperson)
        if (taskData.salespersonId) {
          await this.leadsRepository.update(leadId, {
            assignedSalesId: taskData.salespersonId
          });
        }

        // 2. Create the task
        const action = await this.createAction({
          ...taskData,
          relatedLeadId: leadId,
          reminderDate: taskData.reminderDate || taskData.dueDate || new Date()
        });
        results.push(action);
      } catch (e) {
        this.logger.error(`Failed to create bulk action or assign lead ${leadId}: ${e.message}`);
      }
    }
    return {
      success: true,
      count: results.length,
      message: `Successfully created ${results.length} tasks and assigned leads`
    };
  }

}