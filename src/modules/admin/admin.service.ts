import { Injectable, NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DeepPartial, In } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { Offer } from './entities/offer.entity';
import { Reward } from './entities/reward.entity';
import { PlatformSettings } from './entities/platform-settings.entity';
import { User } from '../users/entities/user.entity';
import { Clinic } from '../clinics/entities/clinic.entity';
import { Appointment } from '../bookings/entities/appointment.entity';
import { LoyaltyLedger } from '../loyalty/entities/loyalty-ledger.entity';
import { AgentClinicAccess } from '../crm/entities/agent-clinic-access.entity';
import { ClinicOwnership } from '../crm/entities/clinic-ownership.entity';
import { PaymentRecord, PaymentStatus, PaymentType } from '../payments/entities/payment-record.entity';
import { Lead } from '../crm/entities/lead.entity';
import { Treatment } from '../clinics/entities/treatment.entity';
import { TreatmentCategory } from '../clinics/entities/treatment-category.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { ClinicsService } from '../clinics/clinics.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BookingsService } from '../bookings/bookings.service';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { TreatmentStatus } from '../clinics/enums/treatment-status.enum';
import { UsersService } from '../users/users.service';
import { AccountLinksService } from '../users/account-links.service';
import { UserRole } from '../../common/enums/user-role.enum';

