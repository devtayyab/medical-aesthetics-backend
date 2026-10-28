import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CustomerRecord } from './entities/customer-record.entity';
import { User } from '../users/entities/user.entity';
import { Appointment } from '../bookings/entities/appointment.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { athensDateTime } from '../notifications/utils/notification-format.util';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { CrmAction } from './entities/crm-action.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  BUSINESS_TIMEZONE,
  confirmationCallDueDate,
  formatDateTimeInTz,
} from '../../common/utils/timezone.util';

export interface TaskAutomationRule {
  id: string;
  name: string;
  trigger: 'appointment_scheduled';
  actionType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  template: string;
}

/** Marker stored in metadata.automationRule of the one automatic task per booking. */
export const CONFIRMATION_RULE_ID = 'appointment_confirmation';

/** Roles that may own CRM tasks (BeautyDoctors staff). Doctors/clinic/clients never do. */
export const TASK_OWNER_ROLES: string[] = [
  UserRole.SALESPERSON,
  UserRole.MANAGER,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
];

const ACTIVE_STATUSES: string[] = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED];
const DONE_STATUSES: string[] = [AppointmentStatus.COMPLETED, AppointmentStatus.EXECUTED];
const CLOSED_STATUSES: string[] = [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW, AppointmentStatus.DELETED];
const OPEN_TASK_STATUSES = ['pending', 'in_progress'];
const WALK_IN_DUMMY_ID = '00000000-0000-0000-0000-000000000000';

/**
 * CRM task automation.
 *
 * Business rule (pre-launch item 36/37): exactly ONE automatic task per booking, the
 * confirmation call, due 2 working days (Mon-Fri) before the appointment at 08:00
 * Europe/Athens. It follows the appointment: reschedule moves it, cancel/no-show
 * cancels it, completion completes it. No other automatic tasks are created
 * (no follow-ups, no-show, treatment or no-contact reminders).
 */
@Injectable()
export class TaskAutomationService {
  private readonly logger = new Logger(TaskAutomationService.name);

  constructor(
    @InjectRepository(CrmAction)
    private crmActionsRepository: Repository<CrmAction>,
    @InjectRepository(CustomerRecord)
    private customerRecordsRepository: Repository<CustomerRecord>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    private eventEmitter: EventEmitter2,
    private notificationsService: NotificationsService,
  ) { }

  private readonly rules: TaskAutomationRule[] = [
    {
      id: CONFIRMATION_RULE_ID,
      name: 'Appointment confirmation call (2 working days before, 08:00 Athens)',
      trigger: 'appointment_scheduled',
      actionType: 'confirmation_call_reminder',
      priority: 'high',
      template: 'Confirmation call: {client} - {treatment}',
    },
  ];

  async getAutomationRules(): Promise<TaskAutomationRule[]> {
    return this.rules;
  }

  /** First active admin (then super admin): owner for online client bookings. */
  private async findDefaultAdminId(): Promise<string | null> {
    for (const role of [UserRole.ADMIN, UserRole.SUPER_ADMIN]) {
      const admin = await this.usersRepository.findOne({
        where: { role, isActive: true },
        order: { createdAt: 'ASC' } as any,
      });
      if (admin) return admin.id;
    }
    return null;
  }

  /**
   * Owner of the confirmation task: whoever booked it when that is BD staff
   * (salesperson/manager/admin); otherwise (online client booking, doctor/clinic
   * booking) an admin. Never a doctor or clinic account.
   */
  private async resolveOwnerId(appointment: Appointment): Promise<string | null> {
    if (appointment.bookedById) {
      const booker = appointment.bookedBy?.role
        ? appointment.bookedBy
        : await this.usersRepository.findOne({ where: { id: appointment.bookedById } });
      if (booker && TASK_OWNER_ROLES.includes(booker.role) && booker.isActive !== false) {
        return booker.id;
      }
    }
    return this.findDefaultAdminId();
  }

