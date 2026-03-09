import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyLedger } from '../loyalty/entities/loyalty-ledger.entity';

@Injectable()
export class WalletService {
    constructor(
        @InjectRepository(LoyaltyLedger)
        private ledgerRepository: Repository<LoyaltyLedger>
    ) { }

    async getWalletSummary() {
        // Points earned (total positive points from 'earned' transaction type)
        const { totalPointsEarned } = await this.ledgerRepository
            .createQueryBuilder('ledger')
            .select('SUM(ledger.points)', 'totalPointsEarned')
            .where('ledger.transactionType = :type', { type: 'earned' })
            .getRawOne();

        // Points redeemed (absolute of total negative points from 'redeemed' transaction type)
        const { totalPointsRedeemed } = await this.ledgerRepository
            .createQueryBuilder('ledger')
            .select('SUM(ledger.points)', 'totalPointsRedeemed')
            .where('ledger.transactionType = :type', { type: 'redeemed' })
            .getRawOne();

        const pointsToEuroRatio = 0.01; // 100 points = 1 euro (Update according to exact business rules)

        const pointsEarned = parseFloat(totalPointsEarned) || 0;
        const pointsRedeemed = Math.abs(parseFloat(totalPointsRedeemed)) || 0;

        return {
            totalPointsIssued: pointsEarned,
            totalEuroValueIssued: pointsEarned * pointsToEuroRatio,
            totalPointsRedeemed: pointsRedeemed,
        };
    }

    async getRecentTransactions() {
        return this.ledgerRepository.find({
            relations: ['client'],
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }
}
