import { Injectable, forwardRef, Inject, OnModuleInit, OnApplicationBootstrap, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { In, Repository } from 'typeorm';
import { Queue } from 'bull';
import { Notification } from './entities/notification.entity';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { UsersService } from '../users/users.service';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { NotificationTrigger } from '../../common/enums/notification-trigger.enum';
import { NotificationTemplate } from './entities/notification-template.entity';
import { Clinic } from '../clinics/entities/clinic.entity';
import { User } from '../users/entities/user.entity';
import { MailService } from './services/mail.service';
import { NotificationDeliveryService } from './services/notification-delivery.service';
import { EmailSuppressionService } from './services/email-suppression.service';
import { NotificationDispatch } from './entities/notification-dispatch.entity';
import { ContactMessage } from './entities/contact-message.entity';
import { athensDate, athensTime, isPlaceholderEmail } from './utils/notification-format.util';
import { DEFAULT_TEMPLATES, LEGACY_DEFAULT_SUBJECTS, LEGACY_DEFAULT_CONTENTS, LEGACY_REMINDER_TEXT } from './notification-templates.defaults';

const ADMIN_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
const SALES_ROLES = [UserRole.SALESPERSON, UserRole.MANAGER];
const CLINIC_ROLES = [UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT];

@Injectable()
export class NotificationsService implements OnModuleInit, OnApplicationBootstrap {
  private readonly logger = new Logger(NotificationsService.name);
  private notificationsGateway: NotificationsGateway;

  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(NotificationTemplate)
    private templateRepository: Repository<NotificationTemplate>,
    @InjectRepository(Clinic)
    private clinicRepository: Repository<Clinic>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(NotificationDispatch)
    private dispatchRepository: Repository<NotificationDispatch>,
    @InjectRepository(ContactMessage)
    private contactRepository: Repository<ContactMessage>,
    @InjectQueue('notifications')
    private notificationsQueue: Queue,
    private usersService: UsersService,
    private mailService: MailService,
    private deliveryService: NotificationDeliveryService,
    private emailSuppressionService: EmailSuppressionService,
    @Inject(forwardRef(() => NotificationsGateway))
    private _gateway: NotificationsGateway,
  ) { }

  onModuleInit() {
    this.notificationsGateway = this._gateway;
  }

  async onApplicationBootstrap() {
    // Appointment emails depend on these templates; without them nothing is ever sent.
    try {
      await this.seedDefaultTemplates();
    } catch (err: any) {
      this.logger.warn(`Could not seed default notification templates: ${err?.message || err}`);
    }
  }

  private toSocketPayload(n: Notification) {
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data,
      isRead: n.isRead,
      createdAt: n.createdAt,
    };
  }

  /** Queue delivery; if the queue (Redis) is down, deliver right away instead of dropping it. */
  private async enqueueDelivery(notificationIds: string[]): Promise<void> {
    if (notificationIds.length === 0) return;
    try {
      await this.notificationsQueue.addBulk(
        notificationIds.map((notificationId) => ({
          name: 'send-notification',
          data: { notificationId },
          opts: { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: true },
        })),
      );
    } catch (qErr: any) {
      this.logger.warn(`Queue unavailable, delivering ${notificationIds.length} notification(s) directly: ${qErr?.message || qErr}`);
      for (const id of notificationIds) {
        this.deliveryService.deliver(id).catch((err) =>
          this.logger.error(`Direct delivery failed for ${id}: ${err?.message || err}`),
        );
      }
    }
  }

  async create(
    recipientId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
  ): Promise<Notification | null> {
    // Never store or queue EMAIL notifications for noemail/placeholder or bounced addresses.
    if (type === NotificationType.EMAIL) {
      const recipient = await this.userRepository.findOne({
        where: { id: recipientId },
        select: ['id', 'email', 'emailBounced'],
      });
      if (!recipient?.email || recipient.emailBounced) {
        this.logger.debug(`Skipping EMAIL notification for user ${recipientId}: missing or bounced email`);
        return null;
      }
      const suppression = await this.emailSuppressionService.isEmailSuppressed(recipient.email);
      if (suppression.suppressed) {
        this.logger.debug(`Skipping EMAIL notification for user ${recipientId}: ${suppression.reason}`);
        return null;
      }
    }

    const notification = this.notificationsRepository.create({
      recipientId,
      type,
      title,
      message,
      data,
    });

    const savedNotification = await this.notificationsRepository.save(notification);

    // Only in-app (push) notifications go to the bell in real time; emails are not bell items.
    if (this.notificationsGateway && type === NotificationType.PUSH) {
      try {
        await this.notificationsGateway.sendToUser(recipientId, this.toSocketPayload(savedNotification));
      } catch {
        // Non-blocking
      }
    }

    await this.enqueueDelivery([savedNotification.id]);
    return savedNotification;
  }

  async sendBulk(
    recipientIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
  ): Promise<void> {
    let uniqueIds = [...new Set((recipientIds || []).filter(Boolean))];
    if (uniqueIds.length === 0) return;

    if (type === NotificationType.EMAIL) {
      const users = await this.userRepository.find({
        where: { id: In(uniqueIds) },
        select: ['id', 'email', 'emailBounced'],
      });
      const suppressedEmails = await this.emailSuppressionService.filterSuppressedEmails(
        users.map((u) => u.email),
      );
      const allowedIds = new Set(
        users
          .filter(
            (u) =>
              u.email &&
              !u.emailBounced &&
              !isPlaceholderEmail(u.email) &&
              !suppressedEmails.has(u.email.trim().toLowerCase()),
          )
          .map((u) => u.id),
      );
      uniqueIds = uniqueIds.filter((id) => allowedIds.has(id));
      if (uniqueIds.length === 0) return;
    }

    const notifications = uniqueIds.map(recipientId => ({
      recipientId,
      type,
      title,
      message,
      data,
    }));

    const savedNotifications = await this.notificationsRepository.save(notifications);

    if (this.notificationsGateway && type === NotificationType.PUSH) {
      for (const notif of savedNotifications) {
        try {
          this.notificationsGateway.sendToUser(notif.recipientId, this.toSocketPayload(notif as Notification));
        } catch {
          // Non-blocking error
        }
      }
    }

    await this.enqueueDelivery(savedNotifications.map((n) => n.id));
  }

  /** Bell feed: in-app notifications of this user only (never other users' copies). */
  async findByRecipient(recipientId: string, limit: number = 50): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { recipientId, type: NotificationType.PUSH },
      order: { createdAt: 'DESC' },
      take: Math.min(Number(limit) || 50, 200),
    });
  }

  async markAsRead(id: string, recipientId?: string): Promise<void> {
    // Scope to the recipient so a user cannot mark someone else's notifications read (IDOR).
    const criteria: any = recipientId ? { id, recipientId } : { id };
    await this.notificationsRepository.update(criteria, {
      isRead: true,
      readAt: new Date(),
    });
  }

  async markAllAsRead(recipientId: string): Promise<void> {
    await this.notificationsRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true, readAt: new Date() })
      .where('"recipientId" = :recipientId AND "isRead" = false', { recipientId })
      .execute();
  }

  async markAsSent(id: string, externalId?: string): Promise<void> {
    await this.notificationsRepository.update(id, {
      isSent: true,
      sentAt: new Date(),
      externalId,
    });
  }

  async getUnreadCount(recipientId: string): Promise<number> {
    return this.notificationsRepository.count({
      where: { recipientId, isRead: false, type: NotificationType.PUSH },
    });
  }

  // ---------------------------------------------------------------------------
  // Recipient groups
  // ---------------------------------------------------------------------------

  private async activeUserIdsByRoles(roles: UserRole[]): Promise<string[]> {
    const users = await this.userRepository.find({
      select: ['id'],
      where: { role: In(roles as any[]), isActive: true },
    });
    return users.map((u) => u.id);
  }

  async getAdminIds(): Promise<string[]> {
    return this.activeUserIdsByRoles(ADMIN_ROLES);
  }

  async getSalesIds(): Promise<string[]> {
    return this.activeUserIdsByRoles(SALES_ROLES);
  }

  /** Owner + doctors/secretariat of one clinic. Never admins or salespeople. */
  async getClinicStaffIds(clinicId: string): Promise<string[]> {
    if (!clinicId) return [];
    const clinic = await this.clinicRepository.findOne({ where: { id: clinicId } });
    const staff = await this.userRepository.find({
      select: ['id'],
      where: { assignedClinicId: clinicId, isActive: true, role: In(CLINIC_ROLES as any[]) },
    });
    let ownerIds: string[] = [];
    try {
      const rows = await this.userRepository.manager.query(
        'SELECT "ownerUserId" FROM clinic_ownership WHERE "clinicId" = $1',
        [clinicId],
      );
      ownerIds = (rows || []).map((r: any) => r.ownerUserId).filter(Boolean);
    } catch {
      // Table may not exist in older databases
    }
    return [...new Set([...(clinic?.ownerId ? [clinic.ownerId] : []), ...ownerIds, ...staff.map((u) => u.id)])];
  }

  /** Send one in-app notification to each user once (deduplicated), skipping excluded ids. */
  async notifyUsers(
    recipientIds: string[],
    title: string,
    message: string,
    data?: any,
    excludeIds: string[] = [],
  ): Promise<{ sentTo: number }> {
    const exclude = new Set(excludeIds.filter(Boolean));
    const ids = [...new Set(recipientIds.filter((id) => id && !exclude.has(id)))];
    if (ids.length === 0) return { sentTo: 0 };
    await this.sendBulk(ids, NotificationType.PUSH, title, message, data);
    return { sentTo: ids.length };
  }

  async notifyAdmins(title: string, message: string, data?: any, excludeIds: string[] = []): Promise<{ sentTo: number }> {
    return this.notifyUsers(await this.getAdminIds(), title, message, data, excludeIds);
  }

  /** Admins and salespeople, once each. */
  async notifyAllStaff(
    title: string,
    message: string,
    data?: any,
    excludeIds: string[] = [],
  ): Promise<{ sentTo: number }> {
    const [admins, sales] = await Promise.all([this.getAdminIds(), this.getSalesIds()]);
    return this.notifyUsers([...admins, ...sales], title, message, data, excludeIds);
  }

  /** Staff of one clinic (owner, doctors, secretariat). Admins are no longer copied. */
  async notifyClinicStaff(
    clinicId: string,
    title: string,
    message: string,
    data?: any,
    additionalRecipientIds: string[] = [],
    excludeIds: string[] = [],
  ): Promise<{ sentTo: number }> {
    const staff = await this.getClinicStaffIds(clinicId);
    return this.notifyUsers([...staff, ...additionalRecipientIds], title, message, data, excludeIds);
  }

  /** Message written by a clinic to the platform team (admins). */
  async sendToPlatformAdmins(
    title: string,
    message: string,
    data?: any,
  ): Promise<{ message: string; sentTo: number }> {
    const adminIds = await this.getAdminIds();
    if (adminIds.length > 0) {
      await this.sendBulk(
        adminIds,
        NotificationType.PUSH,
        `[Μήνυμα κλινικής] ${title}`,
        message,
        { ...data, source: 'clinic_to_platform' },
      );
    }
    return {
      message: 'Message sent to platform admins',
      sentTo: adminIds.length,
    };
  }

  /**
   * Email to the platform inbox (info@beautydoctors.gr) for a booking made by a client.
   * Sent directly, not through an editable template, so it cannot be switched off in
   * Notification Settings. Override the address with ADMIN_BOOKING_EMAIL.
   */
  async sendAdminNewBookingEmail(details: {
    appointmentId: string;
    clientName: string;
    clientPhone: string;
    treatment: string;
    clinicName: string;
    date: string;
    time: string;
    pending: boolean;
  }): Promise<boolean> {
    const to = (process.env.ADMIN_BOOKING_EMAIL || 'info@beautydoctors.gr').trim();
    const base = (process.env.APP_FRONTEND_URL || process.env.FRONTEND_URL || 'https://beautydoctors.gr').replace(/\/$/, '');
    const url = `${base}/crm/calendar?appointmentId=${details.appointmentId}`;
    const subject = `Νέο ραντεβού από πελάτη: ${details.clientName} · ${details.date} ${details.time}`;
    const text = [
      'Ένας πελάτης έκλεισε νέο ραντεβού μέσω της εφαρμογής / ιστοσελίδας:',
      '',
      `Πελάτης: ${details.clientName}`,
      `Τηλέφωνο: ${details.clientPhone || '-'}`,
      `Θεραπεία: ${details.treatment}`,
      `Κλινική: ${details.clinicName}`,
      `Ημερομηνία: ${details.date}`,
      `Ώρα: ${details.time}`,
      '',
      details.pending ? 'Το ραντεβού αναμένει επιβεβαίωση.' : 'Το ραντεβού είναι επιβεβαιωμένο.',
    ].join('\n');
    const html = this.mailService.renderLayout(
      'Νέο ραντεβού από πελάτη',
      this.mailService.textToHtml(text),
      { url, label: details.pending ? 'Άνοιγμα & επιβεβαίωση ραντεβού' : 'Άνοιγμα ραντεβού' },
    );
    const info = await this.mailService.sendMail(to, subject, `${text}\n\n${url}`, html);
    if (!info?.messageId) {
      this.logger.error(`New booking email to ${to} was NOT sent (appointment ${details.appointmentId})`);
      return false;
    }
    return true;
  }

  // ---------------------------------------------------------------------------
  // One-off dispatch flags (reminders, review requests)
  // ---------------------------------------------------------------------------

  /**
   * Atomically claims a one-off dispatch. Returns true only for the first caller, so a
   * reminder is sent exactly once even with several cron runs or app instances.
   */
  async claimDispatch(dispatchKey: string, kind: string, appointmentId?: string): Promise<boolean> {
    const result = await this.dispatchRepository
      .createQueryBuilder()
      .insert()
      .into(NotificationDispatch)
      .values({ dispatchKey, kind, appointmentId: appointmentId || null })
      .orIgnore()
      .returning(['id'])
      .execute();
    // Postgres returns the inserted row only when there was no conflict.
    return Array.isArray(result.raw) && result.raw.length > 0;
  }

  /** Undo a claim when the send itself failed, so the next cron run retries. */
  async releaseDispatch(dispatchKey: string): Promise<void> {
    await this.dispatchRepository.delete({ dispatchKey });
  }

  // ---------------------------------------------------------------------------
  // Convenience senders
  // ---------------------------------------------------------------------------

  /** Manual reminder sent by a clinic from the appointment card. */
  async sendAppointmentReminder(
    recipientId: string,
    appointmentDetails: { id: string; time: Date | string; serviceName?: string },
  ): Promise<Notification> {
    const when = `${athensDate(appointmentDetails.time)}, ώρα ${athensTime(appointmentDetails.time)}`;
    return this.create(
      recipientId,
      NotificationType.PUSH,
      'Υπενθύμιση ραντεβού',
      `Υπενθύμιση: έχετε ραντεβού${appointmentDetails.serviceName ? ` για ${appointmentDetails.serviceName}` : ''} την ${when}.`,
      { appointmentId: appointmentDetails.id, type: 'appointment_reminder' },
    );
  }

  async sendLoyaltyUpdate(
    recipientId: string,
    loyaltyDetails: any,
  ): Promise<Notification> {
    return this.create(
      recipientId,
      NotificationType.PUSH,
      'Πόντοι επιβράβευσης',
      `Κερδίσατε ${loyaltyDetails.points} πόντους. Νέο υπόλοιπο: ${loyaltyDetails.balance}.`,
      loyaltyDetails,
    );
  }

  async sendWelcomeCredentials(
    recipientId: string,
    email: string,
    password: string,
    userName?: string,
  ): Promise<Notification> {
    // The email is sent directly; the password is never stored in a notification row.
    try {
      await this.mailService.sendWelcomeCredentialsEmail(email, password, userName);
    } catch (err: any) {
      this.logger.error(`Welcome email failed for ${recipientId}: ${err?.message || err}`);
    }

    return this.create(
      recipientId,
      NotificationType.PUSH,
      'Καλώς ήρθατε στο Beauty Doctors',
      'Ο λογαριασμός σας δημιουργήθηκε. Σας στείλαμε τα στοιχεία σύνδεσης με email.',
      { type: 'welcome' },
    );
  }

  /**
   * Helper for sending BOTH push + email to a single user in one call.
   */
  async sendEmailAndPushToUser(
    recipientId: string,
    title: string,
    message: string,
    emailBody?: string,
    data?: any,
  ): Promise<{ push: Notification | null; email: Notification | null }> {
    const push = await this.create(recipientId, NotificationType.PUSH, title, message, data);
    const email = await this.create(
      recipientId,
      NotificationType.EMAIL,
      title,
      emailBody ?? message,
      { ...data, channel: 'email' },
    );
    return { push, email };
  }

  // ---------------------------------------------------------------------------
  // Broadcast (marketing)
  // ---------------------------------------------------------------------------

  /** Active clients who accepted marketing communication (GDPR). */
  private marketingAudienceQuery() {
    return this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.emailBounced'])
      .where('user.role = :role', { role: UserRole.CLIENT })
      .andWhere('user.isActive = true')
      .andWhere('user.marketingEmailConsent = true');
  }

  async getBroadcastAudienceCount(): Promise<number> {
    return this.marketingAudienceQuery().getCount();
  }

  async broadcastToMarketingClients(
    title: string,
    message: string,
    channels: { push?: boolean; email?: boolean },
    senderId?: string,
  ): Promise<{ recipients: number; push: number; email: number }> {
    if (!title?.trim() || !message?.trim()) {
      throw new BadRequestException('Title and message are required');
    }
    if (!channels?.push && !channels?.email) {
      throw new BadRequestException('Select push, email or both');
    }

    const users = await this.marketingAudienceQuery().getMany();
    const ids = users.map((u) => u.id);
    const data = { type: 'broadcast', category: 'message', senderId };

    let emailRecipientIds: string[] = [];
    if (channels.email) {
      const suppressed = await this.emailSuppressionService.filterSuppressedEmails(users.map((u) => u.email));
      emailRecipientIds = users
        .filter(
          (u) =>
            u.email &&
            !u.emailBounced &&
            !isPlaceholderEmail(u.email) &&
            !suppressed.has(u.email.trim().toLowerCase()),
        )
        .map((u) => u.id);
    }

    // Insert in chunks so a large audience does not create one huge statement.
    const chunkSize = 500;
    if (channels.push) {
      for (let i = 0; i < ids.length; i += chunkSize) {
        await this.sendBulk(ids.slice(i, i + chunkSize), NotificationType.PUSH, title.trim(), message.trim(), data);
      }
    }
    if (channels.email) {
      for (let i = 0; i < emailRecipientIds.length; i += chunkSize) {
        await this.sendBulk(
          emailRecipientIds.slice(i, i + chunkSize),
          NotificationType.EMAIL,
          title.trim(),
          message.trim(),
          data,
        );
      }
    }

    return {
      recipients: ids.length,
      push: channels.push ? ids.length : 0,
      email: channels.email ? emailRecipientIds.length : 0,
    };
  }

  // ---------------------------------------------------------------------------
  // Device tokens (web push)
  // ---------------------------------------------------------------------------

  async registerDeviceToken(userId: string, token: string): Promise<{ success: boolean }> {
    if (!token || typeof token !== 'string' || token.length > 4096) {
      throw new BadRequestException('Invalid device token');
    }
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    await this.userRepository.update(userId, {
      profile: { ...(user.profile || {}), fcmToken: token, fcmTokenUpdatedAt: new Date().toISOString() },
    });
    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // Contact form inbox
  // ---------------------------------------------------------------------------

  async saveContactMessage(data: { name: string; email: string; phone?: string; subject: string; message: string }): Promise<ContactMessage> {
    const saved = await this.contactRepository.save(
      this.contactRepository.create({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
        subject: data.subject.trim(),
        message: data.message.trim(),
      }),
    );

    await this.notifyAdmins(
      'Νέο μήνυμα επικοινωνίας',
      `${saved.name}: ${saved.subject}`,
      { type: 'contact_message', contactMessageId: saved.id, link: '/admin/contact-messages' },
    );

    return saved;
  }

  async listContactMessages(query: { limit?: number; offset?: number; unreadOnly?: boolean | string }) {
    const take = Math.min(Number(query?.limit) || 50, 200);
    const skip = Number(query?.offset) || 0;
    const where: any = {};
    if (query?.unreadOnly === true || query?.unreadOnly === 'true') where.isRead = false;
    const [items, total] = await this.contactRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take,
      skip,
    });
    const unread = await this.contactRepository.count({ where: { isRead: false } });
    return { items, total, unread, limit: take, offset: skip };
  }

  async setContactMessageRead(id: string, isRead: boolean, userId: string): Promise<ContactMessage> {
    const msg = await this.contactRepository.findOne({ where: { id } });
    if (!msg) throw new NotFoundException('Message not found');
    msg.isRead = isRead;
    msg.readAt = isRead ? new Date() : null;
    msg.readById = isRead ? userId : null;
    return this.contactRepository.save(msg);
  }

  // ---------------------------------------------------------------------------
  // Template Management
  // ---------------------------------------------------------------------------

  async getTemplates() {
    return this.templateRepository.find({ order: { trigger: 'ASC', type: 'ASC' } });
  }

  async createTemplate(data: any) {
    const existing = await this.templateRepository.findOne({
      where: { trigger: data.trigger, type: data.type },
    });

    if (existing) {
      throw new BadRequestException(`A template for trigger '${data.trigger}' on channel '${data.type}' already exists. Please edit the existing one instead.`);
    }

    const template = this.templateRepository.create(data);
    return this.templateRepository.save(template);
  }

  async updateTemplate(id: string, data: any) {
    await this.templateRepository.update(id, data);
    return this.templateRepository.findOne({ where: { id } });
  }

  /**
   * Read-only: would sendTriggeredNotification() queue an EMAIL for this trigger and user?
   * True only with an active EMAIL template and a real, non-bounced, non-suppressed address
   * (the same checks sendTriggeredNotification() + create() apply). Sends nothing.
   */
  async isTriggerEmailDeliverable(trigger: NotificationTrigger, recipientId: string): Promise<boolean> {
    const template = await this.templateRepository.findOne({
      where: { trigger, type: NotificationType.EMAIL, isActive: true },
    });
    if (!template) return false;
    const recipient = await this.userRepository.findOne({
      where: { id: recipientId },
      select: ['id', 'email', 'emailBounced'],
    });
    if (!recipient?.email || recipient.emailBounced) return false;
    const suppression = await this.emailSuppressionService.isEmailSuppressed(recipient.email);
    return !suppression.suppressed;
  }

  async sendTriggeredNotification(
    trigger: NotificationTrigger,
    recipientId: string,
    context: any,
    options: { channels?: NotificationType[] } = {},
  ): Promise<Notification[]> {
    const templates = await this.templateRepository.find({
      where: { trigger, isActive: true },
    });

    const notifications: Notification[] = [];

    for (const template of templates) {
      if (options.channels && !options.channels.includes(template.type)) continue;
      const title = this.replacePlaceholders(template.subject, context);
      let message = this.replacePlaceholders(template.content, context);

      // Ensure appointment confirmation/booking/reminder emails always include the Google Maps link (Urgent #6)
      if (
        template.type === NotificationType.EMAIL &&
        context?.googleMapsUrl &&
        [
          NotificationTrigger.APPOINTMENT_CONFIRMED,
          NotificationTrigger.APPOINTMENT_BOOKED,
          NotificationTrigger.APPOINTMENT_RESCHEDULED,
          NotificationTrigger.APPOINTMENT_REMINDER,
          NotificationTrigger.APPOINTMENT_REMINDER_SAME_DAY,
        ].includes(trigger) &&
        !message.includes('google.com/maps') &&
        !message.includes('maps.google')
      ) {
        if (context.clinicAddress && message.includes(context.clinicAddress)) {
          message = message.replace(
            context.clinicAddress,
            `${context.clinicAddress}\nΧάρτης Google Maps: ${context.googleMapsUrl}`,
          );
        } else {
          message = `${message}\n\nΧάρτης Google Maps: ${context.googleMapsUrl}`;
        }
      }

      const notification = await this.create(
        recipientId,
        template.type,
        title,
        message,
        { ...context, trigger },
      );
      if (notification) {
        notifications.push(notification);
      }
    }

    return notifications;
  }

  private replacePlaceholders(text: string, context: any): string {
    return text.replace(/\{\{(.*?)\}\}/g, (match, key) => {
      const value = key.split('.').reduce((obj, k) => obj?.[k.trim()], context);
      return value !== undefined && value !== null ? String(value) : '';
    });
  }

  /**
   * Creates any missing default template and upgrades templates that still hold the old
   * English default text (admin-edited templates are left untouched).
   */
  async seedDefaultTemplates() {
    let created = 0;
    let upgraded = 0;
    for (const data of DEFAULT_TEMPLATES) {
      const existing = await this.templateRepository.findOne({
        where: { trigger: data.trigger, type: data.type },
      });

      if (!existing) {
        const { defaultActive, ...templateFields } = data;
        await this.templateRepository.save(
          this.templateRepository.create({
            ...templateFields,
            isActive: defaultActive !== undefined ? defaultActive : true,
          }),
        );
        created++;
      } else if (
        LEGACY_DEFAULT_SUBJECTS.has(existing.subject) ||
        LEGACY_DEFAULT_CONTENTS.has(existing.content) ||
        (String(data.trigger).startsWith('APPOINTMENT_REMINDER') &&
          (LEGACY_REMINDER_TEXT.test(existing.subject || '') || LEGACY_REMINDER_TEXT.test(existing.content || '')))
      ) {
        await this.templateRepository.update(existing.id, { subject: data.subject, content: data.content });
        upgraded++;
      }
    }
    if (created || upgraded) {
      this.logger.log(`Notification templates: ${created} created, ${upgraded} upgraded to Greek defaults`);
    }
    return { created, upgraded };
  }

  /**
   * Send a 6-digit OTP code for email verification during registration.
   * The code is emailed directly and never stored in a notification row.
   */
  async sendEmailVerificationOtp(
    recipientId: string,
    firstName: string,
    otp: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: recipientId } });
    if (!user?.email || user.emailBounced || isPlaceholderEmail(user.email)) return;
    const suppression = await this.emailSuppressionService.isEmailSuppressed(user.email);
    if (suppression.suppressed) return;
    const tpl = await this.templateRepository.findOne({
      where: { trigger: NotificationTrigger.EMAIL_VERIFICATION, type: NotificationType.EMAIL },
    });
    if (tpl && !tpl.isActive) return;
    await this.mailService.sendVerificationEmail(user.email, { userName: firstName, code: otp });
  }
}
