import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VivaWalletService } from './viva-wallet.service';
import { FinancialService } from './financial.service';
import { VivaWalletController } from './viva-wallet.controller';
import { PaymentsController } from './payments.controller';
import { Appointment } from '../bookings/entities/appointment.entity';
import { PaymentRecord } from './entities/payment-record.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Appointment, PaymentRecord]),
        NotificationsModule
    ],
    controllers: [VivaWalletController, PaymentsController],
    providers: [VivaWalletService, FinancialService],
    exports: [VivaWalletService, FinancialService, TypeOrmModule],
})
export class PaymentsModule { }
