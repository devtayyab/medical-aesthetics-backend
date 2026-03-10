import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GiftCard } from '../clinics/entities/gift-card.entity';
import * as crypto from 'crypto';

@Injectable()
export class GiftCardsService {
    constructor(
        @InjectRepository(GiftCard)
        private giftCardRepository: Repository<GiftCard>,
    ) { }

    async getSummary() {
        const { totalActiveCards } = await this.giftCardRepository
            .createQueryBuilder('gc')
            .select('COUNT(gc.id)', 'totalActiveCards')
            .where('gc.isActive = :isActive', { isActive: true })
            .getRawOne();

        const { totalLiability } = await this.giftCardRepository
            .createQueryBuilder('gc')
            .select('SUM(gc.balance)', 'totalLiability')
            .where('gc.isActive = :isActive', { isActive: true })
            .getRawOne();

        return {
            activeCards: parseInt(totalActiveCards) || 0,
            totalLiability: parseFloat(totalLiability) || 0,
        };
    }

    async getAllGiftCards(query?: { search?: string }) {
        const qb = this.giftCardRepository.createQueryBuilder('gc')
            .leftJoinAndSelect('gc.user', 'user')
            .orderBy('gc.createdAt', 'DESC');

        if (query?.search) {
            qb.andWhere('(gc.code ILIKE :search OR gc.recipientEmail ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)', {
                search: `%${query.search}%`,
            });
        }

        return qb.getMany();
    }

    async generateGiftCard(adminId: string, data: { amount: number; recipientEmail?: string; message?: string; expiresAt?: Date }) {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();

        const giftCard = this.giftCardRepository.create({
            code,
            amount: data.amount,
            balance: data.amount,
            isActive: true,
            recipientEmail: data.recipientEmail,
            message: data.message,
            expiresAt: data.expiresAt,
            userId: adminId, // Using adminId who generated it, maybe should be the user who bought it, but for global ones admin is fine
        });

        return this.giftCardRepository.save(giftCard);
    }
}