  private async isBdStaff(userId?: string | null): Promise<boolean> {
    if (!userId) return false;
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    return !!user && TASK_OWNER_ROLES.includes(user.role);
  }

  /** Open confirmation-type tasks of an appointment, incl. legacy shapes created by older code. */
  private async findConfirmationTasks(appointmentId: string): Promise<CrmAction[]> {
    return this.crmActionsRepository
      .createQueryBuilder('action')
      .where(
        `(
          (action.relatedAppointmentId = :aid AND action.actionType IN ('confirmation_call_reminder', 'appointment'))
          OR (action.metadata->>'appointmentId' = :aid AND action.metadata->>'workflow' = 'call_center_confirmation')
        )`,
        { aid: appointmentId },
      )
      .orderBy(`CASE WHEN action.metadata->>'automationRule' = '${CONFIRMATION_RULE_ID}' THEN 0 WHEN action.actionType = 'confirmation_call_reminder' THEN 1 ELSE 2 END`, 'ASC')
      .addOrderBy('action.createdAt', 'ASC')
      .getMany();
  }

  /**
   * Brings the confirmation task of one appointment in line with the appointment:
   * create (once), move on reschedule, close on cancel/no-show/complete.
   * Safe to call any number of times (idempotent).
   */
  async syncConfirmationTask(appointmentOrId: string | { id?: string } | null | undefined): Promise<void> {
    const appointmentId = typeof appointmentOrId === 'string' ? appointmentOrId : appointmentOrId?.id;
    if (!appointmentId) return;

    try {
      const appointment = await this.appointmentsRepository.findOne({
        where: { id: appointmentId },
        relations: ['client', 'clinic', 'service', 'service.treatment', 'bookedBy'],
      });
      const tasks = await this.findConfirmationTasks(appointmentId);
      const openTasks = tasks.filter(t => OPEN_TASK_STATUSES.includes(t.status));

      // Appointment gone, cancelled, no-show or done -> close the open task(s)
      const status = String(appointment?.status || '').toUpperCase();
      if (!appointment || CLOSED_STATUSES.includes(status) || DONE_STATUSES.includes(status)) {
        const done = !!appointment && DONE_STATUSES.includes(status);
        for (const task of openTasks) {
          await this.crmActionsRepository.update(task.id, {
            status: done ? 'completed' : 'cancelled',
            completedAt: done ? new Date() : task.completedAt,
            metadata: { ...(task.metadata || {}), closedBy: 'system', closedReason: `appointment_${status.toLowerCase() || 'deleted'}` },
          } as any);
        }
        return;
      }

      if (!ACTIVE_STATUSES.includes(status)) return; // e.g. PENDING_PAYMENT, ARRIVED, IN_PROGRESS: leave as is
      if (!appointment.clientId || appointment.clientId === WALK_IN_DUMMY_ID) return;

      const startIso = new Date(appointment.startTime).toISOString();
      const now = new Date();
      let dueDate = confirmationCallDueDate(new Date(appointment.startTime));
      if (dueDate < now) dueDate = now; // booked less than 2 working days ahead: call now

      const [primary, ...duplicates] = tasks;

      // Older code created 2-4 tasks per booking: keep one, cancel the other open ones
      for (const dup of duplicates.filter(t => OPEN_TASK_STATUSES.includes(t.status))) {
        await this.crmActionsRepository.update(dup.id, {
          status: 'cancelled',
          metadata: { ...(dup.metadata || {}), closedBy: 'system', closedReason: 'duplicate_automatic_task' },
        } as any);
      }

      if (primary) {
        const sameStart = primary.metadata?.appointmentStart === startIso;
        const isOpen = OPEN_TASK_STATUSES.includes(primary.status);
        const ownerIsStaff = await this.isBdStaff(primary.salespersonId);
        const updates: Partial<CrmAction> = {};

        // Legacy task without a known appointment time that is already closed: leave history alone
        if (!sameStart && (isOpen || primary.metadata?.appointmentStart)) {
          // Legacy task shape, or the appointment moved: (re)schedule the call and reopen it
          updates.dueDate = dueDate;
          updates.reminderDate = dueDate;
          if (primary.actionType !== 'confirmation_call_reminder') {
            updates.actionType = 'confirmation_call_reminder';
            updates.title = primary.title?.replace(/^(Appointment|Confirmation Call Reminder)\b/i, 'Confirmation call') || 'Confirmation call';
          }
          updates.relatedAppointmentId = appointment.id;
          if (!isOpen) {
            updates.status = 'pending';
            updates.completedAt = null;
          }
          const { reminderSent: _sent, ...rest } = primary.metadata || {};
          updates.metadata = {
            ...rest,
            automationRule: CONFIRMATION_RULE_ID,
            appointmentId: appointment.id,
            appointmentStart: startIso,
            workflow: 'call_center_confirmation',
            createdBy: primary.metadata?.createdBy || 'system',
          };
        }
        if (!ownerIsStaff && (isOpen || updates.status === 'pending')) {
          const ownerId = await this.resolveOwnerId(appointment);
          if (ownerId) updates.salespersonId = ownerId;
        }
        if (Object.keys(updates).length) {
          await this.crmActionsRepository.update(primary.id, updates as any);
        }
        return;
      }

      // No task yet: create it
      const ownerId = await this.resolveOwnerId(appointment);
      if (!ownerId) {
        this.logger.warn(`No admin found to own the confirmation task of appointment ${appointment.id}`);
        return;
      }

      let record = await this.customerRecordsRepository.findOne({ where: { customerId: appointment.clientId } });
      if (!record) {
        // Doctor's own patient booked by the clinic: not a BD contact, BD does not call them
        if (appointment.appointmentSource === 'clinic_own' && !(await this.isBdStaff(appointment.bookedById))) {
          return;
        }
        const clientUser = await this.usersRepository.findOne({ where: { id: appointment.clientId } });
        if (!clientUser) return;
        try {
          record = await this.customerRecordsRepository.save(
            this.customerRecordsRepository.create({ customerId: appointment.clientId }),
          );
        } catch {
          record = await this.customerRecordsRepository.findOne({ where: { customerId: appointment.clientId } });
        }
        if (!record) return;
      }

      const clientName = appointment.client
        ? `${appointment.client.firstName || ''} ${appointment.client.lastName || ''}`.trim()
        : appointment.clientDetails?.fullName || 'Client';
      const treatment = appointment.service?.treatment?.name || 'Treatment';
      const tz = BUSINESS_TIMEZONE;
      const title = `Confirmation call: ${clientName} - ${treatment}`;

      const saved = await this.crmActionsRepository.save(
        this.crmActionsRepository.create({
          customerId: record.id,
          salespersonId: ownerId,
          actionType: 'confirmation_call_reminder',
          title,
          therapy: treatment,
          clinic: appointment.clinic?.name,
          description: `Call the client to confirm the appointment on ${formatDateTimeInTz(appointment.startTime, tz)} at ${appointment.clinic?.name || 'the clinic'}.`,
          status: 'pending',
          priority: 'high',
          dueDate,
          reminderDate: dueDate,
          relatedAppointmentId: appointment.id,
          metadata: {
            automationRule: CONFIRMATION_RULE_ID,
            createdBy: 'system',
            appointmentId: appointment.id,
            appointmentStart: startIso,
            workflow: 'call_center_confirmation',
          },
        }),
      );

      await this.notificationsService.create(
        ownerId,
        NotificationType.PUSH,
        'Task assigned to you',
        `Task assigned to you: ${title} - due ${formatDateTimeInTz(dueDate, tz)}`,
        { actionId: saved.id, trigger: 'TASK_OPEN' },
      );
      this.eventEmitter.emit('automated.task.created', saved);
    } catch (error) {
      this.logger.error(`Failed to sync confirmation task for appointment ${appointmentId}: ${error?.message}`, error?.stack);
    }
  }

