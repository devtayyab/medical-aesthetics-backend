import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { Offer } from './entities/offer.entity';
import { Reward } from './entities/reward.entity';
import { PlatformSettings } from './entities/platform-settings.entity';
import { User } from '../users/entities/user.entity';
import { Clinic } from '../clinics/entities/clinic.entity';
import { Appointment } from '../bookings/entities/appointment.entity';
import { LoyaltyLedger } from '../loyalty/entities/loyalty-ledger.entity';

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
    @InjectRepository(LoyaltyLedger)
    private loyaltyRepository: Repository<LoyaltyLedger>,
  ) { }

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
    // Platform-wide settings would be stored in a separate entity
    // For now, return mock settings
    return {
      loyaltyPointsPerDollar: 1,
      pointsExpirationMonths: 12,
      appointmentReminderHours: 24,
      businessHours: {
        monday: { open: '09:00', close: '17:00', isOpen: true },
        tuesday: { open: '09:00', close: '17:00', isOpen: true },
        wednesday: { open: '09:00', close: '17:00', isOpen: true },
        thursday: { open: '09:00', close: '17:00', isOpen: true },
        friday: { open: '09:00', close: '17:00', isOpen: true },
        saturday: { open: '10:00', close: '15:00', isOpen: true },
        sunday: { open: '10:00', close: '15:00', isOpen: false },
      },
    };
  }

  async updateSettings(settings: any): Promise<any> {
    // In a real implementation, this would update settings in the database
    return settings;
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
        'user.createdAt',
        'user.lastLoginAt',
      ])
      .orderBy('user.createdAt', 'DESC')
      .getMany();

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

    return user;
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, updateData);
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

    if (dateRange?.startDate && dateRange?.endDate) {
      appointmentQuery = appointmentQuery.where(
        'appointment.startTime BETWEEN :startDate AND :endDate',
        {
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate),
        }
      );
    }

    const appointmentStats = await appointmentQuery
      .select([
        'COUNT(appointment.id) as totalAppointments',
        'SUM(appointment.totalAmount) as totalRevenue',
        'AVG(appointment.totalAmount) as avgAppointmentValue',
        'COUNT(CASE WHEN appointment.status = \'completed\' THEN 1 END) as completedAppointments',
        'COUNT(CASE WHEN appointment.status = \'cancelled\' THEN 1 END) as cancelledAppointments',
      ])
      .getRawOne();

    // Loyalty statistics
    let loyaltyQuery = this.loyaltyRepository.createQueryBuilder('loyalty');

    if (dateRange?.startDate && dateRange?.endDate) {
      loyaltyQuery = loyaltyQuery.where(
        'loyalty.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate),
        }
      );
    }

    const loyaltyStats = await loyaltyQuery
      .select([
        'SUM(loyalty.points) as totalPointsIssued',
        'COUNT(DISTINCT loyalty.clientId) as clientsWithPoints',
        'AVG(loyalty.points) as avgPointsPerTransaction',
      ])
      .getRawOne();

    return {
      period: dateRange,
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
      },
      revenue: {
        total: parseFloat(appointmentStats.totalRevenue) || 0,
        avgPerAppointment: parseFloat(appointmentStats.avgAppointmentValue) || 0,
      },
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
    const query: any = {};
    if (category) {
      query.category = category;
    }
    return this.settingsRepository.find({ where: query });
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
}