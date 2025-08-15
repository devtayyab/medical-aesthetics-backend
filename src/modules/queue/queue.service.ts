import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('reminders') private remindersQueue: Queue,
    @InjectQueue('followups') private followUpsQueue: Queue,
    @InjectQueue('recurring') private recurringQueue: Queue,
  ) {}

  // Appointment reminders
  async scheduleAppointmentReminder(
    appointmentId: string,
    reminderTime: Date,
  ): Promise<void> {
    await this.remindersQueue.add(
      'appointment-reminder',
      { appointmentId },
      {
        delay: reminderTime.getTime() - Date.now(),
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 }, 
      },
    );
    
    this.logger.log(`Scheduled appointment reminder for ${appointmentId}`);
  }

  // Lead follow-ups
  async scheduleLeadFollowUp(
    leadId: string,
    followUpTime: Date,
    taskType: string = 'phone_call',
  ): Promise<void> {
    await this.followUpsQueue.add(
      'lead-followup',
      { leadId, taskType },
      {
        delay: followUpTime.getTime() - Date.now(),
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 }, 
      },
    );
    
    this.logger.log(`Scheduled lead follow-up for ${leadId}`);
  }

  // Recurring appointments
  async scheduleRecurringAppointments(
    templateId: string,
    frequency: string, // 'weekly', 'monthly', 'quarterly'
    clientId: string,
  ): Promise<void> {
    let cronExpression: string;
    
    switch (frequency) {
      case 'weekly':
        cronExpression = '0 9 * * 1'; // Every Monday at 9 AM
        break;
      case 'monthly':
        cronExpression = '0 9 1 * *'; // First day of month at 9 AM
        break;
      case 'quarterly':
        cronExpression = '0 9 1 */3 *'; // First day of quarter at 9 AM
        break;
      default:
        throw new Error(`Unsupported frequency: ${frequency}`);
    }

    await this.recurringQueue.add(
      'create-recurring-appointment',
      { templateId, clientId },
      {
        repeat: { cron: cronExpression },
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 }, 
      },
    );
    
    this.logger.log(`Scheduled recurring appointments for client ${clientId}`);
  }

  // Loyalty point expiration
  async scheduleLoyaltyExpiration(
    ledgerId: string,
    expirationDate: Date,
  ): Promise<void> {
    await this.remindersQueue.add(
      'loyalty-expiration',
      { ledgerId },
      {
        delay: expirationDate.getTime() - Date.now(),
        attempts: 1, // Only try once for expiration
      },
    );
  }
}