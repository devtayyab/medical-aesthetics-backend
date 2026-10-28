import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { TasksService } from '../tasks/tasks.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { QueueService } from '../queue/queue.service';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { TaskType } from '../../common/enums/task-type.enum';
import { athensDate, athensTime, athensDateTime } from '../notifications/utils/notification-format.util';

@Injectable()
export class EventHandlersService {
  private readonly logger = new Logger(EventHandlersService.name);

  constructor(
    private notificationsService: NotificationsService,
    private tasksService: TasksService,
    private loyaltyService: LoyaltyService,
    private queueService: QueueService,
    private dataSource: DataSource,
  ) { }

  @OnEvent('lead.created')
  async handleLeadCreated(lead: any) {
    this.logger.log(`Handling lead created event for lead ${lead.id}`);

    // Create follow-up task
    const followUpDue = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    await this.tasksService.create({
      title: `Initial contact with ${lead.fullName}`,
      description: `New lead from ${lead.source}. Contact within 24 hours.`,
      type: TaskType.FOLLOW_UP_CALL,
      customerId: lead.id,
      assigneeId: lead.assignedSalesId,
      reminderAt: followUpDue.toISOString(),
      dueDate: followUpDue.toISOString(),
    });

    // Send notification to assigned salesperson
    if (lead.assignedSalesId) {
      await this.notificationsService.create(
        lead.assignedSalesId,
        NotificationType.PUSH,
        'Νέος lead',
        `${lead.fullName} · Πηγή: ${lead.source}`,
        { leadId: lead.id },
      );
    }

    // Schedule follow-up reminder
    await this.queueService.scheduleLeadFollowUp(
      lead.id,
      followUpDue,
    );

    // Notify associated clinics if any
    if (lead.clinics && Array.isArray(lead.clinics)) {
      for (const clinic of lead.clinics) {
        await this.notificationsService.notifyClinicStaff(
          clinic.id,
          'Νέο ενδιαφέρον για την κλινική',
          `${lead.fullName} ενδιαφέρεται για την κλινική σας.`,
          { leadId: lead.id }
        );
      }
    }
  }

