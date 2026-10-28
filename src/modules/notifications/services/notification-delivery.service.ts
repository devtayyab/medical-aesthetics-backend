import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { FirebaseService } from './firebase.service';
import { MailService } from './mail.service';
import { NotificationType } from '../../../common/enums/notification-type.enum';
import { isPlaceholderEmail } from '../utils/notification-format.util';

/**
 * Delivers one stored notification to its channel (FCM push or email). Used by the Bull
 * processor and, when the queue is unavailable, directly by NotificationsService so a
 * Redis outage does not silently drop appointment emails.
 */
@Injectable()
export class NotificationDeliveryService {
  private readonly logger = new Logger(NotificationDeliveryService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private firebaseService: FirebaseService,
    private mailService: MailService,
  ) {}

  async deliver(notificationId: string): Promise<void> {
    try {
      const notification = await this.notificationsRepository.findOne({
        where: { id: notificationId },
        relations: ['recipient'],
      });

      if (!notification) {
        this.logger.error(`Notification ${notificationId} not found`);
        return;
      }

      if (notification.isSent) {
        // Job retried after a successful send: never deliver twice
        return;
      }

      let externalId: string;

      switch (notification.type) {
        case NotificationType.PUSH: {
          const fcmToken = notification.recipient?.profile?.fcmToken;
          if (!fcmToken) {
            // In-app (bell) only; nothing to deliver to a device.
            return;
          }
          externalId = await this.firebaseService.sendPushNotification(
            fcmToken,
            notification.title,
            notification.message,
            { ...(notification.data || {}), notificationId: notification.id },
          );
          break;
        }

        case NotificationType.EMAIL: {
          const to = notification.recipient?.email;
          if (isPlaceholderEmail(to)) {
            // Guest / lead placeholder address: skip instead of retrying forever.
            await this.notificationsRepository.update(notification.id, {
              metadata: { ...(notification.metadata || {}), skipped: 'no_real_email' },
            });
            this.logger.warn(`Email notification ${notificationId} skipped: recipient has no real email`);
            return;
          }
          const mailInfo = await this.mailService.sendMail(to, notification.title, notification.message);
          // sendMail returns null on failure/misconfig: throw so the job retries and the
          // notification is NOT falsely marked as sent.
          if (!mailInfo?.messageId) {
            throw new Error(`Email send failed for notification ${notificationId}`);
          }
          externalId = mailInfo.messageId;
          break;
        }

        default:
          this.logger.warn(`Unknown notification type: ${notification.type}`);
          return;
      }

      await this.notificationsRepository.update(notification.id, {
        isSent: true,
        sentAt: new Date(),
        externalId,
      });

      this.logger.log(`Notification ${notificationId} sent successfully`);
    } catch (error) {
      this.logger.error(`Failed to send notification ${notificationId}: ${error.message}`);
      throw error; // Lets the queue retry
    }
  }
}
