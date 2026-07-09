import { Injectable } from '@nestjs/common';
import { FinancialService } from '../payments/financial.service';
import { PaymentMethod, PaymentType, PaymentStatus } from '../payments/entities/payment-record.entity';
import { ManualPaymentDto } from './dto/manual-payment.dto';

@Injectable()
export class PaymentsService {
    constructor(
        private readonly financialService: FinancialService
    ) { }

    async getLedger(query: {
        clinicId?: string;
        providerId?: string;
        salespersonId?: string;
        date?: string;
        method?: string;
        limit?: number;
        offset?: number;
    }) {
        return this.financialService.getLedger({
            clinicId: query.clinicId,
            providerId: query.providerId,
            salespersonId: query.salespersonId,
            startDate: query.date,
            endDate: query.date,
            method: query.method as any,
            limit: query.limit,
            offset: query.offset
        });
    }

    async refund(id: string, notes: string, recordedById: string) {
        return this.financialService.refundPayment(id, notes, recordedById);
    }

    async void(id: string, notes: string, recordedById: string) {
        return this.financialService.voidPayment(id, notes, recordedById);
    }

    async createManualPayment(data: ManualPaymentDto & { recordedById: string }) {
        // Only whitelisted fields are forwarded; type/status are forced server-side so a
        // manager cannot fabricate refunds or completed turnover they didn't collect.
        return this.financialService.recordPayment({
            amount: data.amount,
            method: data.method,
            clinicId: data.clinicId,
            clientId: data.clientId,
            appointmentId: data.appointmentId,
            notes: data.notes,
            type: PaymentType.PAYMENT,
            status: PaymentStatus.COMPLETED,
            recordedById: data.recordedById,
        });
    }
}
