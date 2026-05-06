import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { FirebaseService } from '../services/firebase.service';
import { MailService } from '../services/mail.service';
import { NotificationType } from '../../../common/enums/notification-type.enum';

@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private firebaseService: FirebaseService,
    private mailService: MailService,
  ) {}

  @Process('send-notification')
  async handleSendNotification(job: Job) {
    const { notificationId } = job.data;
    
    try {
      const notification = await this.notificationsRepository.findOne({
        where: { id: notificationId },
        relations: ['recipient'],
      });

      if (!notification) {
        this.logger.error(`Notification ${notificationId} not found`);
        return;
      }

      let externalId: string;

      switch (notification.type) {
        case NotificationType.PUSH:
          // Assume recipient has FCM token in profile
          const fcmToken = notification.recipient.profile?.fcmToken;
          if (fcmToken) {
            externalId = await this.firebaseService.sendPushNotification(
              fcmToken,
              notification.title,
              notification.message,
              notification.data,
            );
          }
          break;

        case NotificationType.EMAIL:
          const mailInfo = await this.mailService.sendMail(
            notification.recipient.email,
            notification.title,
            notification.message
          );
          externalId = mailInfo?.messageId || `email_failed_${Date.now()}`;
          break;

        default:
          this.logger.warn(`Unknown notification type: ${notification.type}`);
          return;
      }

      // Update notification status
      await this.notificationsRepository.update(notification.id, {
        isSent: true,
        sentAt: new Date(),
        externalId,
      });

      this.logger.log(`Notification ${notificationId} sent successfully`);
    } catch (error) {
      this.logger.error(`Failed to send notification ${notificationId}: ${error.message}`);
      throw error; // Will cause the job to retry
    }
  }
}