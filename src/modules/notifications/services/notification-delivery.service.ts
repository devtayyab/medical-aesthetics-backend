import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { FirebaseService } from './firebase.service';
import { MailService } from './mail.service';
import { EmailSuppressionService } from './email-suppression.service';
import { NotificationType } from '../../../common/enums/notification-type.enum';
import { NotificationTrigger } from '../../../common/enums/notification-trigger.enum';
import { isPlaceholderEmail } from '../utils/notification-format.util';
import { AccountLinksService } from '../../users/account-links.service';

/**
 * Emails that carry the account invitation: confirmation, day-before and same-day reminder,
 * and the review request (a customer without a password cannot log in to leave the review).
 */
const INVITATION_TRIGGERS = new Set<string>([
  NotificationTrigger.APPOINTMENT_CONFIRMED,
  NotificationTrigger.APPOINTMENT_REMINDER,
  NotificationTrigger.APPOINTMENT_REMINDER_SAME_DAY,
  NotificationTrigger.REVIEW_REQUEST,
]);

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
    private emailSuppressionService: EmailSuppressionService,
    @Inject(forwardRef(() => AccountLinksService))
    private accountLinks: AccountLinksService,
  ) {}

  /**
   * Appointment emails to a customer who has not set a password yet end with the account
   * invitation and a personal button. Built at send time (fresh link, current account state)
   * and never stored with the notification. Off unless switched on by an admin.
   */
  private async withAccountInvitation(notification: Notification): Promise<{ text: string; html?: string }> {
    const text = notification.message;
    try {
      const data: any = notification.data || {};
      if (!INVITATION_TRIGGERS.has(String(data.trigger || ''))) return { text };
      const invitation = await this.accountLinks.buildAppointmentEmailInvitation(notification.recipient, {
        appointmentDate: data.appointmentDate,
        clinicName: data.clinicName,
        clinicPhone: data.clinicPhone,
      });
      if (!invitation) return { text };
      const full = `${text}\n\n────────────────\n\n${invitation.text}`;
      return {
        text: full,
        html: this.mailService.renderLinkEmail(notification.title, full, { url: invitation.url, label: 'Ορισμός κωδικού' }),
      };
    } catch (err: any) {
      // The appointment email itself must still go out.
      this.logger.warn(`Could not add the account invitation to notification ${notification.id}: ${err?.message || err}`);
      return { text };
    }
  }

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
          if (notification.recipient?.emailBounced) {
            await this.notificationsRepository.update(notification.id, {
              metadata: { ...(notification.metadata || {}), skipped: 'email_bounced' },
            });
            this.logger.warn(`Email notification ${notificationId} skipped: recipient email previously bounced`);
            return;
          }
          const suppression = await this.emailSuppressionService.isEmailSuppressed(to);
          if (suppression.suppressed) {
            await this.notificationsRepository.update(notification.id, {
              metadata: { ...(notification.metadata || {}), skipped: 'email_suppressed', reason: suppression.reason },
            });
            this.logger.warn(`Email notification ${notificationId} skipped: suppressed (${suppression.reason})`);
            return;
          }
          const email = await this.withAccountInvitation(notification);
          const mailInfo = await this.mailService.sendMail(to, notification.title, email.text, email.html);
          // Re-check suppression in case sendMail just caught a synchronous hard bounce
          if (!mailInfo?.messageId) {
            const afterCheck = await this.emailSuppressionService.isEmailSuppressed(to);
            if (afterCheck.suppressed) {
              await this.notificationsRepository.update(notification.id, {
                metadata: { ...(notification.metadata || {}), skipped: 'email_bounced_on_send', reason: afterCheck.reason },
              });
              return;
            }
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
