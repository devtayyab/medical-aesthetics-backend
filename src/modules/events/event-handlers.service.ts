import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications/notifications.service';
import { TasksService } from '../tasks/tasks.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { QueueService } from '../queue/queue.service';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { TaskType } from '../../common/enums/task-type.enum';

@Injectable()
export class EventHandlersService {
  private readonly logger = new Logger(EventHandlersService.name);

  constructor(
    private notificationsService: NotificationsService,
    private tasksService: TasksService,
    private loyaltyService: LoyaltyService,
    private queueService: QueueService,
  ) { }

  @OnEvent('lead.created')
  async handleLeadCreated(lead: any) {
    this.logger.log(`Handling lead created event for lead ${lead.id}`);

    // Create follow-up task
    await this.tasksService.create({
      title: `Initial contact with ${lead.fullName}`,
      description: `New lead from ${lead.source}. Contact within 24 hours.`,
      type: TaskType.FOLLOW_UP_CALL,
      customerId: lead.id,
      assigneeId: lead.assignedSalesId,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString(), // 24 hours from now
    });

    // Send notification to assigned salesperson
    if (lead.assignedSalesId) {
      await this.notificationsService.create(
        lead.assignedSalesId,
        NotificationType.PUSH,
        'New Lead Assigned',
        `You have a new lead: ${lead.fullName} from ${lead.source}`,
        { leadId: lead.id },
      );
    }

    // Schedule follow-up reminder
    await this.queueService.scheduleLeadFollowUp(
      lead.id,
      new Date(Date.now() + 24 * 60 * 60 * 1000),
    );
  }

  @OnEvent('appointment.created')
  async handleAppointmentCreated(appointment: any) {
    this.logger.log(`Handling appointment created event for appointment ${appointment.id}`);

    // Send confirmation to client
    const serviceName = appointment.service?.name || 'Appointment';
    const providerName = appointment.provider
      ? `${appointment.provider.firstName} ${appointment.provider.lastName}`
      : 'Professional';

    await this.notificationsService.sendAppointmentConfirmation(
      appointment.clientId,
      {
        id: appointment.id,
        date: appointment.startTime,
        time: appointment.startTime,
        serviceName,
        providerName,
      },
    );

    // Send notification to provider (doctor/aesthetician) if assigned
    if (appointment.providerId) {
      const appointmentDate = new Date(appointment.startTime);
      const formattedDate = appointmentDate.toLocaleDateString();
      const formattedTime = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      await this.notificationsService.create(
        appointment.providerId,
        NotificationType.PUSH,
        'New Appointment Booked',
        `${serviceName} with ${appointment.client?.firstName || 'Client'} on ${formattedDate} at ${formattedTime}`,
        {
          appointmentId: appointment.id,
          type: 'appointment_created',
          serviceName,
          clientName: appointment.client ? `${appointment.client.firstName} ${appointment.client.lastName}` : 'Client',
          startTime: appointment.startTime,
        },
      );
    }

    // Also notify clinic owner and secretariat
    if (appointment.clinic?.ownerId) {
      const appointmentDate = new Date(appointment.startTime);
      const formattedDate = appointmentDate.toLocaleDateString();
      const formattedTime = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      await this.notificationsService.create(
        appointment.clinic.ownerId,
        NotificationType.PUSH,
        'New Appointment Booking',
        `${serviceName}${appointment.provider ? ` with ${providerName}` : ''} on ${formattedDate} at ${formattedTime}`,
        {
          appointmentId: appointment.id,
          type: 'appointment_created',
          clinicId: appointment.clinicId,
        },
      );
    }

    // Schedule reminder 24 hours before
    const startTime = appointment.startTime instanceof Date ? appointment.startTime : new Date(appointment.startTime);
    const reminderTime = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);
    if (reminderTime > new Date()) {
      await this.queueService.scheduleAppointmentReminder(appointment.id, reminderTime);
    }
  }

  @OnEvent('appointment.status.changed')
  async handleAppointmentStatusChanged(eventData: any) {
    const { appointment, oldStatus, newStatus } = eventData;

    this.logger.log(`Appointment ${appointment.id} status changed from ${oldStatus} to ${newStatus}`);

    const serviceName = appointment.service?.name || 'Appointment';
    const providerName = appointment.provider
      ? `${appointment.provider.firstName} ${appointment.provider.lastName}`
      : 'Professional';

    if (newStatus === 'completed') {
      // Award loyalty points
      const points = await this.loyaltyService.calculatePointsForAppointment(
        appointment.totalAmount || appointment.service?.price || 0,
      );

      await this.loyaltyService.awardPoints(
        appointment.clientId,
        appointment.clinicId,
        points,
        `Points earned from ${serviceName} treatment`,
        appointment.id,
      );

      // Create follow-up task for after-care
      if (appointment.client) {
        await this.tasksService.create({
          title: `Follow-up call for ${appointment.client.fullName || 'Client'}`,
          description: `Check on client satisfaction and recovery after ${serviceName}`,
          type: TaskType.TREATMENT_FOLLOW_UP,
          customerId: appointment.clientId,
          assigneeId: appointment.providerId,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toDateString(), // 7 days later
        });
      }
    }

    // Send status update notification to client
    await this.notificationsService.create(
      appointment.clientId,
      NotificationType.PUSH,
      'Appointment Update',
      `Your ${serviceName}${providerName ? ` with ${providerName}` : ''} status: ${newStatus}`,
      {
        appointmentId: appointment.id,
        status: newStatus,
        serviceName,
        providerName,
      },
    );

    // Also notify provider if status changed
    if (appointment.providerId) {
      await this.notificationsService.create(
        appointment.providerId,
        NotificationType.PUSH,
        'Appointment Status Changed',
        `${serviceName} appointment status changed to: ${newStatus}`,
        {
          appointmentId: appointment.id,
          status: newStatus,
          clientName: appointment.client ? `${appointment.client.firstName} ${appointment.client.lastName}` : 'Client',
        },
      );
    }
  }

  @OnEvent('loyalty.points.awarded')
  async handleLoyaltyPointsAwarded(eventData: any) {
    const { clientId, points, balance } = eventData;

    this.logger.log(`${points} loyalty points awarded to client ${clientId}`);

    // Send notification about points earned
    await this.notificationsService.sendLoyaltyUpdate(clientId, {
      points,
      balance: balance.totalPoints,
      tier: balance.tier,
    });

    // Check for tier upgrades
    const previousTier = this.calculatePreviousTier(balance.totalPoints - points);
    if (balance.tier !== previousTier) {
      await this.notificationsService.create(
        clientId,
        NotificationType.PUSH,
        'Tier Upgrade!',
        `Congratulations! You've been upgraded to ${balance.tier.toUpperCase()} tier`,
        { tier: balance.tier },
      );
    }
  }

  private calculatePreviousTier(points: number): string {
    if (points >= 1000) return 'platinum';
    if (points >= 500) return 'gold';
    if (points >= 200) return 'silver';
    return 'bronze';
  }
}