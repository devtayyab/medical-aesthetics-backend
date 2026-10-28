import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentRecord, PaymentMethod, PaymentType, PaymentStatus } from './entities/payment-record.entity';
import { Appointment } from '../bookings/entities/appointment.entity';
import { GiftCard } from '../clinics/entities/gift-card.entity';
import { Clinic } from '../clinics/entities/clinic.entity';
import { NotificationsService } from '../notifications/notifications.service';
import * as crypto from 'crypto';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class FinancialService {
    constructor(
        @InjectRepository(PaymentRecord)
        private paymentRecordsRepository: Repository<PaymentRecord>,
        @InjectRepository(Appointment)
        private appointmentsRepository: Repository<Appointment>,
        @InjectRepository(GiftCard)
        private giftCardRepository: Repository<GiftCard>,
        private eventEmitter: EventEmitter2,
        private notificationsService: NotificationsService,
    ) {}

    async recordPayment(data: {
        appointmentId?: string;
        clinicId: string;
        clientId: string;
        providerId?: string;
        salespersonId?: string;
        amount: number;
        method: PaymentMethod;
        type?: PaymentType;
        status?: PaymentStatus;
        transactionReference?: string;
        notes?: string;
        metadata?: any;
        recordedById?: string;
    }): Promise<PaymentRecord> {
        // Every payment carries the salesperson. When the caller does not pass one, derive it
        // from the linked appointment (its representative, else whoever booked it, if staff).
        if (!data.salespersonId && data.appointmentId) {
            data = { ...data, salespersonId: (await this.resolveAppointmentSalespersonId(data.appointmentId)) || undefined };
        }

        const payment = this.paymentRecordsRepository.create({
            ...data,
            type: data.type || PaymentType.PAYMENT,
            status: data.status || PaymentStatus.COMPLETED,
        });

        const savedPayment = await this.paymentRecordsRepository.save(payment);

        // Notify Staff about payment
        if (savedPayment.type === PaymentType.PAYMENT) {
          this.notificationsService.notifyAllStaff(
            'New Payment Received',
            `A payment of ${savedPayment.amount} has been recorded via ${savedPayment.method}.`,
            { paymentId: savedPayment.id }
          );

          if (savedPayment.clinicId) {
            this.notificationsService.notifyClinicStaff(
              savedPayment.clinicId,
              'Clinic Payment Received',
              `Payment of ${savedPayment.amount} recorded for your clinic.`,
              { paymentId: savedPayment.id, amount: savedPayment.amount }
            );
          }
        }

        // Update appointment if linked
        if (data.appointmentId) {
            const appointment = await this.appointmentsRepository.findOne({ where: { id: data.appointmentId } });
            if (appointment) {
                const currentPaid = Number(appointment.amountPaid || 0);
                if (data.type === PaymentType.REFUND || data.type === PaymentType.VOID) {
                    await this.appointmentsRepository.update(data.appointmentId, {
                        amountPaid: currentPaid - data.amount,
                    });
                } else {
                    await this.appointmentsRepository.update(data.appointmentId, {
                        amountPaid: currentPaid + data.amount,
                        paymentMethod: data.method,
                    });
                }
            }
        }

        return savedPayment;
    }

    /**
     * The salesperson credited for an appointment's payments: the appointment's representative,
     * otherwise the staff member who booked it (never the client, never a doctor/clinic account).
     */
    async resolveAppointmentSalespersonId(appointmentId: string): Promise<string | null> {
        const appointment = await this.appointmentsRepository.findOne({
            where: { id: appointmentId },
            relations: ['representative', 'bookedBy'],
        });
        if (!appointment) return null;
        const salesRoles = [UserRole.SALESPERSON, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN].map(r => String(r).toLowerCase());
        const isSales = (u?: any) => !!u && salesRoles.includes(String(u.role || '').toLowerCase());
        if (appointment.representativeId && isSales(appointment.representative)) return appointment.representativeId;
        if (appointment.bookedById && isSales(appointment.bookedBy)) return appointment.bookedById;
        return null;
    }

    /**
     * Payment summary for one appointment: total price, every payment with its method,
     * paid so far (net of refunds/voids) and the open balance. Used for partial payments.
     */
    async getAppointmentPaymentSummary(appointmentId: string) {
        const appointment = await this.appointmentsRepository.findOne({ where: { id: appointmentId } });
        if (!appointment) throw new NotFoundException('Appointment not found');

        const records = await this.paymentRecordsRepository.find({
            where: { appointmentId },
            relations: ['recordedBy', 'salesperson'],
            order: { createdAt: 'ASC' },
        });

        const counted = records.filter(r =>
            r.status === PaymentStatus.COMPLETED || r.status === PaymentStatus.REFUNDED || r.status === PaymentStatus.VOIDED,
        );
        const paid = counted.reduce((sum, r) => {
            const sign = r.type === PaymentType.REFUND || r.type === PaymentType.VOID ? -1 : 1;
            return sum + sign * Number(r.amount || 0);
        }, 0);
        const giftCard = Number(appointment.giftCardAmountRedeemed || 0);
        const total = Number(appointment.totalAmount || 0);
        const balance = Math.max(0, Math.round((total - paid - giftCard) * 100) / 100);

        return {
            appointmentId,
            currency: 'EUR',
            total,
            paid: Math.round(paid * 100) / 100,
            giftCardRedeemed: giftCard,
            balance,
            isFullyPaid: total > 0 && balance <= 0,
            payments: records.map(r => ({
                id: r.id,
                amount: Number(r.amount || 0),
                method: r.method,
                type: r.type,
                status: r.status,
                createdAt: r.createdAt,
                notes: r.notes,
                recordedBy: r.recordedBy ? `${r.recordedBy.firstName || ''} ${r.recordedBy.lastName || ''}`.trim() : null,
                salespersonId: r.salespersonId || null,
                salesperson: r.salesperson ? `${r.salesperson.firstName || ''} ${r.salesperson.lastName || ''}`.trim() : null,
            })),
        };
    }

    async getLedger(filters: {
        clinicId?: string;
        providerId?: string;
        salespersonId?: string;
        clientId?: string;
        startDate?: string;
        endDate?: string;
        method?: PaymentMethod;
        limit?: number;
        offset?: number;
    }) {
        const query = this.paymentRecordsRepository.createQueryBuilder('payment')
            .leftJoinAndSelect('payment.clinic', 'clinic')
            .leftJoinAndSelect('payment.client', 'client')
            .leftJoinAndSelect('payment.provider', 'provider')
            .leftJoinAndSelect('payment.salesperson', 'salesperson')
            .leftJoinAndSelect('payment.appointment', 'appointment')
            .leftJoinAndSelect('appointment.service', 'service')
            .leftJoinAndSelect('service.treatment', 'treatment');

        if (filters.clinicId) query.andWhere('payment.clinicId = :clinicId', { clinicId: filters.clinicId });
        if (filters.providerId) query.andWhere('payment.providerId = :providerId', { providerId: filters.providerId });
        if (filters.salespersonId) query.andWhere('payment.salespersonId = :salespersonId', { salespersonId: filters.salespersonId });
        if (filters.clientId) query.andWhere('payment.clientId = :clientId', { clientId: filters.clientId });
        if (filters.method) query.andWhere('payment.method = :method', { method: filters.method });

        if (filters.startDate && filters.startDate.trim() !== '') {
            query.andWhere('payment.createdAt >= :startDate', { startDate: new Date(filters.startDate) });
        }
        if (filters.endDate && filters.endDate.trim() !== '') {
            const end = new Date(filters.endDate);
            if (!isNaN(end.getTime())) {
                end.setHours(23, 59, 59, 999);
                query.andWhere('payment.createdAt <= :endDate', { endDate: end });
            }
        }

        const parsedLimit = filters.limit ? parseInt(filters.limit as any, 10) : 50;
        const parsedOffset = filters.offset ? parseInt(filters.offset as any, 10) : 0;

        const [items, total] = await query
            .orderBy('payment.createdAt', 'DESC')
            .take(isNaN(parsedLimit) ? 50 : parsedLimit)
            .skip(isNaN(parsedOffset) ? 0 : parsedOffset)
            .getManyAndCount();

        return { items, total };
    }

    /** Look up a payment by its transaction reference (used for webhook idempotency). */
    async findByTransactionReference(ref?: string): Promise<PaymentRecord | null> {
        if (!ref) return null;
        return this.paymentRecordsRepository.findOne({ where: { transactionReference: ref } });
    }

    /** Latest COMPLETED payment for an appointment (used to reverse Viva refunds). */
    async findCompletedPaymentByAppointment(appointmentId: string): Promise<PaymentRecord | null> {
        if (!appointmentId) return null;
        return this.paymentRecordsRepository.findOne({
            where: { appointmentId, type: PaymentType.PAYMENT, status: PaymentStatus.COMPLETED },
            order: { createdAt: 'DESC' },
        });
    }

    async refundPayment(paymentId: string, notes?: string, recordedById?: string): Promise<PaymentRecord> {
        const originalPayment = await this.paymentRecordsRepository.findOne({ where: { id: paymentId } });
        if (!originalPayment) throw new NotFoundException('Payment record not found');

        // Only a genuine, completed payment can be reversed — never a pending/failed record,
        // and never a refund/void/deposit record.
        if (originalPayment.type !== PaymentType.PAYMENT || originalPayment.status !== PaymentStatus.COMPLETED) {
            throw new BadRequestException('Only completed payments can be refunded');
        }

        // Create a refund record
        const refund = await this.recordPayment({
            appointmentId: originalPayment.appointmentId,
            clinicId: originalPayment.clinicId,
            clientId: originalPayment.clientId,
            providerId: originalPayment.providerId,
            salespersonId: originalPayment.salespersonId,
            amount: originalPayment.amount,
            method: originalPayment.method,
            type: PaymentType.REFUND,
            status: PaymentStatus.COMPLETED,
            transactionReference: `REF-${originalPayment.transactionReference || originalPayment.id}`,
            notes: notes || `Refund for payment ${originalPayment.id}`,
            recordedById,
        });

        // Update original payment status
        await this.paymentRecordsRepository.update(paymentId, { status: PaymentStatus.REFUNDED });

        // Notify Admin specifically for Refund (Cancel Amount)
        this.notificationsService.notifyAllStaff(
            'Payment Refunded (Amount Cancelled)',
            `A refund of ${originalPayment.amount} has been processed for appointment ${originalPayment.appointmentId}.`,
            { paymentId, originalPaymentId: paymentId, type: 'REFUND' }
        );

        this.eventEmitter.emit('audit.log', {
            userId: recordedById,
            action: 'PAYMENT_REFUND',
            resource: 'payments',
            resourceId: paymentId,
            changes: { before: { status: originalPayment.status, amount: originalPayment.amount }, after: { status: PaymentStatus.REFUNDED } },
            data: { paymentId, appointmentId: originalPayment.appointmentId, amount: originalPayment.amount, notes },
        });

        return refund;
    }

    async voidPayment(paymentId: string, notes?: string, recordedById?: string): Promise<PaymentRecord> {
        const originalPayment = await this.paymentRecordsRepository.findOne({ where: { id: paymentId } });
        if (!originalPayment) throw new NotFoundException('Payment record not found');

        if (originalPayment.type !== PaymentType.PAYMENT || originalPayment.status !== PaymentStatus.COMPLETED) {
            throw new BadRequestException('Only completed payments can be voided');
        }

        // Create a void record
        const voidRecord = await this.recordPayment({
            appointmentId: originalPayment.appointmentId,
            clinicId: originalPayment.clinicId,
            clientId: originalPayment.clientId,
            providerId: originalPayment.providerId,
            salespersonId: originalPayment.salespersonId,
            amount: originalPayment.amount,
            method: originalPayment.method,
            type: PaymentType.VOID,
            status: PaymentStatus.COMPLETED,
            transactionReference: `VOID-${originalPayment.transactionReference || originalPayment.id}`,
            notes: notes || `Void for payment ${originalPayment.id}`,
            recordedById,
        });

        // Update original payment status
        await this.paymentRecordsRepository.update(paymentId, { status: PaymentStatus.VOIDED });

        // Notify Admin specifically for Void (Amount Cancelled)
        this.notificationsService.notifyAllStaff(
            'Payment Voided (Amount Cancelled)',
            `A payment of ${originalPayment.amount} has been voided.`,
            { paymentId, type: 'VOID' }
        );

        this.eventEmitter.emit('audit.log', {
            userId: recordedById,
            action: 'PAYMENT_VOID',
            resource: 'payments',
            resourceId: paymentId,
            changes: { before: { status: originalPayment.status, amount: originalPayment.amount }, after: { status: PaymentStatus.VOIDED } },
            data: { paymentId, appointmentId: originalPayment.appointmentId, amount: originalPayment.amount, notes },
        });

        return voidRecord;
    }

    async getMyGiftCards(userId: string): Promise<GiftCard[]> {
        return this.giftCardRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async purchaseGiftCard(userId: string, data: { amount: number; recipientEmail?: string; message?: string }): Promise<GiftCard> {
        const code = 'BD-' + crypto.randomBytes(4).toString('hex').toUpperCase();
        
        // Expiration date: 1 year from now
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        const giftCard = this.giftCardRepository.create({
            code,
            amount: data.amount,
            balance: data.amount,
            isActive: false, // Inactive until paid
            recipientEmail: data.recipientEmail,
            message: data.message,
            expiresAt,
            userId,
        });

        const savedCard = await this.giftCardRepository.save(giftCard);

        return savedCard;
    }

    async validateGiftCard(code: string): Promise<{ valid: boolean; balance: number; id: string }> {
        const giftCard = await this.giftCardRepository.findOne({
            where: { code, isActive: true },
        });

        if (!giftCard) {
            throw new NotFoundException('Gift card not found, inactive, or already used');
        }

        if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
            throw new NotFoundException('Gift card has expired');
        }

        const balance = Number(giftCard.balance);
        if (balance <= 0) {
            throw new NotFoundException('Gift card has zero balance');
        }

        return {
            valid: true,
            balance,
            id: giftCard.id,
        };
    }
}
