import { Injectable, NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DeepPartial } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { Offer } from './entities/offer.entity';
import { Reward } from './entities/reward.entity';
import { PlatformSettings } from './entities/platform-settings.entity';
import { User } from '../users/entities/user.entity';
import { Clinic } from '../clinics/entities/clinic.entity';
import { Appointment } from '../bookings/entities/appointment.entity';
import { LoyaltyLedger } from '../loyalty/entities/loyalty-ledger.entity';
import { AgentClinicAccess } from '../crm/entities/agent-clinic-access.entity';
import { PaymentRecord, PaymentStatus, PaymentType } from '../payments/entities/payment-record.entity';
import { Lead } from '../crm/entities/lead.entity';
import { Treatment } from '../clinics/entities/treatment.entity';
import { TreatmentCategory } from '../clinics/entities/treatment-category.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { ClinicsService } from '../clinics/clinics.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BookingsService } from '../bookings/bookings.service';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Tag)
    private tagsRepository: Repository<Tag>,
    @InjectRepository(Offer)
    private offersRepository: Repository<Offer>,
    @InjectRepository(Reward)
    private rewardsRepository: Repository<Reward>,
    @InjectRepository(PlatformSettings)
    private settingsRepository: Repository<PlatformSettings>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Clinic)
    private clinicsRepository: Repository<Clinic>,
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(PaymentRecord)
    private paymentRecordsRepository: Repository<PaymentRecord>,
    @InjectRepository(LoyaltyLedger)
    private loyaltyRepository: Repository<LoyaltyLedger>,
    @InjectRepository(AgentClinicAccess)
    private agentClinicAccessRepository: Repository<AgentClinicAccess>,
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
    @InjectRepository(Treatment)
    private treatmentsRepository: Repository<Treatment>,
    @InjectRepository(TreatmentCategory)
    private categoryRepository: Repository<TreatmentCategory>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private clinicsService: ClinicsService,
    private notificationsService: NotificationsService,
    private bookingsService: BookingsService,
  ) { }

  private resolveDateRange(dateRange?: { startDate?: string; endDate?: string }) {
    const now = new Date();
    if (dateRange?.startDate && dateRange?.endDate) {
      return { startDate: new Date(dateRange.startDate), endDate: new Date(dateRange.endDate) };
    }

    // Default to Month-To-Date (UTC-ish; stored as timestamptz)
    const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
    const endDate = now;
    return { startDate, endDate };
  }

  private paymentNetExpression(alias = 'p') {
    // Net turnover: payments/deposits add, refunds/voids subtract
    return `SUM(CASE
      WHEN ${alias}.type IN ('${PaymentType.PAYMENT}', '${PaymentType.DEPOSIT}') THEN ${alias}.amount
      WHEN ${alias}.type IN ('${PaymentType.REFUND}', '${PaymentType.VOID}') THEN -${alias}.amount
      ELSE 0
    END)`;
  }

  async createTag(name: string, color?: string, description?: string): Promise<Tag> {
    const tag = this.tagsRepository.create({
      name,
      color,
      description,
    });
    return this.tagsRepository.save(tag);
  }

  async getTags(): Promise<Tag[]> {
    return this.tagsRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async getReports(): Promise<any> {
    // This would contain complex analytics queries
    // For now, return mock data structure
    return {
      leadsToConversions: {
        totalLeads: 0,
        conversions: 0,
        conversionRate: 0,
      },
      revenueStats: {
        totalRevenue: 0,
        monthlyRevenue: 0,
        averageAppointmentValue: 0,
      },
      appointmentStats: {
        totalAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        noShows: 0,
      },
    };
  }

  async getSettings(): Promise<any> {
    const settings = await this.settingsRepository.find();
    // Convert array of entities to a key-value object
    const settingsMap: Record<string, any> = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    // Merge with defaults if not present
    const defaults = {
      loyaltyPointsPerDollar: 1,
      pointsExpirationMonths: 12,
      appointmentReminderHours: 24,
      meta_ingestion_enabled: true,
      viva_stripe_mode: 'test',
      hubspot_sync_enabled: false,
      google_calendar_sync_enabled: false,
    };

    return { ...defaults, ...settingsMap };
  }

  async updateSettings(settings: Record<string, any>): Promise<any> {
    for (const [key, value] of Object.entries(settings)) {
      let setting = await this.settingsRepository.findOne({ where: { key } });
      if (setting) {
        setting.value = value;
      } else {
        setting = this.settingsRepository.create({
          key,
          value,
          category: 'system'
        });
      }
      await this.settingsRepository.save(setting);
    }
    return this.getSettings();
  }

  // User Management
  async getAllUsers(query?: { role?: string; isActive?: boolean; search?: string; limit?: number; offset?: number }): Promise<any> {
    const queryBuilder = this.usersRepository.createQueryBuilder('user');

    if (query?.role) {
      queryBuilder.andWhere('user.role = :role', { role: query.role });
    }

    if (query?.isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: query.isActive });
    }

    if (query?.search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    const total = await queryBuilder.getCount();

    if (query?.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query?.offset) {
      queryBuilder.offset(query.offset);
    }

    const users = await queryBuilder
      .select([
        'user.id',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.role',
        'user.isActive',
        'user.monthlyTarget',
        'user.createdAt',
        'user.lastLoginAt',
      ])
      .orderBy('user.createdAt', 'DESC')
      .getMany();

    // Load clinic accesses for users where applicable
    for (const u of users) {
      if (u.role === 'clinic_owner') {
        const owned = await this.usersRepository.findOne({
          where: { id: u.id },
          relations: ['ownedClinics']
        });
        (u as any).assignedClinics = owned?.ownedClinics || [];
      } else {
        const accesses = await this.agentClinicAccessRepository.find({ where: { agentUserId: u.id }, relations: ['clinic'] });
        (u as any).assignedClinics = accesses.map(a => a.clinic);
      }
    }

    return { users, total, limit: query?.limit, offset: query?.offset || 0 };
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['ownedClinics', 'clientAppointments'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'clinic_owner') {
      (user as any).assignedClinics = user.ownedClinics || [];
    } else {
      const accesses = await this.agentClinicAccessRepository.find({ where: { agentUserId: user.id }, relations: ['clinic'] });
      (user as any).assignedClinics = accesses.map(a => a.clinic);
    }

    return user;
  }

  // Treatment Category Management
  async getCategories(): Promise<TreatmentCategory[]> {
    return this.categoryRepository.find({ order: { name: 'ASC' } });
  }

  async createCategory(data: Partial<TreatmentCategory>): Promise<TreatmentCategory> {
    const category = this.categoryRepository.create(data);
    return this.categoryRepository.save(category);
  }

  async updateCategory(id: string, data: Partial<TreatmentCategory>): Promise<TreatmentCategory> {
    await this.categoryRepository.update(id, data);
    return this.categoryRepository.findOne({ where: { id } });
  }

  async deleteCategory(id: string): Promise<void> {
    await this.categoryRepository.delete(id);
  }

  // Therapy (Treatment) Management
  async getTreatments(query?: { search?: string; categoryId?: string }): Promise<Treatment[]> {
    const qb = this.treatmentsRepository.createQueryBuilder('treatment')
      .leftJoinAndSelect('treatment.categoryRef', 'categoryRef');

    if (query?.search) {
      qb.andWhere('treatment.name ILIKE :search', { search: `%${query.search}%` });
    }

    if (query?.categoryId) {
      qb.andWhere('treatment.categoryId = :cid', { cid: query.categoryId });
    }

    return qb.orderBy('treatment.name', 'ASC').getMany();
  }

  async createTreatment(data: Partial<Treatment> & { description?: string }): Promise<Treatment> {
    const { description, ...rest } = data;
    const finalData = { ...rest };
    if (description !== undefined && finalData.fullDescription === undefined) {
      finalData.fullDescription = description;
    }
    const treatment = this.treatmentsRepository.create(finalData as DeepPartial<Treatment>);
    
    if (treatment.status === 'approved') {
       if (!treatment.categoryId && !treatment.category) throw new BadRequestException('Category is required for approved therapies');
       if (!treatment.shortDescription) throw new BadRequestException('Short description is required for approved therapies');
       if (!treatment.fullDescription) throw new BadRequestException('Full description is required for approved therapies');
       if (!treatment.imageUrl) throw new BadRequestException('Photo is required for approved therapies');
    }

    return this.treatmentsRepository.save(treatment);
  }

  async updateTreatment(id: string, data: Partial<Treatment> & { description?: string }): Promise<Treatment> {
    const { description, ...rest } = data;
    const finalData = { ...rest };
    
    // Map description to fullDescription if provided
    if (description !== undefined && finalData.fullDescription === undefined) {
      finalData.fullDescription = description;
    }

    // Filter to only included properties in the entity to avoid crashes
    const validProperties = ['name', 'shortDescription', 'fullDescription', 'categoryId', 'status', 'imageUrl', 'isActive'];
    const filteredData: any = {};
    for (const key of validProperties) {
      if (finalData[key] !== undefined) {
        filteredData[key] = finalData[key];
      }
    }

    if (Object.keys(filteredData).length > 0) {
      if (filteredData.status === 'approved' || (filteredData.status === undefined && (await this.treatmentsRepository.findOne({where: {id}}))?.status === 'approved')) {
         const t = filteredData;
         // Check if existing record also lacks these
         const existing = await this.treatmentsRepository.findOne({where: {id}});
         const check = { ...existing, ...t };
         if (!check.categoryId && !check.category) throw new BadRequestException('Category is required for approved therapies');
         if (!check.shortDescription) throw new BadRequestException('Short description is required for approved therapies');
         if (!check.fullDescription) throw new BadRequestException('Full description is required for approved therapies');
         if (!check.imageUrl) throw new BadRequestException('Photo is required for approved therapies');
      }
      await this.treatmentsRepository.update(id, filteredData);
    }
    
    const updated = await this.treatmentsRepository.findOne({ where: { id }, relations: ['categoryRef'] });
    if (!updated) {
      throw new NotFoundException('Treatment not found');
    }
    return updated;
  }

  async updateUser(id: string, updateData: Partial<User> & { assignedClinicIds?: string[] }): Promise<User> {
    const { assignedClinicIds, ...dataToUpdate } = updateData;

    await this.usersRepository.update(id, dataToUpdate);

    if (assignedClinicIds !== undefined) {
      // Clear all existing accesses
      await this.agentClinicAccessRepository.delete({ agentUserId: id });

      // Save new ones
      for (const clinicId of assignedClinicIds) {
        await this.agentClinicAccessRepository.save(
          this.agentClinicAccessRepository.create({ agentUserId: id, clinicId })
        );
      }
    }

    return this.getUserById(id);
  }

  async toggleUserStatus(id: string): Promise<User> {
    const user = await this.getUserById(id);
    user.isActive = !user.isActive;
    return this.usersRepository.save(user);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.getUserById(id);
    await this.usersRepository.remove(user);
  }

  // Clinic Management
  async getAllClinics(query?: { isActive?: boolean; search?: string; limit?: number; offset?: number }): Promise<any> {
    const queryBuilder = this.clinicsRepository.createQueryBuilder('clinic')
      .leftJoinAndSelect('clinic.owner', 'owner')
      .leftJoinAndSelect('clinic.services', 'services');

    if (query?.isActive !== undefined) {
      queryBuilder.andWhere('clinic.isActive = :isActive', { isActive: query.isActive });
    }

    if (query?.search) {
      queryBuilder.andWhere(
        '(clinic.name ILIKE :search OR clinic.description ILIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    const total = await queryBuilder.getCount();

    if (query?.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query?.offset) {
      queryBuilder.offset(query.offset);
    }

    const clinics = await queryBuilder
      .orderBy('clinic.createdAt', 'DESC')
      .getMany();

    return { clinics, total, limit: query?.limit, offset: query?.offset || 0 };
  }

  async getClinicById(id: string): Promise<Clinic> {
    const clinic = await this.clinicsRepository.findOne({
      where: { id },
      relations: ['owner', 'services', 'appointments'],
    });

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    return clinic;
  }

  async toggleClinicStatus(id: string): Promise<Clinic> {
    const clinic = await this.getClinicById(id);
    clinic.isActive = !clinic.isActive;
    return this.clinicsRepository.save(clinic);
  }

  async createClinic(clinicData: any): Promise<Clinic> {
    return this.clinicsService.createClinic(clinicData);
  }

  async updateClinic(id: string, clinicData: any): Promise<Clinic> {
    return this.clinicsService.updateClinicById(id, clinicData);
  }

  async getClinicAnalytics(id: string, dateRange?: { startDate: string; endDate: string }): Promise<any> {
    const clinic = await this.getClinicById(id);

    let appointmentQuery = this.appointmentsRepository.createQueryBuilder('appointment')
      .where('appointment.clinicId = :clinicId', { clinicId: id });

    if (dateRange?.startDate && dateRange?.endDate) {
      appointmentQuery = appointmentQuery.andWhere(
        'appointment.startTime BETWEEN :startDate AND :endDate',
        {
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate),
        }
      );
    }

    const stats = await appointmentQuery
      .select([
        'COUNT(appointment.id) as totalAppointments',
        'SUM(appointment.totalAmount) as totalRevenue',
        'AVG(appointment.totalAmount) as avgAppointmentValue',
        'COUNT(DISTINCT appointment.clientId) as uniqueClients',
      ])
      .getRawOne();

    return {
      clinicId: clinic.id,
      clinicName: clinic.name,
      period: dateRange,
      stats: {
        totalAppointments: parseInt(stats.totalAppointments) || 0,
        totalRevenue: parseFloat(stats.totalRevenue) || 0,
        avgAppointmentValue: parseFloat(stats.avgAppointmentValue) || 0,
        uniqueClients: parseInt(stats.uniqueClients) || 0,
      },
    };
  }

  // Platform-wide Analytics
  async getPlatformAnalytics(dateRange?: { startDate: string; endDate: string }): Promise<any> {
    const { startDate, endDate } = this.resolveDateRange(dateRange);

    // User statistics
    const userStats = await this.usersRepository
      .createQueryBuilder('user')
      .select([
        'COUNT(user.id) as totalUsers',
        'COUNT(CASE WHEN user.role = \'client\' THEN 1 END) as totalClients',
        'COUNT(CASE WHEN user.role = \'clinic_owner\' THEN 1 END) as totalClinicOwners',
        'COUNT(CASE WHEN user.isActive = true THEN 1 END) as activeUsers',
      ])
      .getRawOne();

    // Clinic statistics
    const clinicStats = await this.clinicsRepository
      .createQueryBuilder('clinic')
      .select([
        'COUNT(clinic.id) as totalClinics',
        'COUNT(CASE WHEN clinic.isActive = true THEN 1 END) as activeClinics',
      ])
      .getRawOne();

    // Appointment statistics
    let appointmentQuery = this.appointmentsRepository.createQueryBuilder('appointment');

    appointmentQuery = appointmentQuery.where('appointment.startTime BETWEEN :startDate AND :endDate', { startDate, endDate });

    const appointmentStats = await appointmentQuery
      .select([
        'COUNT(appointment.id) as totalAppointments',
        'COUNT(CASE WHEN appointment.status = :completed THEN 1 END) as completedAppointments',
        'COUNT(CASE WHEN appointment.status = :cancelled THEN 1 END) as cancelledAppointments',
        'COUNT(CASE WHEN appointment.status = :noShow THEN 1 END) as noShowAppointments',
      ])
      .setParameters({
        completed: AppointmentStatus.COMPLETED,
        cancelled: AppointmentStatus.CANCELLED,
        noShow: AppointmentStatus.NO_SHOW,
      })
      .getRawOne();

    // Turnover (payments-derived) in the same period
    const turnoverRow = await this.paymentRecordsRepository
      .createQueryBuilder('p')
      .where('p.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('p.status IN (:...statuses)', { statuses: [PaymentStatus.COMPLETED, PaymentStatus.REFUNDED, PaymentStatus.VOIDED] })
      .select([
        `${this.paymentNetExpression('p')} as netRevenue`,
        'COUNT(p.id) as paymentCount',
      ])
      .getRawOne();

    // Turnover MTD (€) vs target per salesperson
    const salespersonTurnoverRows = await this.paymentRecordsRepository
      .createQueryBuilder('p')
      .leftJoin(User, 'u', 'u.id = p.salespersonId')
      .where('p.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('p.salespersonId IS NOT NULL')
      .andWhere('p.status IN (:...statuses)', { statuses: [PaymentStatus.COMPLETED, PaymentStatus.REFUNDED, PaymentStatus.VOIDED] })
      .select([
        'p.salespersonId as salespersonId',
        `COALESCE(u.firstName, '') as firstName`,
        `COALESCE(u.lastName, '') as lastName`,
        `COALESCE(u.monthlyTarget, 0) as monthlyTarget`,
        `${this.paymentNetExpression('p')} as turnoverMTD`,
      ])
      .groupBy('p.salespersonId')
      .addGroupBy('u.firstName')
      .addGroupBy('u.lastName')
      .addGroupBy('u.monthlyTarget')
      .orderBy('turnoverMTD', 'DESC')
      .getRawMany();

    const turnoverMTDBySalesperson = salespersonTurnoverRows.map((r: any) => {
      const turnover = Number(r.turnovermtd ?? r.turnoverMTD ?? 0);
      const target = Number(r.monthlytarget ?? r.monthlyTarget ?? 0);
      return {
        salespersonId: r.salespersonId,
        name: `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.salespersonId,
        turnoverMTD: turnover,
        targetMonthly: target,
        targetDelta: turnover - target,
        targetAchievement: target > 0 ? turnover / target : null,
      };
    });

    // Appointment funnel by status (booked/canceled/no-show/done/returned)
    const funnelBookedStatuses = [
      AppointmentStatus.PENDING,
      AppointmentStatus.PENDING_PAYMENT,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.ARRIVED,
      AppointmentStatus.IN_PROGRESS,
    ];

    const funnelRow = await this.appointmentsRepository
      .createQueryBuilder('a')
      .where('a.startTime BETWEEN :startDate AND :endDate', { startDate, endDate })
      .select([
        `COUNT(CASE WHEN a.status IN (:...booked) THEN 1 END) as booked`,
        `COUNT(CASE WHEN a.status = :cancelled THEN 1 END) as canceled`,
        `COUNT(CASE WHEN a.status = :noShow THEN 1 END) as noShow`,
        `COUNT(CASE WHEN a.status = :completed THEN 1 END) as done`,
      ])
      .setParameters({
        booked: funnelBookedStatuses,
        cancelled: AppointmentStatus.CANCELLED,
        noShow: AppointmentStatus.NO_SHOW,
        completed: AppointmentStatus.COMPLETED,
      })
      .getRawOne();

    // Returned = appointments in range for clients who had any completed appointment before this period
    const returnedRow = await this.appointmentsRepository
      .createQueryBuilder('a')
      .where('a.startTime BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere(
        `EXISTS (
          SELECT 1 FROM appointments prev
          WHERE prev.clientId = a.clientId
            AND prev.status = :completed
            AND prev.startTime < :startDate
        )`,
      )
      .setParameters({ completed: AppointmentStatus.COMPLETED, startDate })
      .select(['COUNT(a.id) as returned'])
      .getRawOne();

    const appointmentFunnel = {
      booked: parseInt(funnelRow?.booked, 10) || 0,
      canceled: parseInt(funnelRow?.canceled, 10) || 0,
      noShow: parseInt(funnelRow?.noShow, 10) || 0,
      done: parseInt(funnelRow?.done, 10) || 0,
      returned: parseInt(returnedRow?.returned, 10) || 0,
    };

    // Clinic-level performance (appointments + payments net)
    const clinicAppointmentRows = await this.appointmentsRepository
      .createQueryBuilder('a')
      .leftJoin(Clinic, 'c', 'c.id = a.clinicId')
      .where('a.startTime BETWEEN :startDate AND :endDate', { startDate, endDate })
      .select([
        'a.clinicId as clinicId',
        'COALESCE(c.name, \'\') as clinicName',
        'COUNT(a.id) as appointments',
        'COUNT(DISTINCT a.clientId) as uniqueClients',
        `COUNT(CASE WHEN a.status = :completed THEN 1 END) as done`,
        `COUNT(CASE WHEN a.status = :cancelled THEN 1 END) as canceled`,
        `COUNT(CASE WHEN a.status = :noShow THEN 1 END) as noShow`,
      ])
      .setParameters({
        completed: AppointmentStatus.COMPLETED,
        cancelled: AppointmentStatus.CANCELLED,
        noShow: AppointmentStatus.NO_SHOW,
      })
      .groupBy('a.clinicId')
      .addGroupBy('c.name')
      .getRawMany();

    const clinicRevenueRows = await this.paymentRecordsRepository
      .createQueryBuilder('p')
      .where('p.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('p.status IN (:...statuses)', { statuses: [PaymentStatus.COMPLETED, PaymentStatus.REFUNDED, PaymentStatus.VOIDED] })
      .select(['p.clinicId as clinicId', `${this.paymentNetExpression('p')} as netRevenue`])
      .groupBy('p.clinicId')
      .getRawMany();

    const clinicRevenueById = new Map<string, number>(
      clinicRevenueRows.map((r: any) => [r.clinicId, Number(r.netrevenue ?? r.netRevenue ?? 0)]),
    );

    const clinicPerformance = clinicAppointmentRows
      .map((r: any) => {
        const appointments = parseInt(r.appointments, 10) || 0;
        const canceled = parseInt(r.canceled, 10) || 0;
        const noShow = parseInt(r.noShow, 10) || 0;
        const done = parseInt(r.done, 10) || 0;
        const netRevenue = clinicRevenueById.get(r.clinicId) ?? 0;
        return {
          clinicId: r.clinicId,
          clinicName: r.clinicName,
          appointments,
          uniqueClients: parseInt(r.uniqueclients ?? r.uniqueClients, 10) || 0,
          done,
          canceled,
          noShow,
          netRevenue,
          cancelRate: appointments > 0 ? canceled / appointments : 0,
          noShowRate: appointments > 0 ? noShow / appointments : 0,
          avgRevenuePerAppointment: appointments > 0 ? netRevenue / appointments : 0,
        };
      })
      .sort((a: any, b: any) => b.netRevenue - a.netRevenue);

    // Source attribution (Meta form name, ad name) derived by mapping client -> latest lead meta
    // Link rule: Lead.metadata.convertedToCustomerId or mergedIntoCustomerId equals payment.clientId
    const attributionRows = await this.paymentRecordsRepository
      .createQueryBuilder('p')
      .leftJoin(
        (qb) =>
          qb
            .from(Lead, 'l')
            .select([
              `COALESCE(l.metadata->>'convertedToCustomerId', l.metadata->>'mergedIntoCustomerId') as customerId`,
              'l.lastMetaFormName as metaFormName',
              'l.facebookAdName as adName',
              'l.updatedAt as updatedAt',
            ])
            .where(`(l.metadata ? 'convertedToCustomerId' OR l.metadata ? 'mergedIntoCustomerId')`)
            // Postgres: pick the most recently updated lead per customerId
            .distinctOn([`COALESCE(l.metadata->>'convertedToCustomerId', l.metadata->>'mergedIntoCustomerId')`])
            .orderBy(`COALESCE(l.metadata->>'convertedToCustomerId', l.metadata->>'mergedIntoCustomerId')`, 'ASC')
            .addOrderBy('l.updatedAt', 'DESC'),
        'lm',
        'lm.customerId = p.clientId',
      )
      .where('p.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('p.status IN (:...statuses)', { statuses: [PaymentStatus.COMPLETED, PaymentStatus.REFUNDED, PaymentStatus.VOIDED] })
      .select([
        `COALESCE(lm.metaFormName, 'Unknown') as metaFormName`,
        `COALESCE(lm.adName, 'Unknown') as adName`,
        'COUNT(DISTINCT p.clientId) as uniqueClients',
        'COUNT(p.id) as paymentCount',
        `${this.paymentNetExpression('p')} as netRevenue`,
      ])
      .groupBy('metaFormName')
      .addGroupBy('adName')
      .orderBy('netRevenue', 'DESC')
      .getRawMany();

    const sourceAttribution = attributionRows.map((r: any) => ({
      metaFormName: r.metaformname ?? r.metaFormName,
      adName: r.adname ?? r.adName,
      uniqueClients: parseInt(r.uniqueclients ?? r.uniqueClients, 10) || 0,
      paymentCount: parseInt(r.paymentcount ?? r.paymentCount, 10) || 0,
      netRevenue: Number(r.netrevenue ?? r.netRevenue ?? 0),
    }));

    // Loyalty statistics
    let loyaltyQuery = this.loyaltyRepository.createQueryBuilder('loyalty');

    loyaltyQuery = loyaltyQuery.where('loyalty.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });

    const loyaltyStats = await loyaltyQuery
      .select([
        'SUM(loyalty.points) as totalPointsIssued',
        'COUNT(DISTINCT loyalty.clientId) as clientsWithPoints',
        'AVG(loyalty.points) as avgPointsPerTransaction',
      ])
      .getRawOne();

    return {
      period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      users: {
        total: parseInt(userStats.totalUsers) || 0,
        clients: parseInt(userStats.totalClients) || 0,
        clinicOwners: parseInt(userStats.totalClinicOwners) || 0,
        active: parseInt(userStats.activeUsers) || 0,
      },
      clinics: {
        total: parseInt(clinicStats.totalClinics) || 0,
        active: parseInt(clinicStats.activeClinics) || 0,
      },
      appointments: {
        total: parseInt(appointmentStats.totalAppointments) || 0,
        completed: parseInt(appointmentStats.completedAppointments) || 0,
        cancelled: parseInt(appointmentStats.cancelledAppointments) || 0,
        noShow: parseInt(appointmentStats.noShowAppointments) || 0,
      },
      revenue: {
        total: Number(turnoverRow?.netrevenue ?? turnoverRow?.netRevenue ?? 0),
        paymentCount: parseInt(turnoverRow?.paymentcount ?? turnoverRow?.paymentCount, 10) || 0,
      },
      turnoverMTDBySalesperson,
      appointmentFunnel,
      clinicPerformance,
      sourceAttribution,
      loyalty: {
        totalPointsIssued: parseInt(loyaltyStats.totalPointsIssued) || 0,
        clientsWithPoints: parseInt(loyaltyStats.clientsWithPoints) || 0,
        avgPointsPerTransaction: parseFloat(loyaltyStats.avgPointsPerTransaction) || 0,
      },
    };
  }

  // Offer Management
  async createOffer(offerData: Partial<Offer>): Promise<Offer> {
    const offer = this.offersRepository.create(offerData);
    return this.offersRepository.save(offer);
  }

  async getAllOffers(query?: { isActive?: boolean; limit?: number; offset?: number }): Promise<any> {
    const queryBuilder = this.offersRepository.createQueryBuilder('offer');

    if (query?.isActive !== undefined) {
      queryBuilder.andWhere('offer.isActive = :isActive', { isActive: query.isActive });
    }

    const total = await queryBuilder.getCount();

    if (query?.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query?.offset) {
      queryBuilder.offset(query.offset);
    }

    const offers = await queryBuilder
      .orderBy('offer.createdAt', 'DESC')
      .getMany();

    return { offers, total, limit: query?.limit, offset: query?.offset || 0 };
  }

  async getOfferById(id: string): Promise<Offer> {
    const offer = await this.offersRepository.findOne({ where: { id } });
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    return offer;
  }

  async updateOffer(id: string, updateData: Partial<Offer>): Promise<Offer> {
    await this.offersRepository.update(id, updateData);
    return this.getOfferById(id);
  }

  async toggleOfferStatus(id: string): Promise<Offer> {
    const offer = await this.getOfferById(id);
    offer.isActive = !offer.isActive;
    return this.offersRepository.save(offer);
  }

  async deleteOffer(id: string): Promise<void> {
    const offer = await this.getOfferById(id);
    await this.offersRepository.remove(offer);
  }

  // Reward Management
  async createReward(rewardData: Partial<Reward>): Promise<Reward> {
    const reward = this.rewardsRepository.create(rewardData);
    return this.rewardsRepository.save(reward);
  }

  async getAllRewards(query?: { isActive?: boolean; tier?: string; limit?: number; offset?: number }): Promise<any> {
    const queryBuilder = this.rewardsRepository.createQueryBuilder('reward');

    if (query?.isActive !== undefined) {
      queryBuilder.andWhere('reward.isActive = :isActive', { isActive: query.isActive });
    }

    if (query?.tier) {
      queryBuilder.andWhere('reward.tier = :tier', { tier: query.tier });
    }

    const total = await queryBuilder.getCount();

    if (query?.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query?.offset) {
      queryBuilder.offset(query.offset);
    }

    const rewards = await queryBuilder
      .orderBy('reward.pointsCost', 'ASC')
      .getMany();

    return { rewards, total, limit: query?.limit, offset: query?.offset || 0 };
  }

  async getRewardById(id: string): Promise<Reward> {
    const reward = await this.rewardsRepository.findOne({ where: { id } });
    if (!reward) {
      throw new NotFoundException('Reward not found');
    }
    return reward;
  }

  async updateReward(id: string, updateData: Partial<Reward>): Promise<Reward> {
    await this.rewardsRepository.update(id, updateData);
    return this.getRewardById(id);
  }

  async toggleRewardStatus(id: string): Promise<Reward> {
    const reward = await this.getRewardById(id);
    reward.isActive = !reward.isActive;
    return this.rewardsRepository.save(reward);
  }

  async deleteReward(id: string): Promise<void> {
    const reward = await this.getRewardById(id);
    await this.rewardsRepository.remove(reward);
  }

  // Platform Settings Management
  async getSetting(key: string): Promise<PlatformSettings> {
    const setting = await this.settingsRepository.findOne({ where: { key } });
    if (!setting) {
      throw new NotFoundException(`Setting '${key}' not found`);
    }
    return setting;
  }

  async updateSetting(key: string, value: any): Promise<PlatformSettings> {
    let setting = await this.settingsRepository.findOne({ where: { key } });

    if (setting) {
      setting.value = value;
    } else {
      setting = this.settingsRepository.create({ key, value });
    }

    return this.settingsRepository.save(setting);
  }

  async getAllSettings(category?: string): Promise<PlatformSettings[]> {
    const where: any = {};
    if (category) {
      where.category = category;
    }
    return this.settingsRepository.find({ where });
  }

  async getIntegrationLogs(): Promise<AuditLog[]> {
    // Fetch integration-related logs using QueryBuilder for better reliability
    return this.auditLogRepository.createQueryBuilder('audit')
      .where('audit.action LIKE :action1 OR audit.action LIKE :action2 OR audit.action LIKE :action3', {
        action1: '%INGESTION%',
        action2: '%SYNC%',
        action3: '%INTEGRATION%'
      })
      .orderBy('audit.createdAt', 'DESC')
      .limit(100)
      .getMany();
  }
  async getLoyalty(): Promise<any> {
    // Return loyalty tiers configuration
    // For now returning mock data
    return [
      { name: 'Bronze', points: 0, rewards: ['5% discount'] },
      { name: 'Silver', points: 1000, rewards: ['10% discount', 'Free consultation'] },
      { name: 'Gold', points: 5000, rewards: ['15% discount', 'Priority booking', 'Free product'] },
    ];
  }

  async updateLoyalty(data: any): Promise<any> {
    // Update loyalty configuration
    return data;
  }
  async getLogs(): Promise<any> {
    // Return activity logs
    // For now returning mock data
    return [
      { id: '1', userId: 'u1', action: 'User Login', timestamp: new Date().toISOString() },
      { id: '2', userId: 'u2', action: 'Update Profile', timestamp: new Date().toISOString() },
      { id: '3', userId: 'u3', action: 'Book Appointment', timestamp: new Date().toISOString() },
    ];
  }

  /**
   * Admin helper to send both email + push to a specific user.
   */
  async sendEmailAndPushToUser(payload: {
    userId: string;
    title: string;
    message: string;
    emailBody?: string;
    data?: any;
  }) {
    const { userId, title, message, emailBody, data } = payload;
    const result = await this.notificationsService.sendEmailAndPushToUser(
      userId,
      title,
      message,
      emailBody,
      data,
    );

    return {
      userId,
      title,
      pushId: result.push.id,
      emailId: result.email.id,
    };
  }

  async getGlobalCalendarAppointments(
    userId: string,
    userRole: string,
    query: { startDate: string; endDate: string; clinicId?: string; providerId?: string },
  ) {
    return this.bookingsService.getGlobalCalendarAppointments(userId, userRole, query);
  }
}