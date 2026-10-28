import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingsService } from '../bookings/bookings.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { TasksService } from '../tasks/tasks.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationTrigger } from '../../common/enums/notification-trigger.enum';
import { athensDateTime } from '../notifications/utils/notification-format.util';

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(
    private bookingsService: BookingsService,
    private loyaltyService: LoyaltyService,
    private tasksService: TasksService,
    private notificationsService: NotificationsService,
  ) { }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredHolds() {
    try {
      await this.bookingsService.cleanupExpiredHolds();
      this.logger.log('Cleaned up expired appointment holds');
    } catch (error) {
      this.logger.error('Failed to cleanup expired holds:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireLoyaltyPoints() {
    try {
      await this.loyaltyService.expireOldPoints();
      this.logger.log('Processed loyalty point expirations');
    } catch (error) {
      this.logger.error('Failed to expire loyalty points:', error);
    }
  }

  // Appointment reminders (24h and 2h before, Athens time, each sent once) live in
  // AppointmentNotificationsListener. The old daily/hourly UTC crons here sent the same
  // reminder 3-4 times.

  @Cron(CronExpression.EVERY_6_HOURS)
  async checkOverdueTasks() {
    try {
      const overdueTasks = await this.tasksService.findOverdueTasks();
      this.logger.log(`Found ${overdueTasks.length} overdue tasks`);

      for (const task of overdueTasks) {
        if (task.assigneeId) {
          await this.notificationsService.sendTriggeredNotification(NotificationTrigger.TASK_REMINDER, task.assigneeId, {
            taskTitle: task.description,
            dueDate: athensDateTime(task.dueDate),
          });
        }
        this.logger.log(`Task ${task.id} is overdue, notification sent.`);
      }
    } catch (error) {
      this.logger.error('Failed to check overdue tasks:', error);
    }
  }

  // Post-visit message: replaced by the review request sent once on completion.
}
