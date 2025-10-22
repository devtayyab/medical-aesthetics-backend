import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { ConsentRecord } from './entities/consent-record.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(ConsentRecord)
    private consentRepository: Repository<ConsentRecord>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = this.usersRepository.create({
      ...createUserDto,
      passwordHash: createUserDto.password,
    });

    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
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

  async updateRefreshToken(id: string, refreshToken: string): Promise<void> {
    // If refreshToken is null/undefined, clear it
    if (!refreshToken) {
      console.log(`[UsersService] Clearing refreshToken for user: ${id}`);
      await this.usersRepository.update(id, { refreshToken: null });
      return;
    }

    // Hash the refresh token before storing to avoid storing raw JWTs and
    // to avoid issues with column length/truncation.
    // Log a short prefix for debugging (do NOT log full tokens in prod)
    try {
      console.log(
        `[UsersService] Storing refreshToken for user: ${id}, tokenPrefix: ${refreshToken.substring(0, 20)}...`
      );
    } catch (e) {
      // ignore
    }
    const hashed = await bcrypt.hash(refreshToken, 12);
    await this.usersRepository.update(id, { refreshToken: hashed });
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
}