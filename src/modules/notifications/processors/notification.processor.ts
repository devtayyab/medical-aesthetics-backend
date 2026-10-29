import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { NotificationDeliveryService } from '../services/notification-delivery.service';

@Processor('notifications')
export class NotificationProcessor {
  constructor(private deliveryService: NotificationDeliveryService) {}

  @Process('send-notification')
  async handleSendNotification(job: Job) {
    await this.deliveryService.deliver(job.data.notificationId);
  }
}