  /**
   * Safety net for every booking path (incl. edits that emit no event): makes sure each
   * upcoming active appointment has its one confirmation task at the right time and that
   * open confirmation tasks of cancelled/finished appointments are closed.
   */
  async reconcileConfirmationTasks(daysAhead = 60): Promise<{ synced: number }> {
    const now = new Date();
    const horizon = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    const ids = new Set<string>();

    const upcoming = await this.appointmentsRepository.find({
      select: ['id'],
      where: { startTime: Between(now, horizon), status: In(ACTIVE_STATUSES as AppointmentStatus[]) },
    });
    upcoming.forEach(a => ids.add(a.id));

    const openTasks = await this.crmActionsRepository
      .createQueryBuilder('action')
      .select(['action.id', 'action.relatedAppointmentId'])
      .where('action.status IN (:...open)', { open: OPEN_TASK_STATUSES })
      .andWhere("action.actionType = 'confirmation_call_reminder'")
      .andWhere('action.relatedAppointmentId IS NOT NULL')
      .getMany();
    openTasks.forEach(t => ids.add(t.relatedAppointmentId));

    for (const id of ids) {
      await this.syncConfirmationTask(id);
    }
    return { synced: ids.size };
  }

  async getOverdueTasks(salespersonId?: string): Promise<CrmAction[]> {
    const query = this.crmActionsRepository
      .createQueryBuilder('action')
      .where('action.status IN (:...open)', { open: OPEN_TASK_STATUSES })
      .andWhere('action.dueDate < :now', { now: new Date() })
      .leftJoinAndSelect('action.customer', 'customer');

    if (salespersonId) {
      query.andWhere('action.salespersonId = :salespersonId', { salespersonId });
    }

    return query.orderBy('action.dueDate', 'ASC').getMany();
  }

