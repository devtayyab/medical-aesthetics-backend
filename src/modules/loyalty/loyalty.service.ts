import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LoyaltyLedger } from './entities/loyalty-ledger.entity';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(LoyaltyLedger)
    private ledgerRepository: Repository<LoyaltyLedger>,
    private eventEmitter: EventEmitter2,
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
}