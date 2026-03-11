import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentRecord, PaymentMethod, PaymentType, PaymentStatus } from './entities/payment-record.entity';
import { Appointment } from '../bookings/entities/appointment.entity';

@Injectable()
export class FinancialService {
    constructor(
        @InjectRepository(PaymentRecord)
        private paymentRecordsRepository: Repository<PaymentRecord>,
        @InjectRepository(Appointment)
        private appointmentsRepository: Repository<Appointment>,
        private eventEmitter: EventEmitter2,
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
        const payment = this.paymentRecordsRepository.create({
            ...data,
            type: data.type || PaymentType.PAYMENT,
            status: data.status || PaymentStatus.COMPLETED,
        });

        const savedPayment = await this.paymentRecordsRepository.save(payment);

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

    async refundPayment(paymentId: string, notes?: string, recordedById?: string): Promise<PaymentRecord> {
        const originalPayment = await this.paymentRecordsRepository.findOne({ where: { id: paymentId } });
        if (!originalPayment) throw new NotFoundException('Payment record not found');

        if (originalPayment.status === PaymentStatus.REFUNDED) {
            throw new Error('Payment already refunded');
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

        if (originalPayment.status === PaymentStatus.VOIDED) {
            throw new Error('Payment already voided');
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
}