  async runTaskAutomationCheck(): Promise<{ tasksCreated: number; overdueTasks: number }> {
    const before = await this.crmActionsRepository.count({ where: { actionType: 'confirmation_call_reminder' } });
    try {
      await this.reconcileConfirmationTasks();
    } catch (error) {
      this.logger.error('Error during confirmation task reconciliation', error as any);
    }
    const after = await this.crmActionsRepository.count({ where: { actionType: 'confirmation_call_reminder' } });

    try {
      const remindersSent = await this.sendTaskReminders();
      this.logger.log(`Sent ${remindersSent} task reminders.`);
    } catch (error) {
      this.logger.error('Error during sendTaskReminders', error as any);
    }

    // Overdue is derived (open + dueDate < now); there is no 'overdue' status to write.
    const overdue = await this.getOverdueTasks();
    return { tasksCreated: Math.max(0, after - before), overdueTasks: overdue.length };
  }

  async sendTaskReminders(): Promise<number> {
    let remindersSent = 0;
    const now = new Date();

    const tasksToRemind = await this.crmActionsRepository.createQueryBuilder('action')
      .where('action.status IN (:...open)', { open: OPEN_TASK_STATUSES })
      .andWhere('action.reminderDate <= :now', { now })
      .andWhere("action.metadata->>'reminderSent' IS NULL")
      .andWhere('action.salespersonId IS NOT NULL')
      .getMany();

    for (const task of tasksToRemind) {
      try {
        await this.notificationsService.create(
          task.salespersonId,
          NotificationType.PUSH,
          'Task Reminder',
          `Reminder: Task "${task.title}" is due ${task.dueDate ? formatDateTimeInTz(task.dueDate, BUSINESS_TIMEZONE) : 'now'}.`,
          { actionId: task.id },
        );

        const metadata = task.metadata || {};
        metadata['reminderSent'] = true;
        await this.crmActionsRepository.update(task.id, { metadata });
        remindersSent++;
      } catch (e) {
        this.logger.error(`Failed to send reminder for task ${task.id}: ${e?.message}`);
      }
    }

    return remindersSent;
  }
}
