import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VivaWalletService } from './viva-wallet.service';
import { VivaWalletController } from './viva-wallet.controller';
import { Appointment } from '../bookings/entities/appointment.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Appointment])],
    controllers: [VivaWalletController],
    providers: [VivaWalletService],
    exports: [VivaWalletService],
})
export class PaymentsModule { }