// Statuses that mean a lead / task is still being worked on (item 48: reassigned on deactivation).
const CLOSED_LEAD_STATUSES = ['converted', 'lost', 'merged'];
const OPEN_TASK_STATUSES = ['pending', 'in_progress'];
// Roles that can own leads and tasks.
const ASSIGNABLE_ROLES = [UserRole.SALESPERSON, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN];

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
    @InjectRepository(ClinicOwnership)
    private clinicOwnershipRepository: Repository<ClinicOwnership>,
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
    private usersService: UsersService,
    private accountLinks: AccountLinksService,
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
    // Pending clinic staff requests are listed separately (GET /admin/staff-requests).
    queryBuilder.andWhere(`COALESCE(user.profile::jsonb #>> '{staffRequest,status}', '') <> 'pending'`);

    if (query?.role) {
      queryBuilder.andWhere('user.role = :role', { role: query.role });
    }

    if (query?.isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: query.isActive });
    }

    if (query?.search && query.search.trim()) {
      const searchTrimmed = query.search.trim();
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR CONCAT(COALESCE(user.firstName, \'\'), \' \', COALESCE(user.lastName, \'\')) ILIKE :search OR CONCAT(COALESCE(user.lastName, \'\'), \' \', COALESCE(user.firstName, \'\')) ILIKE :search OR user.email ILIKE :search)',
        { search: `%${searchTrimmed}%` }
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
        // Load from clinic_ownership table (supports multiple clinics per owner)
        const ownerships = await this.clinicOwnershipRepository.find({ where: { ownerUserId: u.id } });
        if (ownerships.length > 0) {
          const clinicIds = ownerships.map(o => o.clinicId);
          const ownedClinics = await this.clinicsRepository.find({ where: { id: In(clinicIds) } });
          (u as any).assignedClinics = ownedClinics;
        } else {
          // Fallback: check ownedClinics relation (primary owner)
          const owned = await this.usersRepository.findOne({
            where: { id: u.id },
            relations: ['ownedClinics']
          });
          (u as any).assignedClinics = owned?.ownedClinics || [];
        }
      } else {
        const accesses = await this.agentClinicAccessRepository.find({ where: { agentUserId: u.id }, relations: ['clinic'] });
        const clinicsList = accesses.map(a => a.clinic).filter(Boolean);
        if (clinicsList.length === 0 && (u as any).assignedClinicId) {
          const directClinic = await this.clinicsRepository.findOne({ where: { id: (u as any).assignedClinicId } });
          if (directClinic) clinicsList.push(directClinic);
        }
        (u as any).assignedClinics = clinicsList;
      }
    }

    return { users, total, limit: query?.limit, offset: query?.offset || 0 };
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['clientAppointments'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'clinic_owner') {
      // Load from clinic_ownership table (supports multiple clinics per owner)
      const ownerships = await this.clinicOwnershipRepository.find({ where: { ownerUserId: id } });
      if (ownerships.length > 0) {
        const clinicIds = ownerships.map(o => o.clinicId);
        const ownedClinics = await this.clinicsRepository.find({ where: { id: In(clinicIds) } });
        (user as any).assignedClinics = ownedClinics;
      } else {
        // Fallback: primary owner column
        const withClinics = await this.usersRepository.findOne({ where: { id }, relations: ['ownedClinics'] });
        (user as any).assignedClinics = withClinics?.ownedClinics || [];
      }
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
    await this.clinicsService.deleteCategory(id);
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
    
    if (treatment.status === TreatmentStatus.APPROVED) {
       if (!treatment.categoryId && !treatment.category) throw new BadRequestException('Category is required for approved therapies');
       if (!treatment.shortDescription) throw new BadRequestException('Short description is required for approved therapies');
       if (!treatment.fullDescription) throw new BadRequestException('Full description is required for approved therapies');
       if (!treatment.imageUrl) throw new BadRequestException('Photo is required for approved therapies');
    }

    return this.treatmentsRepository.save(treatment);
  }

  async deleteTreatment(id: string): Promise<void> {
    // Delegate to the safe deletion logic: archives instead of deleting when
    // the treatment has booking history, and cleans up unbooked offerings
    await this.clinicsService.deleteTreatment(id);
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
      if (filteredData.status === TreatmentStatus.APPROVED || (filteredData.status === undefined && (await this.treatmentsRepository.findOne({where: {id}}))?.status === TreatmentStatus.APPROVED)) {
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

  /**
   * Admin password reset (item 69): same rule as registration/reset (min 8), hashed once,
   * clears any lockout so the new password works immediately, and ends old sessions.
   */
  async changeUserPassword(id: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.usersService.setPassword(id, newPassword);
    return { message: 'Password updated. The user can log in with the new password now.' };
  }

  // ---------------------------------------------------------------------------
  // Deactivate / Reactivate (item 48)
  // ---------------------------------------------------------------------------

  async getUserOpenWork(id: string): Promise<{ leads: number; tasks: number }> {
    const [leadRow] = await this.usersRepository.query(
      `SELECT COUNT(*)::int AS count FROM "leads" WHERE "assignedSalesId" = $1 AND COALESCE("status"::text, '') <> ALL($2::text[])`,
      [id, CLOSED_LEAD_STATUSES],
    );
    const [taskRow] = await this.usersRepository.query(
      `SELECT COUNT(*)::int AS count FROM "tasks" WHERE "assigneeId" = $1 AND "status"::text = ANY($2::text[])`,
      [id, OPEN_TASK_STATUSES],
    );
    return { leads: leadRow?.count || 0, tasks: taskRow?.count || 0 };
  }

  async deactivateUser(
    id: string,
    actorId: string,
    reassignToUserId?: string | null,
  ): Promise<{ user: User; reassigned: { leads: number; tasks: number }; reassignedTo?: string }> {
    if (id === actorId) {
      throw new BadRequestException('You cannot deactivate your own account.');
    }
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const openWork = await this.getUserOpenWork(id);
    const hasOpenWork = openWork.leads + openWork.tasks > 0;
    let reassignedTo: string | undefined;

    if (hasOpenWork) {
      if (!reassignToUserId) {
        throw new BadRequestException({
          statusCode: 400,
          code: 'REASSIGN_REQUIRED',
          message: `Choose who takes over ${openWork.leads} open lead(s) and ${openWork.tasks} open task(s).`,
          openWork,
        });
      }
      if (reassignToUserId === id) {
        throw new BadRequestException('Choose another person to take over the open work.');
      }
      const target = await this.usersRepository.findOne({ where: { id: reassignToUserId } });
      if (!target || !target.isActive || !ASSIGNABLE_ROLES.includes(target.role)) {
        throw new BadRequestException('The new owner must be an active salesperson or admin.');
      }
      await this.usersRepository.query(
        `UPDATE "leads" SET "assignedSalesId" = $1 WHERE "assignedSalesId" = $2 AND COALESCE("status"::text, '') <> ALL($3::text[])`,
        [target.id, id, CLOSED_LEAD_STATUSES],
      );
      await this.usersRepository.query(
        `UPDATE "tasks" SET "assigneeId" = $1 WHERE "assigneeId" = $2 AND "status"::text = ANY($3::text[])`,
        [target.id, id, OPEN_TASK_STATUSES],
      );
      reassignedTo = target.id;
    }

    // isActive=false blocks login and every existing token at once (JwtStrategy checks it);
    // clearing the refresh token ends the session for good.
    await this.usersRepository.update(id, {
      isActive: false,
      refreshToken: null,
      loginCodeHash: null,
      profile: {
        ...(user.profile || {}),
        deactivatedAt: new Date().toISOString(),
        deactivatedBy: actorId,
        ...(reassignedTo ? { openWorkReassignedTo: reassignedTo } : {}),
      },
    } as any);

    return {
      user: await this.getUserById(id),
      reassigned: hasOpenWork ? openWork : { leads: 0, tasks: 0 },
      reassignedTo,
    };
  }

  async reactivateUser(id: string, actorId: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.profile?.staffRequest?.status === 'pending') {
      throw new BadRequestException('This is a pending staff request. Approve it instead.');
    }
    await this.usersRepository.update(id, {
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      profile: {
        ...(user.profile || {}),
        reactivatedAt: new Date().toISOString(),
        reactivatedBy: actorId,
      },
    } as any);
    return this.getUserById(id);
  }

  // ---------------------------------------------------------------------------
  // Staff requests from clinics (item 26)
  // ---------------------------------------------------------------------------

  async getPendingStaffRequests(): Promise<any[]> {
    const users = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.assignedClinic', 'clinic')
      .where(`(user.profile::jsonb #>> '{staffRequest,status}') = 'pending'`)
      .orderBy('user.createdAt', 'ASC')
      .getMany();
    return users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      clinic: u.assignedClinic ? { id: u.assignedClinic.id, name: u.assignedClinic.name } : null,
      requestedBy: u.profile?.staffRequest?.requestedByName || null,
      requestedAt: u.profile?.staffRequest?.requestedAt || u.createdAt,
    }));
  }

  private async getPendingRequestOrFail(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user || user.profile?.staffRequest?.status !== 'pending') {
      throw new NotFoundException('Staff request not found or already handled.');
    }
    return user;
  }

  async approveStaffRequest(id: string, actorId: string): Promise<User> {
    const user = await this.getPendingRequestOrFail(id);
    await this.usersRepository.update(id, {
      isActive: true,
      isEmailVerified: true,
      accountSetupPending: true,
      profile: {
        ...(user.profile || {}),
        staffRequest: {
          ...(user.profile?.staffRequest || {}),
          status: 'approved',
          reviewedBy: actorId,
          reviewedAt: new Date().toISOString(),
        },
      },
    } as any);
    const approved = await this.usersRepository.findOne({ where: { id } });
    // The new staff member chooses their own password through a one-time link.
    await this.accountLinks.sendSetPasswordLink(approved!, 'staff');
    return this.getUserById(id);
  }

  async rejectStaffRequest(id: string, actorId: string): Promise<{ message: string }> {
    const user = await this.getPendingRequestOrFail(id);
    try {
      // The account was never active and owns nothing: remove it so the email is free again.
      await this.usersRepository.delete(id);
    } catch {
      await this.usersRepository.update(id, {
        email: `rejected-${id}@invalid.local`,
        isActive: false,
        profile: {
          ...(user.profile || {}),
          staffRequest: { ...(user.profile?.staffRequest || {}), status: 'rejected', reviewedBy: actorId, reviewedAt: new Date().toISOString() },
        },
      } as any);
    }
    return { message: 'Staff request rejected.' };
  }

  assertCanAssignRole(actorRole: string, role?: string) {
    if (role === UserRole.SUPER_ADMIN && actorRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You are not allowed to assign the SUPER_ADMIN role.');
    }
  }

  async updateUser(id: string, updateData: Partial<User> & { assignedClinicIds?: string[] }): Promise<User> {
    const { assignedClinicIds, ...rest } = updateData;

    // Whitelist updatable columns — prevents mass-assignment of passwordHash, refreshToken,
    // emailVerificationToken, or other sensitive columns via `@Body() any`.
    const ALLOWED_FIELDS = [
      // isActive is changed only through deactivate/reactivate (open work must be handed over).
      'firstName', 'lastName', 'email', 'phone', 'role',
      'assignedClinicId', 'monthlyTarget', 'profile', 'profilePictureUrl',
    ] as const;
    const dataToUpdate: any = {};
    for (const key of ALLOWED_FIELDS) {
      if ((rest as any)[key] !== undefined) dataToUpdate[key] = (rest as any)[key];
    }

    await this.usersRepository.update(id, dataToUpdate);

    if (assignedClinicIds !== undefined) {
      // After update, re-fetch to get potentially updated role
      const user = await this.usersRepository.findOne({ where: { id } });
      const effectiveRole = (dataToUpdate as any).role || user?.role;

      if (effectiveRole === 'clinic_owner') {
        // Clear non-owner agent access if role changed to owner
        await this.agentClinicAccessRepository.delete({ agentUserId: id });
        // Update clinic_ownership mapping table for owner
        await this.clinicOwnershipRepository.delete({ ownerUserId: id });
        for (const clinicId of assignedClinicIds) {
          await this.clinicOwnershipRepository.save(
            this.clinicOwnershipRepository.create({ clinicId, ownerUserId: id, visibilityScope: 'shared' })
          );
        }
        // Also update the primary ownerId on the first clinic if provided
        if (assignedClinicIds.length > 0) {
          await this.clinicsRepository.update(assignedClinicIds[0], { ownerId: id });
        }
      } else {
        // Clear owner mapping if role changed to non-owner
        await this.clinicOwnershipRepository.delete({ ownerUserId: id });
        // For non-owners: update agent_clinic_access table
        await this.agentClinicAccessRepository.delete({ agentUserId: id });
        for (const clinicId of assignedClinicIds) {
          await this.agentClinicAccessRepository.save(
            this.agentClinicAccessRepository.create({ agentUserId: id, clinicId })
          );
        }
        await this.usersRepository.update(id, {
          assignedClinicId: assignedClinicIds.length > 0 ? assignedClinicIds[0] : null
        });
      }
    }

    return this.getUserById(id);
  }

  /** Kept for older clients: deactivation still requires reassigning open work. */
  async toggleUserStatus(id: string, actorId?: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.isActive) {
      return (await this.deactivateUser(id, actorId || '')).user;
    }
    return this.reactivateUser(id, actorId || '');
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.getUserById(id);
    await this.usersRepository.remove(user);
  }

  // Clinic Management
  async getAllClinics(query?: { isActive?: boolean; search?: string; limit?: number; offset?: number }): Promise<any> {
    const queryBuilder = this.clinicsRepository.createQueryBuilder('clinic')
      .leftJoinAndSelect('clinic.owner', 'owner')
      .leftJoinAndSelect('clinic.owners', 'owners')
      .leftJoinAndSelect('clinic.services', 'services')
      // Bank columns are select: false; admins manage them, so load them here explicitly.
      .addSelect(['clinic.bankIban', 'clinic.bankBic', 'clinic.bankAccountHolder', 'clinic.bankName']);

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
      relations: ['owner', 'owners', 'services', 'appointments'],
    });

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    return clinic;
  }

  async toggleClinicStatus(id: string): Promise<Clinic> {
    const clinic = await this.getClinicById(id);
    clinic.isActive = !clinic.isActive;
    return this.clinicsService.withBankFields(await this.clinicsRepository.save(clinic));
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