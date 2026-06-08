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
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(createUserDto.password, salt);

    const { assignedClinicIds, ...userData } = createUserDto as any;

    const user = this.usersRepository.create({
      ...userData,
      passwordHash,
      role: createUserDto.role || UserRole.CLIENT,
    });

    const savedUser = await this.usersRepository.save(user) as unknown as User;

    // If creating a clinic_owner with multiple clinic assignments, create ownership records
    if ((createUserDto.role === UserRole.CLINIC_OWNER || createUserDto.role === 'clinic_owner' as any)
      && assignedClinicIds && assignedClinicIds.length > 0) {
      for (const clinicId of assignedClinicIds) {
        await this.clinicOwnershipRepository.save(
          this.clinicOwnershipRepository.create({ clinicId, ownerUserId: savedUser.id, visibilityScope: 'shared' })
        );
      }
    }

    return savedUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findAll(query?: { role?: string; isActive?: boolean; limit?: number; offset?: number; search?: string; salespersonId?: string }): Promise<User[]> {
    const queryBuilder = this.usersRepository.createQueryBuilder('user');
    
    if (query?.salespersonId) {
        queryBuilder.innerJoin('user.customerRecords', 'record');
        queryBuilder.andWhere('record.assignedSalespersonId = :salespersonId', { salespersonId: query.salespersonId });
    }

    if (query?.role) {
      queryBuilder.andWhere('user.role = :role', { role: query.role });
    }

    if (query?.isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: query.isActive });
    }

    if (query?.search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${query.search}%` },
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
    await this.usersRepository.update(id, updateUserDto);
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

    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, 12);
    await this.usersRepository.update(id, { passwordHash: newPasswordHash });
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
    });

    // Delete consent records
    await this.consentRepository.delete({ userId });
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
}