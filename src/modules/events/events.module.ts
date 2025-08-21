import { Module } from '@nestjs/common';
import { EventHandlersService } from './event-handlers.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { TasksModule } from '../tasks/tasks.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    NotificationsModule,
    TasksModule,
    LoyaltyModule,
    QueueModule,
  ],
  providers: [EventHandlersService],
  exports: [EventHandlersService],
})
export class EventsModule {}