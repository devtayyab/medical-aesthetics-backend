import { Injectable } from '@nestjs/common';
import { FinancialService } from '../payments/financial.service';
import { PaymentMethod } from '../payments/entities/payment-record.entity';

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
}
