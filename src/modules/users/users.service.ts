import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { ConsentRecord } from './entities/consent-record.entity';
import { ClinicOwnership } from '../crm/entities/clinic-ownership.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';
import { LoyaltyLedger } from '../loyalty/entities/loyalty-ledger.entity';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { assertPasswordPolicy } from '../../common/utils/password-policy.util';
import { normalizeEmail } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(ConsentRecord)
    private consentRepository: Repository<ConsentRecord>,
    @InjectRepository(ClinicOwnership)
    private clinicOwnershipRepository: Repository<ClinicOwnership>,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    createUserDto = { ...createUserDto, email: normalizeEmail(createUserDto.email) };
    const existingUser = createUserDto.email ? await this.findByEmail(createUserDto.email) : null;

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(createUserDto.password, salt);

    const { assignedClinicIds, ...userData } = createUserDto as any;

    const primaryClinicId = (assignedClinicIds && assignedClinicIds.length > 0) ? assignedClinicIds[0] : userData.assignedClinicId;
    const user = this.usersRepository.create({
      ...userData,
      assignedClinicId: primaryClinicId,
      passwordHash,
      role: createUserDto.role || UserRole.CLIENT,
    });

    const savedUser = await this.usersRepository.save(user) as unknown as User;

    // Handle multiple clinic assignments for owners and staff/doctors
    if (assignedClinicIds && assignedClinicIds.length > 0) {
      if (createUserDto.role === UserRole.CLINIC_OWNER || createUserDto.role === 'clinic_owner' as any) {
        for (const clinicId of assignedClinicIds) {
          await this.clinicOwnershipRepository.save(
            this.clinicOwnershipRepository.create({ clinicId, ownerUserId: savedUser.id, visibilityScope: 'shared' })
          );
        }
      } else {
        const agentAccessRepo = this.usersRepository.manager.getRepository('agent_clinic_access');
        for (const clinicId of assignedClinicIds) {
          await agentAccessRepo.save(
            agentAccessRepo.create({ agentUserId: savedUser.id, clinicId })
          );
        }
      }
    }

    return savedUser;
  }

  /** Case-insensitive lookup (emails are stored lowercase; old mixed-case duplicates still match). */
  async findByEmail(email: string): Promise<User | null> {
    const normalized = normalizeEmail(email);
    if (!normalized) return null;
    return this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = :email', { email: normalized })
      .orderBy('user.lastLoginAt', 'DESC', 'NULLS LAST')
      .addOrderBy('user.createdAt', 'ASC')
      .getOne();
  }

  async findAll(query?: { role?: string; isActive?: boolean | string; includeInactive?: boolean | string; limit?: number; offset?: number; search?: string; salespersonId?: string }): Promise<User[]> {
    const queryBuilder = this.usersRepository.createQueryBuilder('user');
    
    if (query?.salespersonId) {
        queryBuilder.innerJoin('user.customerRecords', 'record');
        queryBuilder.andWhere('record.assignedSalespersonId = :salespersonId', { salespersonId: query.salespersonId });
    }

    if (query?.role) {
      queryBuilder.andWhere('user.role = :role', { role: query.role });
    }

    if (query?.isActive !== undefined && query.isActive !== '') {
      const isActive = query.isActive === true || query.isActive === 'true';
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    } else if (!(query?.includeInactive === true || query?.includeInactive === 'true')) {
      // Deactivated users disappear from pick lists unless explicitly requested.
      queryBuilder.andWhere('user.isActive = true');
    }

    if (query?.search && query.search.trim()) {
      const searchTrimmed = query.search.trim();
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR CONCAT(COALESCE(user.firstName, \'\'), \' \', COALESCE(user.lastName, \'\')) ILIKE :search OR CONCAT(COALESCE(user.lastName, \'\'), \' \', COALESCE(user.firstName, \'\')) ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${searchTrimmed}%` },
      );
    }

    if (query?.limit) {
      queryBuilder.limit(query.limit);
    } else {
      queryBuilder.limit(100); // Default limit for safety
    }

    if (query?.offset) {
      queryBuilder.offset(query.offset);
    }

    return queryBuilder.getMany();
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updateData: any = { ...updateUserDto };
    
    if (updateData.marketingEmailConsent === true) {
      updateData.marketingEmailConsentDate = new Date();
    } else if (updateData.marketingEmailConsent === false) {
      updateData.marketingEmailConsentDate = null;
    }

    await this.usersRepository.update(id, updateData);
    return this.findById(id);
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid current password');
    }

    await this.setPassword(id, changePasswordDto.newPassword);
  }

  /**
   * Single place that stores a new password. Hashes exactly once (repository.update does
   * not run entity hooks), clears lockout and pending login codes, and ends other sessions.
   */
  async setPassword(id: string, newPassword: string, extra: Partial<User> = {}): Promise<void> {
    assertPasswordPolicy(newPassword);
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.usersRepository.update(id, {
      ...extra,
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      loginCodeHash: null,
      loginCodeExpiresAt: null,
      loginCodeAttempts: 0,
      refreshToken: null,
    } as any);
  }

  async updateRefreshToken(id: string, refreshToken: string): Promise<void> {
    await this.usersRepository.update(id, { refreshToken });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, { lastLoginAt: new Date() });
  }

  async recordConsent(
    userId: string,
    consentType: string,
    version: string,
    granted: boolean,
    metadata?: any,
  ): Promise<ConsentRecord> {
    const consent = this.consentRepository.create({
      userId,
      consentType,
      version,
      granted,
      metadata,
    });

    return this.consentRepository.save(consent);
  }

  async exportUserData(userId: string): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: [
        'assignedLeads',
        'assignedTasks',
        'clientAppointments',
        'loyaltyRecords',
        'notifications',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const consents = await this.consentRepository.find({
      where: { userId },
    });

    return {
      user,
      consents,
      exportDate: new Date(),
    };
  }

  async deleteUserData(userId: string): Promise<void> {
    // This should implement GDPR-compliant data deletion
    // In a real application, you might want to anonymize rather than delete
    const user = await this.findById(userId);

    // Anonymize user data
    await this.usersRepository.update(userId, {
      email: `deleted-${userId}@deleted.com`,
      firstName: 'Deleted',
      lastName: 'User',
      phone: null,
      profile: null,
      profilePictureUrl: null,
      isActive: false,
      refreshToken: null, // Invalidate any existing session
    });

    // Delete consent records
    await this.consentRepository.delete({ userId });
  }

  async deactivateUserData(userId: string): Promise<any> {
    const user = await this.findById(userId);
    const updatedProfile = {
      ...(user.profile || {}),
      deletionRequestedAt: new Date().toISOString(),
      deletionStatus: 'pending',
    };

    // Submitting the deletion request does not immediately block access (GDPR grace period)
    await this.usersRepository.update(userId, {
      profile: updatedProfile,
    });

    return {
      success: true,
      message: 'Account deletion requested successfully. You can cancel this request at any time before final execution.',
      deletionRequestedAt: updatedProfile.deletionRequestedAt,
      deletionStatus: 'pending',
    };
  }

  async cancelAccountDeletion(userId: string): Promise<any> {
    const user = await this.findById(userId);
    const updatedProfile = {
      ...(user.profile || {}),
      deletionRequestedAt: null,
      deletionStatus: 'active',
    };

    await this.usersRepository.update(userId, {
      isActive: true,
      profile: updatedProfile,
    });

    return {
      success: true,
      message: 'Account deletion request has been cancelled. Your account remains active.',
    };
  }

  async executePermanentDeletion(userId: string): Promise<any> {
    const user = await this.findById(userId);
    const originalEmail = user.email;
    const anonymizedEmail = `deleted_${userId.slice(0, 8)}_${Date.now()}@anonymized.local`;

    // Scrub PII and release the user's email address so they can re-register in the future without "User with this email already exists" error
    await this.usersRepository.update(userId, {
      email: anonymizedEmail,
      firstName: 'Deleted',
      lastName: 'User',
      phone: '0000000000',
      isActive: false,
      refreshToken: null,
      profile: {
        ...(user.profile || {}),
        deletionStatus: 'executed',
        anonymizedAt: new Date().toISOString(),
        previousEmailHash: originalEmail ? Buffer.from(originalEmail).toString('base64').slice(0, 10) : undefined,
      },
    });

    return {
      success: true,
      message: 'Account permanently deleted and personal data anonymized in compliance with GDPR.',
    };
  }

  async getReferralStats(userId: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const referredUsers = await this.usersRepository.find({
      where: { referredById: userId },
      relations: ['clientAppointments'],
    });

    const totalInvited = referredUsers.length;
    const pending = referredUsers.filter(u => 
      !u.clientAppointments || !u.clientAppointments.some(a => a.status === AppointmentStatus.COMPLETED)
    ).length;
    const completed = totalInvited - pending;

    const ledgerRepository = this.usersRepository.manager.getRepository(LoyaltyLedger);
    const ledgerResult = await ledgerRepository.createQueryBuilder('ledger')
      .select('SUM(ledger.points)', 'earned')
      .where('ledger.clientId = :userId', { userId })
      .andWhere('ledger.description ILIKE :refDesc', { refDesc: '%referral%' })
      .getRawOne();
    
    const totalPointsEarned = parseInt(ledgerResult.earned) || 0;
    const totalEarnedCash = totalPointsEarned / 10; // 50 points = €5.00

    return {
      referralCode: user.referralCode || 'ELITE5',
      totalInvited,
      pending,
      completed,
      totalPointsEarned,
      totalEarnedCash,
    };
  }

  async saveEmailVerificationToken(userId: string, token: string, expiry: Date): Promise<void> {
    await this.usersRepository.update(userId, {
      emailVerificationToken: token,
      emailVerificationExpiry: expiry,
    } as any);
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
    } as any);
  }
}