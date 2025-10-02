import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LoyaltyLedger } from './entities/loyalty-ledger.entity';
import { ClinicsService } from '../clinics/clinics.service';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(LoyaltyLedger)
    private ledgerRepository: Repository<LoyaltyLedger>,
    private eventEmitter: EventEmitter2,
    private clinicsService: ClinicsService,
  ) {}

  async getClientBalance(clientId: string, clinicId?: string): Promise<any> {
    let queryBuilder = this.ledgerRepository
      .createQueryBuilder('ledger')
      .select('SUM(ledger.points)', 'totalPoints')
      .where('ledger.clientId = :clientId', { clientId })
      .andWhere('(ledger.expiresAt IS NULL OR ledger.expiresAt > NOW())');

    if (clinicId) {
      queryBuilder = queryBuilder.andWhere('ledger.clinicId = :clinicId', { clinicId });
    }

    const result = await queryBuilder.getRawOne();
    const totalPoints = parseInt(result.totalPoints) || 0;

    // Calculate tier based on points
    const tier = this.calculateTier(totalPoints);

    return {
      clientId,
      clinicId,
      totalPoints,
      tier,
    };
  }

  async awardPoints(
    clientId: string,
    clinicId: string,
    points: number,
    description: string,
    appointmentId?: string,
    expirationMonths: number = 12,
  ): Promise<LoyaltyLedger> {
    const ledgerEntry = this.ledgerRepository.create({
      clientId,
      clinicId,
      points,
      transactionType: 'earned',
      description,
      appointmentId,
      expiresAt: new Date(Date.now() + expirationMonths * 30 * 24 * 60 * 60 * 1000),
    });

    const savedEntry = await this.ledgerRepository.save(ledgerEntry);

    // Check for tier changes
    const balance = await this.getClientBalance(clientId, clinicId);
    this.eventEmitter.emit('loyalty.points.awarded', {
      clientId,
      clinicId,
      points,
      balance,
    });

    return savedEntry;
  }

  async redeemPoints(
    clientId: string,
    clinicId: string,
    points: number,
    description: string,
  ): Promise<LoyaltyLedger> {
    const balance = await this.getClientBalance(clientId, clinicId);
    
    if (balance.totalPoints < points) {
      throw new BadRequestException('Insufficient points balance');
    }

    const ledgerEntry = this.ledgerRepository.create({
      clientId,
      clinicId,
      points: -points, // Negative for redemption
      transactionType: 'redeemed',
      description,
    });

    const savedEntry = await this.ledgerRepository.save(ledgerEntry);

    this.eventEmitter.emit('loyalty.points.redeemed', {
      clientId,
      clinicId,
      points,
      balance: await this.getClientBalance(clientId, clinicId),
    });

    return savedEntry;
  }

  async getTransactionHistory(clientId: string, clinicId?: string): Promise<LoyaltyLedger[]> {
    const queryBuilder = this.ledgerRepository
      .createQueryBuilder('ledger')
      .where('ledger.clientId = :clientId', { clientId });

    if (clinicId) {
      queryBuilder.andWhere('ledger.clinicId = :clinicId', { clinicId });
    }

    return queryBuilder
      .orderBy('ledger.createdAt', 'DESC')
      .limit(50)
      .getMany();
  }

  private calculateTier(points: number): string {
    if (points >= 1000) return 'platinum';
    if (points >= 500) return 'gold';
    if (points >= 200) return 'silver';
    return 'bronze';
  }

  async calculatePointsForAppointment(appointmentAmount: number): Promise<number> {
    // 1 point per $1 spent, with bonus multipliers for higher tiers
    return Math.floor(appointmentAmount);
  }

  async expireOldPoints(): Promise<void> {
    const expiredEntries = await this.ledgerRepository.find({
      where: {
        expiresAt: new Date(),
        transactionType: 'earned',
      },
    });

    for (const entry of expiredEntries) {
      await this.ledgerRepository.save({
        ...entry,
        id: undefined, // Create new entry
        points: -entry.points,
        transactionType: 'expired',
        description: `Points expired from ${entry.description}`,
        expiresAt: null,
      });
    }
  }

  async getClinicLoyaltyAnalytics(
    userId: string,
    userRole: string,
    query: { startDate?: string; endDate?: string },
  ): Promise<any> {
    // Get clinic based on user role
    let clinic;
    if (userRole === 'clinic_owner') {
      clinic = await this.clinicsService.findByOwnerId(userId);
    } else {
      throw new Error('Loyalty analytics not available for this user role');
    }

    if (!clinic) {
      throw new Error('Clinic not found');
    }

    // Get loyalty statistics for the clinic
    const loyaltyStats = await this.ledgerRepository
      .createQueryBuilder('ledger')
      .select([
        'SUM(ledger.points) as totalPoints',
        'COUNT(DISTINCT ledger.clientId) as uniqueClients',
        'AVG(ledger.points) as avgPointsPerTransaction',
      ])
      .where('ledger.clinicId = :clinicId', { clinicId: clinic.id });

    if (query.startDate && query.endDate) {
      loyaltyStats.andWhere('ledger.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      });
    }

    const stats = await loyaltyStats.getRawOne();

    // Get top clients by points
    const topClients = await this.ledgerRepository
      .createQueryBuilder('ledger')
      .select([
        'ledger.clientId',
        'SUM(ledger.points) as totalPoints',
        'COUNT(ledger.id) as transactions',
      ])
      .where('ledger.clinicId = :clinicId', { clinicId: clinic.id })
      .andWhere('(ledger.expiresAt IS NULL OR ledger.expiresAt > NOW())')
      .groupBy('ledger.clientId')
      .orderBy('totalPoints', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      clinicId: clinic.id,
      clinicName: clinic.name,
      period: { startDate: query.startDate, endDate: query.endDate },
      stats: {
        totalPoints: parseInt(stats.totalPoints) || 0,
        uniqueClients: parseInt(stats.uniqueClients) || 0,
        avgPointsPerTransaction: parseFloat(stats.avgPointsPerTransaction) || 0,
      },
      topClients,
    };
  }
}