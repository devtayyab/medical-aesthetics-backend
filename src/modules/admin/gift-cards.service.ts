import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GiftCard } from '../clinics/entities/gift-card.entity';
import * as crypto from 'crypto';

@Injectable()
export class GiftCardsService {
    constructor(
        @InjectRepository(GiftCard)
        private giftCardRepository: Repository<GiftCard>,
        private eventEmitter: EventEmitter2,
    ) {}

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

        const { totalRedeemed } = await this.giftCardRepository
            .createQueryBuilder('gc')
            .select('SUM(gc.amount - gc.balance)', 'totalRedeemed')
            .getRawOne();

        return {
            activeCards: parseInt(totalActiveCards) || 0,
            totalLiability: parseFloat(totalLiability) || 0,
            totalRedeemed: parseFloat(totalRedeemed) || 0,
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

    async redeemGiftCard(code: string, amount: number, recordedById?: string) {
        const giftCard = await this.giftCardRepository.findOne({
            where: { code, isActive: true },
        });

        if (!giftCard) {
            throw new NotFoundException('Gift card not found, inactive, or invalid code');
        }

        if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
            giftCard.isActive = false;
            await this.giftCardRepository.save(giftCard);
            throw new NotFoundException('Gift card has expired');
        }

        const redeemAmount = Number(amount);
        const currentBalance = Number(giftCard.balance);

        if (redeemAmount > currentBalance) {
            throw new NotFoundException(`Insufficient gift card balance. Available: €${currentBalance.toFixed(2)}`);
        }

        const beforeBalance = currentBalance;
        giftCard.balance = currentBalance - redeemAmount;
        if (giftCard.balance <= 0.01) {
            giftCard.balance = 0;
            giftCard.isActive = false;
        }

        await this.giftCardRepository.save(giftCard);

        this.eventEmitter.emit('audit.log', {
            userId: recordedById,
            action: 'GIFT_CARD_REDEEM',
            resource: 'gift_cards',
            resourceId: giftCard.id,
            changes: { before: { balance: beforeBalance }, after: { balance: giftCard.balance, redeemedAmount: redeemAmount } },
            data: { code: giftCard.code, redeemAmount, remainingBalance: giftCard.balance },
        });

        return {
            success: true,
            redeemedAmount: redeemAmount,
            remainingBalance: giftCard.balance,
            code: giftCard.code
        };
    }
}