  @OnEvent('appointment.status.changed')
  async handleAppointmentStatusChanged(eventData: any) {
    const { appointment, oldStatus, newStatus } = eventData;

    this.logger.log(`Appointment ${appointment.id} status changed from ${oldStatus} to ${newStatus}`);
    if (oldStatus === newStatus) return;

    const serviceName = appointment.service?.treatment?.name || 'Appointment';

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
        const afterCareDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days later
        await this.tasksService.create({
          title: `Follow-up call for ${appointment.client.fullName || 'Client'}`,
          description: `Check on client satisfaction and recovery after ${serviceName}`,
          type: TaskType.TREATMENT_FOLLOW_UP,
          customerId: appointment.clientId,
          assigneeId: appointment.providerId,
          reminderAt: afterCareDue.toISOString(),
          dueDate: afterCareDue.toISOString(),
        });
      }

    }
    // Notifications for status changes are sent once by AppointmentNotificationsListener.
  }

  @OnEvent('appointment.rescheduled')
  async handleAppointmentRescheduled(eventData: any) {
    const appointment = eventData?.appointment || eventData;
    if (!appointment) return;
    this.logger.log(`Handling appointment.rescheduled event for appointment ${appointment.id}`);
  }

  @OnEvent('blocked_slot.created')
  async handleBlockedSlotCreated(slot: any) {
    this.logger.log(`Blocked slot created for clinic ${slot.clinicId}`);

    const clinicName = await this.clinicName(slot.clinicId);
    await this.notificationsService.notifyAllStaff(
      'Κλείσιμο ώρας στο ημερολόγιο',
      `${clinicName} · ${athensDate(slot.startTime)} ${athensTime(slot.startTime)}-${athensTime(slot.endTime)} · Αιτία: ${slot.reason || '-'}`,
      { clinicId: slot.clinicId, slotId: slot.id, type: 'slot_blocked' },
      slot.blockedById ? [slot.blockedById] : [],
    );
  }

  @OnEvent('blocked_slot.deleted')
  async handleBlockedSlotDeleted(slot: any) {
    this.logger.log(`Blocked slot removed for clinic ${slot.clinicId}`);

    const clinicName = await this.clinicName(slot.clinicId);
    await this.notificationsService.notifyAllStaff(
      'Άνοιγμα ώρας στο ημερολόγιο',
      `${clinicName} · ${athensDate(slot.startTime)} ${athensTime(slot.startTime)}-${athensTime(slot.endTime)} είναι ξανά διαθέσιμο.`,
      { clinicId: slot.clinicId, slotId: slot.id, type: 'slot_unblocked' },
    );
  }

  @OnEvent('treatment.added')
  async handleTreatmentAdded(eventData: any) {
    const { treatment, clinicName } = eventData;
    this.logger.log(`New treatment added: ${treatment?.name}`);

    // Only notify platform admins — not all staff (avoids duplicate/spam notifications)
    await this.notificationsService.notifyAdmins(
      'Νέα θεραπεία προς έγκριση',
      `"${treatment?.name}" από ${clinicName || 'κλινική'}. Εγκρίνετε ή απορρίψτε στις Εγκρίσεις υπηρεσιών.`,
      { treatmentId: treatment?.id, type: 'treatment_added', link: '/admin/treatments' }
    );
  }

  @OnEvent('treatment.edited')
  async handleTreatmentEdited(eventData: any) {
    const { treatment, clinicName, changes } = eventData;
    this.logger.log(`Treatment edited: ${treatment?.name}`);

    const changeDesc = changes?.priceChanged
      ? ` Νέα τιμή: €${changes.newPrice}.`
      : '';

    await this.notificationsService.notifyAdmins(
      'Αλλαγή θεραπείας προς έγκριση',
      `"${treatment?.name}" στο ${clinicName || 'κλινική'} άλλαξε.${changeDesc}`,
      { treatmentId: treatment?.id, type: 'treatment_edited', link: '/admin/treatments' }
    );
  }

  @OnEvent('review.created')
  async handleReviewCreated(eventData: any) {
    const { review, clinicName } = eventData || {};
    if (!review) return;
    await this.notificationsService.notifyAdmins(
      'Νέα αξιολόγηση προς έλεγχο',
      `${clinicName || 'Κλινική'} · ${review.rating}/5${review.comment ? ` · "${String(review.comment).slice(0, 120)}"` : ''}`,
      { reviewId: review.id, clinicId: review.clinicId, type: 'review_created', link: '/admin/reviews' },
    );
  }

  @OnEvent('review.responded')
  async handleReviewResponded(eventData: any) {
    const { review, clinicName, responderId } = eventData || {};
    if (!review) return;
    await this.notificationsService.notifyAdmins(
      'Απάντηση κλινικής σε αξιολόγηση',
      `${clinicName || 'Κλινική'} απάντησε: "${String(review.response || '').slice(0, 160)}"`,
      { reviewId: review.id, clinicId: review.clinicId, type: 'review_responded', link: '/admin/reviews' },
      responderId ? [responderId] : [],
    );
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

  @OnEvent('task.created')
  async handleTaskCreated(task: any) {
    this.logger.log(`Handling task created event for task ${task.id}`);
    
    if (task.assigneeId) {
      await this.notificationsService.create(
        task.assigneeId,
        NotificationType.PUSH,
        'Νέα εργασία',
        `${task.title}${task.dueDate ? ` · Λήξη ${athensDateTime(task.dueDate)}` : ''}`,
        { taskId: task.id }
      );
    }
  }

  @OnEvent('task.status.changed')
  async handleTaskStatusChanged(eventData: any) {
    const { task, oldStatus, newStatus } = eventData;
    this.logger.log(`Task ${task.id} status changed from ${oldStatus} to ${newStatus}`);

    if (newStatus === 'completed' && task.creatorId && task.creatorId !== task.assigneeId) {
        // Notify creator if someone else completed the task
        await this.notificationsService.create(
            task.creatorId,
            NotificationType.PUSH,
            'Η εργασία ολοκληρώθηκε',
            `Η εργασία "${task.title}" που αναθέσατε ολοκληρώθηκε.`,
            { taskId: task.id }
        );
    }
  }

  private async clinicName(clinicId?: string): Promise<string> {
    if (!clinicId) return 'Κλινική';
    const rows = await this.dataSource.query('SELECT name FROM clinics WHERE id = $1', [clinicId]).catch(() => []);
    return rows?.[0]?.name || 'Κλινική';
  }

  private calculatePreviousTier(points: number): string {
    if (points >= 1000) return 'platinum';
    if (points >= 500) return 'gold';
    if (points >= 200) return 'silver';
    return 'bronze';
  }
}