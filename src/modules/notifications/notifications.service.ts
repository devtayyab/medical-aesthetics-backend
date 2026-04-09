import { Injectable, forwardRef, Inject, OnModuleInit, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { Notification } from './entities/notification.entity';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { UsersService } from '../users/users.service';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { NotificationTrigger } from '../../common/enums/notification-trigger.enum';
import { NotificationTemplate } from './entities/notification-template.entity';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private notificationsGateway: NotificationsGateway;

  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(NotificationTemplate)
    private templateRepository: Repository<NotificationTemplate>,
    @InjectQueue('notifications')
    private notificationsQueue: Queue,
    private usersService: UsersService,
    @Inject(forwardRef(() => NotificationsGateway))
    private _gateway: NotificationsGateway,
  ) { }

  onModuleInit() {
    this.notificationsGateway = this._gateway;
  }

  async create(
    recipientId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
  ): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      recipientId,
      type,
      title,
      message,
      data,
    });

    const savedNotification = await this.notificationsRepository.save(notification);

    // Send real-time notification via WebSocket if user is connected
    if (this.notificationsGateway) {
      await this.notificationsGateway.sendToUser(recipientId, {
        id: savedNotification.id,
        type: savedNotification.type,
        title: savedNotification.title,
        message: savedNotification.message,
        data: savedNotification.data,
        isRead: savedNotification.isRead,
        createdAt: savedNotification.createdAt,
      });
    }

    // Queue for processing (push, email, etc.)
    await this.notificationsQueue.add('send-notification', {
      notificationId: savedNotification.id,
    });

    return savedNotification;
  }

  async sendBulk(
    recipientIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
  ): Promise<void> {
    const notifications = recipientIds.map(recipientId => ({
      recipientId,
      type,
      title,
      message,
      data,
    }));

    const savedNotifications = await this.notificationsRepository.save(notifications);

    // Queue all for processing
    const jobs = savedNotifications.map(notification => ({
      name: 'send-notification',
      data: { notificationId: notification.id },
    }));

    await this.notificationsQueue.addBulk(jobs);
  }

  async findByRecipient(recipientId: string, limit: number = 50): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { recipientId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findAllGlobal(limit: number = 50): Promise<Notification[]> {
    return this.notificationsRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markAsRead(id: string): Promise<void> {
    await this.notificationsRepository.update(id, {
      isRead: true,
      readAt: new Date(),
    });
  }

  async markAllAsRead(recipientId: string): Promise<void> {
    await this.notificationsRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true, readAt: new Date() })
      .where("recipientId = :recipientId AND isRead = false", { recipientId })
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
      where: { recipientId, isRead: false },
    });
  }

  // Convenience methods for common notification scenarios
  async sendAppointmentReminder(
    recipientId: string,
    appointmentDetails: any,
  ): Promise<Notification> {
    return this.create(
      recipientId,
      NotificationType.PUSH,
      'Appointment Reminder',
      `You have an appointment tomorrow at ${appointmentDetails.time}`,
      { appointmentId: appointmentDetails.id },
    );
  }

  async sendAppointmentConfirmation(
    recipientId: string,
    appointmentDetails: any,
  ): Promise<Notification> {
    const serviceName = appointmentDetails.serviceName || 'Appointment';
    const providerName = appointmentDetails.providerName || 'Professional';
    const date = appointmentDetails.date instanceof Date
      ? appointmentDetails.date.toLocaleDateString()
      : appointmentDetails.date;
    const time = appointmentDetails.time instanceof Date
      ? appointmentDetails.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : appointmentDetails.time;

    return this.create(
      recipientId,
      NotificationType.PUSH,
      'Appointment Confirmed',
      `${serviceName} with ${providerName} confirmed for ${date} at ${time}`,
      {
        appointmentId: appointmentDetails.id,
        serviceName,
        providerName,
        date,
        time,
      },
    );
  }

  async sendLoyaltyUpdate(
    recipientId: string,
    loyaltyDetails: any,
  ): Promise<Notification> {
    return this.create(
      recipientId,
      NotificationType.PUSH,
      'Loyalty Points Updated',
      `You've earned ${loyaltyDetails.points} points! Your new balance is ${loyaltyDetails.balance}`,
      loyaltyDetails,
    );
  }

  async sendToPlatformAdmins(
    title: string,
    message: string,
    data?: any,
  ): Promise<{ message: string; sentTo: number }> {
    // Find all admin users
    const admins = await this.usersService.findAll({ role: UserRole.ADMIN, isActive: true });

    if (admins.length === 0) {
      throw new Error('No admin users found to send message to');
    }

    const adminIds = admins.map(admin => admin.id);

    // Send bulk notification to all admins
    await this.sendBulk(
      adminIds,
      NotificationType.PUSH,
      `[Clinic Message] ${title}`,
      message,
      { ...data, source: 'clinic_to_platform' },
    );

    return {
      message: 'Message sent to platform admins',
      sentTo: adminIds.length,
    };
  }

  async notifyAllStaff(
    title: string,
    message: string,
    data?: any,
  ): Promise<{ sentTo: number }> {
    // Find all users who should be notified (Admins, Super Admins, and Salespeople)
    const admins = await this.usersService.findAll({ role: UserRole.ADMIN, isActive: true });
    const superAdmins = await this.usersService.findAll({ role: UserRole.SUPER_ADMIN, isActive: true });
    const salespeople = await this.usersService.findAll({ role: UserRole.SALESPERSON, isActive: true });

    const recipientIds = [...new Set([...admins, ...superAdmins, ...salespeople].map(u => u.id))];

    if (recipientIds.length === 0) return { sentTo: 0 };

    await this.sendBulk(
      recipientIds,
      NotificationType.PUSH,
      title,
      message,
      data
    );

    return { sentTo: recipientIds.length };
  }

  async notifyClinicStaff(
    clinicId: string,
    title: string,
    message: string,
    data?: any,
  ): Promise<{ sentTo: number }> {
    // Find all users related to this clinic (Owners, Secretariat, Doctors)
    const users = await this.usersService.findAll({ isActive: true });
    const clinicStaff = users.filter(u => 
      u.assignedClinicId === clinicId || 
      [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(u.role as UserRole)
    );

    const recipientIds = clinicStaff.map(u => u.id);

    if (recipientIds.length === 0) return { sentTo: 0 };

    await this.sendBulk(
      recipientIds,
      NotificationType.PUSH,
      title,
      message,
      data
    );

    return { sentTo: recipientIds.length };
  }

  async sendWelcomeCredentials(
    recipientId: string,
    email: string,
    password: string,
  ): Promise<Notification> {
    return this.create(
      recipientId,
      NotificationType.EMAIL,
      'Welcome to Medical Aesthetics Platform!',
      `Your account has been created. \nLogin ID: ${email}\nTemporary Password: ${password}\nPlease change your password after logging in.`,
      { email, passwordType: 'temporary' },
    );
  }

  /**
   * Helper for sending BOTH push + email to a single user in one call.
   * Useful for admin broadcasts or important alerts.
   */
  async sendEmailAndPushToUser(
    recipientId: string,
    title: string,
    message: string,
    emailBody?: string,
    data?: any,
  ): Promise<{ push: Notification; email: Notification }> {
    const push = await this.create(
      recipientId,
      NotificationType.PUSH,
      title,
      message,
      data,
    );

    const email = await this.create(
      recipientId,
      NotificationType.EMAIL,
      title,
      emailBody ?? message,
      { ...data, channel: 'email' },
    );

    return { push, email };
  }

  // Template Management
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

  async sendTriggeredNotification(
    trigger: NotificationTrigger,
    recipientId: string,
    context: any,
  ): Promise<Notification[]> {
    const templates = await this.templateRepository.find({
      where: { trigger, isActive: true },
    });

    const notifications: Notification[] = [];

    for (const template of templates) {
      const title = this.replacePlaceholders(template.subject, context);
      const message = this.replacePlaceholders(template.content, context);

      const notification = await this.create(
        recipientId,
        template.type,
        title,
        message,
        { ...context, trigger },
      );
      notifications.push(notification);
    }

    return notifications;
  }

  private replacePlaceholders(text: string, context: any): string {
    return text.replace(/\{\{(.*?)\}\}/g, (match, key) => {
      const value = key.split('.').reduce((obj, k) => obj?.[k.trim()], context);
      return value !== undefined ? value : match;
    });
  }

  async seedDefaultTemplates() {
    const defaults = [
      {
        trigger: NotificationTrigger.APPOINTMENT_BOOKED,
        type: NotificationType.EMAIL,
        subject: 'Appointment Booked: {{serviceName}}',
        content: 'Hi {{customerName}},\n\nYour appointment for {{serviceName}} has been booked for {{appointmentDate}} at {{appointmentTime}} at {{clinicName}}.\n\nThank you!',
      },
      {
        trigger: NotificationTrigger.APPOINTMENT_BOOKED,
        type: NotificationType.PUSH,
        subject: 'New Appointment Booked',
        content: 'Your appointment for {{serviceName}} has been scheduled for {{appointmentDate}} at {{appointmentTime}}.',
      },
      {
        trigger: NotificationTrigger.APPOINTMENT_CONFIRMED,
        type: NotificationType.PUSH,
        subject: 'Appointment Confirmed!',
        content: 'Your {{serviceName}} at {{clinicName}} is confirmed for {{appointmentDate}} at {{appointmentTime}}.',
      },
      {
        trigger: NotificationTrigger.APPOINTMENT_CONFIRMED,
        type: NotificationType.EMAIL,
        subject: 'Confirmed: Your Appointment at {{clinicName}}',
        content: 'Dear {{customerName}},\n\nWe are happy to confirm your appointment for {{serviceName}} on {{appointmentDate}} at {{appointmentTime}}.\n\nLocation: {{clinicName}}\n\nWe look forward to seeing you!',
      },
      {
        trigger: NotificationTrigger.APPOINTMENT_RESCHEDULED,
        type: NotificationType.PUSH,
        subject: 'Appointment Rescheduled',
        content: 'Your appointment for {{serviceName}} has been moved to {{appointmentDate}} at {{appointmentTime}}.',
      },
      {
        trigger: NotificationTrigger.APPOINTMENT_RESCHEDULED,
        type: NotificationType.EMAIL,
        subject: 'Updated Appointment Details',
        content: 'Hi {{customerName}},\n\nYour appointment for {{serviceName}} has been rescheduled. Your new time is {{appointmentDate}} at {{appointmentTime}}.\n\nPlease let us know if this doesn\'t work for you.',
      },
      {
        trigger: NotificationTrigger.APPOINTMENT_CANCELED,
        type: NotificationType.EMAIL,
        subject: 'Appointment Cancelled',
        content: 'Hi {{customerName}},\n\nThis is to confirm that your appointment for {{serviceName}} on {{appointmentDate}} has been cancelled. If you didn\'t request this, please contact us immediately.',
      },
      {
        trigger: NotificationTrigger.APPOINTMENT_REMINDER,
        type: NotificationType.PUSH,
        subject: 'Upcoming Appointment Reminder',
        content: 'Don\'t forget! You have an appointment for {{serviceName}} tomorrow at {{appointmentTime}}.',
      },
      {
        trigger: NotificationTrigger.POST_VISIT_THANK_YOU,
        type: NotificationType.EMAIL,
        subject: 'Thank You for Choosing {{clinicName}}',
        content: 'Hi {{customerName}},\n\nIt was a pleasure seeing you today for your {{serviceName}} treatment. We hope you had a great experience!\n\nBest regards,\nThe {{clinicName}} Team',
      },
      {
        trigger: NotificationTrigger.TASK_REMINDER,
        type: NotificationType.PUSH,
        subject: 'Task Reminder',
        content: 'Reminder: Task "{{taskTitle}}" is due on {{dueDate}}.',
      },
      {
        trigger: NotificationTrigger.WELCOME_CREDENTIALS,
        type: NotificationType.EMAIL,
        subject: 'Welcome to Beauty & Doctors - Your Account is Ready',
        content: 'Hi {{customerName}},\n\nWelcome to our platform! Your account has been created successfully.\n\nYou can now log in to the portal using your email and manage your appointments and rewards.\n\nSee you inside!',
      },
      {
        trigger: NotificationTrigger.EXECUTION_NOTIFICATION,
        type: NotificationType.PUSH,
        subject: 'Action Completed',
        content: 'The action "{{actionName}}" has been executed successfully.',
      },
    ];

    for (const data of defaults) {
      const existing = await this.templateRepository.findOne({
        where: { trigger: data.trigger, type: data.type },
      });

      if (!existing) {
        await this.templateRepository.save(this.templateRepository.create({ ...data, isActive: true }));
      }
    }
  }

}