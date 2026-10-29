import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventHandlersService } from './event-handlers.service';
import { AppointmentNotificationsListener } from './appointment-notifications.listener';
import { NotificationsModule } from '../notifications/notifications.module';
import { TasksModule } from '../tasks/tasks.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { QueueModule } from '../queue/queue.module';
import { Appointment } from '../bookings/entities/appointment.entity';
import { Service } from '../clinics/entities/service.entity';
import { User } from '../users/entities/user.entity';
import { PaymentRecord } from '../payments/entities/payment-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Service, User, PaymentRecord]),
    NotificationsModule,
    TasksModule,
    LoyaltyModule,
    QueueModule,
  ],
  providers: [EventHandlersService, AppointmentNotificationsListener],
  exports: [EventHandlersService],
})
export class EventsModule {}
