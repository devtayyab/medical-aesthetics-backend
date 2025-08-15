import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingsService } from '../bookings/bookings.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(
    private bookingsService: BookingsService,
    private loyaltyService: LoyaltyService,
    private tasksService: TasksService,
  ) {}

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

  @Cron(CronExpression.EVERY_6_HOURS)
  async checkOverdueTasks() {
    try {
      const overdueTasks = await this.tasksService.findOverdueTasks();
      this.logger.log(`Found ${overdueTasks.length} overdue tasks`);
      
      // Could send notifications to assignees about overdue tasks
      for (const task of overdueTasks) {
        // Notification logic here
        this.logger.log(`Task ${task.id} is overdue`);
      }
    } catch (error) {
      this.logger.error('Failed to check overdue tasks:', error);
    }
  }
}