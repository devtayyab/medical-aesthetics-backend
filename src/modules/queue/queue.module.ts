import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { QueueService } from './queue.service';
import { ScheduledTasksService } from './scheduled-tasks.service';
import { ReminderProcessor } from './processors/reminder.processor';
import { FollowUpProcessor } from './processors/followup.processor';
import { RecurringAppointmentProcessor } from './processors/recurring-appointment.processor';
import { BookingsModule } from '../bookings/bookings.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'reminders' },
      { name: 'followups' },
      { name: 'recurring' },
    ),
    ScheduleModule,
    forwardRef(() => BookingsModule),
    LoyaltyModule,
    TasksModule,
  ],
  providers: [
    QueueService,
    ScheduledTasksService,
    ReminderProcessor,
    FollowUpProcessor,
    RecurringAppointmentProcessor,
  ],
  exports: [QueueService],
})
export class QueueModule { }