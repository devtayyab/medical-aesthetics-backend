import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingsService } from '../bookings/bookings.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { TasksService } from '../tasks/tasks.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SmsService } from '../notifications/services/sms.service';

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(
    private bookingsService: BookingsService,
    private loyaltyService: LoyaltyService,
    private tasksService: TasksService,
    private notificationsService: NotificationsService,
    private smsService: SmsService,
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

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendAppointmentRemindersDaily() {
    try {
      this.logger.log('Running daily appointment reminders (1 day before)...');

      const tomorrowStart = new Date();
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      tomorrowStart.setHours(0, 0, 0, 0);

      const tomorrowEnd = new Date();
      tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
      tomorrowEnd.setHours(23, 59, 59, 999);

      // I'll need a method in BookingsService or use repository directly
      // For now, let's assume we use repository logic here
      const appointments = await this.bookingsService.findAppointmentsInRange(tomorrowStart, tomorrowEnd);

      this.logger.log(`Found ${appointments.length} appointments for tomorrow.`);

      for (const apt of appointments) {
        if (apt.clientId && apt.client) {
          // Send 1 day before reminder
          const timeStr = apt.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          await this.notificationsService.sendAppointmentReminder(apt.clientId, {
            id: apt.id,
            time: timeStr
          });

          if (apt.client.phone) {
            await this.smsService.sendSms(
              apt.client.phone,
              `Reminder: You have an appointment tomorrow at ${timeStr} with ${apt.provider?.firstName || 'our professional'}.`
            );
          }
          this.logger.log(`Sent 1-day reminder for appointment ${apt.id}`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to send daily appointment reminders:', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async sendAppointmentRemindersHourly() {
    try {
      this.logger.log('Running hourly appointment reminders (same day)...');

      const now = new Date();
      const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);

      // Find appointments in next 4 hours that haven't been reminded today
      const appointments = await this.bookingsService.findAppointmentsInRange(now, fourHoursLater);

      for (const apt of appointments) {
        if (apt.clientId && apt.client) {
          const timeStr = apt.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          // Simple notification logic
          await this.notificationsService.create(
            apt.clientId,
            'appointment' as any,
            'Appointment Today!',
            `Your appointment is in a few hours at ${timeStr}.`
          );

          if (apt.client.phone) {
            await this.smsService.sendSms(
              apt.client.phone,
              `Reminder: Your appointment is today at ${timeStr}. We look forward to seeing you!`
            );
          }
          this.logger.log(`Sent same-day reminder for appointment ${apt.id}`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to send hourly appointment reminders:', error);
    }
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async checkOverdueTasks() {
    try {
      const overdueTasks = await this.tasksService.findOverdueTasks();
      this.logger.log(`Found ${overdueTasks.length} overdue tasks`);

      for (const task of overdueTasks) {
        this.logger.log(`Task ${task.id} is overdue`);
      }
    } catch (error) {
      this.logger.error('Failed to check overdue tasks:', error);
    }
  }
}