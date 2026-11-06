import { BadRequestException, Injectable } from '@nestjs/common';
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
        startDate?: string;
        endDate?: string;
        method?: string;
        limit?: number;
        offset?: number;
    }) {
        return this.financialService.getLedger({
            clinicId: query.clinicId,
            providerId: query.providerId,
            salespersonId: query.salespersonId,
            // A single day (date) or a period (startDate/endDate).
            startDate: query.date || query.startDate,
            endDate: query.date || query.endDate,
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

    searchClients(search?: string, limit?: number) {
        return this.financialService.searchClientsForPayment(search, limit);
    }

    getClientAppointments(clientId: string) {
        return this.financialService.getClientAppointmentsForPayment(clientId);
    }

    async createManualPayment(data: ManualPaymentDto & { recordedById: string }) {
        // A payment linked to an appointment inherits its client, clinic and doctor, and the
        // appointment must belong to the selected client.
        let clientId = data.clientId;
        let clinicId = data.clinicId;
        let providerId = data.providerId;
        if (data.appointmentId) {
            const apt = await this.financialService.getAppointmentPaymentContext(data.appointmentId);
            if (clientId && apt.clientId && clientId !== apt.clientId) {
                throw new BadRequestException('The selected appointment does not belong to this client.');
            }
            clientId = clientId || apt.clientId;
            clinicId = clinicId || apt.clinicId;
            providerId = providerId || apt.providerId;
        }
        if (!clientId) throw new BadRequestException('A client is required.');

        // Only whitelisted fields are forwarded; type/status are forced server-side so a
        // manager cannot fabricate refunds or completed turnover they didn't collect.
        return this.financialService.recordPayment({
            amount: data.amount,
            method: data.method,
            clinicId,
            clientId,
            providerId,
            appointmentId: data.appointmentId,
            salespersonId: data.salespersonId,
            notes: data.notes,
            type: PaymentType.PAYMENT,
            status: PaymentStatus.COMPLETED,
            recordedById: data.recordedById,
        });
    }
}
