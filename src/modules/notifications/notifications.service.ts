import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { Notification } from './entities/notification.entity';
import { NotificationType } from '../../common/enums/notification-type.enum';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectQueue('notifications')
    private notificationsQueue: Queue,
  ) {}

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

    // Queue for processing
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

  async markAsRead(id: string): Promise<void> {
    await this.notificationsRepository.update(id, {
      isRead: true,
      readAt: new Date(),
    });
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
    return this.create(
      recipientId,
      NotificationType.SMS,
      'Appointment Confirmed',
      `Your appointment has been confirmed for ${appointmentDetails.date} at ${appointmentDetails.time}`,
      { appointmentId: appointmentDetails.id },
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
}