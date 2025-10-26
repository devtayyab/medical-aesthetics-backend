import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CustomerRecord } from './entities/customer-record.entity';
import { User } from '../users/entities/user.entity';
import { Appointment } from '../bookings/entities/appointment.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { AppointmentStatus } from '@/common/enums/appointment-status.enum';
import { CrmAction } from './entities/crm-action.entity';
import { UserRole } from '@/common/enums/user-role.enum';

export interface TaskAutomationRule {
  id: string;
  name: string;
  trigger: 'appointment_scheduled' | 'appointment_completed' | 'no_communication' | 'treatment_reminder';
  delayDays: number;
  actionType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  template: string;
  conditions?: any;
}

@Injectable()
export class TaskAutomationService {
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
  ) {}

  // Default automation rules
  private readonly defaultRules: TaskAutomationRule[] = [
    {
      id: 'appointment_confirmation_2days',
      name: 'Appointment Confirmation (2 days before)',
      trigger: 'appointment_scheduled',
      delayDays: -2, // 2 days before appointment
      actionType: 'appointment_confirmation',
      priority: 'high',
      template: 'Confirm appointment scheduled for {appointment_date} at {appointment_time}',
      conditions: { appointmentStatus: 'confirmed' },
    },
    {
      id: 'appointment_confirmation_1day',
      name: 'Appointment Confirmation (1 day before)',
      trigger: 'appointment_scheduled',
      delayDays: -1, // 1 day before appointment
      actionType: 'appointment_confirmation',
      priority: 'urgent',
      template: 'URGENT: Confirm appointment for tomorrow {appointment_date} at {appointment_time}',
      conditions: { appointmentStatus: 'confirmed' },
    },
    {
      id: 'post_appointment_followup',
      name: 'Post-Appointment Follow-up',
      trigger: 'appointment_completed',
      delayDays: 1,
      actionType: 'follow_up',
      priority: 'medium',
      template: 'Follow up after appointment on {appointment_date}. Check satisfaction and book next appointment.',
    },
    {
      id: 'no_communication_reminder',
      name: 'No Communication Reminder',
      trigger: 'no_communication',
      delayDays: 7,
      actionType: 'follow_up',
      priority: 'medium',
      template: 'No contact with customer for {days_since_contact} days. Time for follow-up call.',
    },
    {
      id: 'treatment_reminder_6months',
      name: 'Treatment Reminder (6 months)',
      trigger: 'treatment_reminder',
      delayDays: 180, // 6 months
      actionType: 'treatment_reminder',
      priority: 'medium',
      template: 'Reminder: Customer may be due for {treatment_type} treatment (last treatment: {last_treatment_date})',
    },
  ];

  async createAutomatedTasks(): Promise<void> {
    // Create appointment confirmation tasks (2 days before)
    await this.createAppointmentConfirmationTasks();

    // Create post-appointment follow-up tasks
    await this.createPostAppointmentFollowupTasks();

    // Create no-communication reminder tasks
    await this.createNoCommunicationReminderTasks();

    // Create treatment reminder tasks
    await this.createTreatmentReminderTasks();
  }

  private async createAppointmentConfirmationTasks(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);

    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Find appointments 2 days from now
    const appointmentsIn2Days = await this.appointmentsRepository.find({
      where: {
        startTime: Between(tomorrow, dayAfterTomorrow),
        status: AppointmentStatus.CONFIRMED,
      },
      relations: ['client'],
    });

    for (const appointment of appointmentsIn2Days) {
      await this.createTaskForAppointment(appointment, 'appointment_confirmation_2days');
    }

    // Find appointments 1 day from now (urgent)
    const appointmentsTomorrow = await this.appointmentsRepository.find({
      where: {
        startTime: Between(dayAfterTomorrow, new Date(dayAfterTomorrow.getTime() + 24 * 60 * 60 * 1000)),
        status: AppointmentStatus.CONFIRMED,
      },
      relations: ['client'],
    });

    for (const appointment of appointmentsTomorrow) {
      await this.createTaskForAppointment(appointment, 'appointment_confirmation_1day');
    }
  }

  private async createPostAppointmentFollowupTasks(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const today = new Date();

    // Find completed appointments from yesterday
    const completedAppointments = await this.appointmentsRepository.find({
      where: {
        startTime: Between(yesterday, today),
        status: AppointmentStatus.COMPLETED,
      },
      relations: ['client'],
    });

    for (const appointment of completedAppointments) {
      await this.createTaskForAppointment(appointment, 'post_appointment_followup');
    }
  }

  private async createNoCommunicationReminderTasks(): Promise<void> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find customer records with no communication in the last 7 days
    const customerRecordsNeedingContact = await this.customerRecordsRepository.find({
      where: {
        lastContactDate: LessThan(sevenDaysAgo),
      },
      relations: ['customer'],
    });

    // Also find customer records with no lastContactDate
    const customerRecordsWithoutContact = await this.customerRecordsRepository.find({
      where: {
        lastContactDate: null,
      },
      relations: ['customer'],
    });

    // Combine both results and filter for clients only
    const allRecordsNeedingContact = [...customerRecordsNeedingContact, ...customerRecordsWithoutContact];
    const customersNeedingContact = allRecordsNeedingContact
      .map(record => record.customer)
      .filter(customer => customer && customer.role === 'client')
      .filter((customer, index, self) => self.findIndex(c => c.id === customer.id) === index); // Remove duplicates

    for (const customer of customersNeedingContact) {
      // Check if task already exists for this customer
      const existingTask = await this.crmActionsRepository.findOne({
        where: {
          customerId: customer.id,
          actionType: 'follow_up',
          status: 'pending',
          metadata: { automationRule: 'no_communication_reminder' },
        },
      });

      if (!existingTask) {
        const rule = this.defaultRules.find(r => r.id === 'no_communication_reminder');
        if (rule) {
          // Find the customer record to get the lastContactDate
          const customerRecord = await this.customerRecordsRepository.findOne({
            where: { customerId: customer.id },
          });

          const daysSinceContact = Math.floor(
            (Date.now() - (customerRecord?.lastContactDate?.getTime() || 0)) / (1000 * 60 * 60 * 24),
          );

          await this.createAutomatedTask(
            customer.id,
            rule,
            {
              days_since_contact: daysSinceContact,
            },
          );
        }
      }
    }
  }

  private async createTreatmentReminderTasks(): Promise<void> {
    // This would typically be based on treatment history and types
    // For now, create a placeholder implementation
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Find customers who had treatments around 6 months ago
    // This is a simplified version - in reality, you'd want to check specific treatment types
    const customersForReminders = await this.usersRepository.find({
      where: {
        role: UserRole.CLIENT,
      },
      relations: ['clientAppointments'],
    });

    // Filter customers who have completed appointments older than 6 months
    const filteredCustomers = customersForReminders.filter(customer => {
      return customer.clientAppointments?.some(appointment =>
        appointment.startTime < sixMonthsAgo && appointment.status === 'completed'
      );
    });

    for (const customer of filteredCustomers) {
      const rule = this.defaultRules.find(r => r.id === 'treatment_reminder_6months');
      if (rule) {
        // Get the most recent treatment for this customer
        const lastAppointment = await this.appointmentsRepository.findOne({
          where: { clientId: customer.id },
          order: { startTime: 'DESC' },
          relations: ['service'],
        });

        if (lastAppointment) {
          await this.createAutomatedTask(
            customer.id,
            rule,
            {
              treatment_type: lastAppointment.service?.name || 'treatment',
              last_treatment_date: lastAppointment.startTime,
            },
          );
        }
      }
    }
  }

  private async createTaskForAppointment(appointment: Appointment, ruleId: string): Promise<void> {
    const rule = this.defaultRules.find(r => r.id === ruleId);
    if (!rule) return;

    // Check if task already exists
    const existingTask = await this.crmActionsRepository.findOne({
      where: {
        customerId: appointment.clientId,
        actionType: rule.actionType,
        status: 'pending',
        metadata: { appointmentId: appointment.id, automationRule: ruleId },
      },
    });

    if (!existingTask) {
      await this.createAutomatedTask(
        appointment.clientId,
        rule,
        {
          appointment_id: appointment.id,
          appointment_date: appointment.startTime,
          appointment_time: appointment.startTime,
          clinic_name: appointment.clinic?.name,
          service_name: appointment.service?.name,
        },
      );
    }
  }

  private async createAutomatedTask(
    customerId: string,
    rule: TaskAutomationRule,
    variables: any = {},
  ): Promise<CrmAction> {
    // Find assigned salesperson for this customer by querying CustomerRecord directly
    const customerRecord = await this.customerRecordsRepository.findOne({
      where: { customerId },
    });

    const salespersonId = customerRecord?.assignedSalespersonId;

    if (!salespersonId) {
      // If no assigned salesperson, assign to admin or skip
      console.warn(`No assigned salesperson for customer ${customerId}, skipping automated task`);
      return null;
    }

    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + rule.delayDays);

    // Replace template variables
    let title = rule.template;
    Object.keys(variables).forEach(key => {
      title = title.replace(new RegExp(`{${key}}`, 'g'), variables[key]);
    });

    const task = this.crmActionsRepository.create({
      customerId,
      salespersonId,
      actionType: rule.actionType,
      title,
      description: `Automated task created by rule: ${rule.name}`,
      status: 'pending',
      priority: rule.priority,
      dueDate,
      metadata: {
        automationRule: rule.id,
        createdBy: 'system',
        ...variables,
      },
    });

    const savedTask = await this.crmActionsRepository.save(task);

    // Send notification to salesperson
    await this.notificationsService.create(
      salespersonId,
      NotificationType.PUSH,
      'New Automated Task',
      `${title} - Due: ${dueDate.toLocaleDateString()}`,
      { taskId: savedTask.id, customerId },
    );

    this.eventEmitter.emit('automated.task.created', savedTask);

    return savedTask;
  }

  async getOverdueTasks(salespersonId?: string): Promise<CrmAction[]> {
    const query = this.crmActionsRepository
      .createQueryBuilder('action')
      .where('action.status = :status', { status: 'pending' })
      .andWhere('action.dueDate < :now', { now: new Date() })
      .leftJoinAndSelect('action.customer', 'customer');

    if (salespersonId) {
      query.andWhere('action.salespersonId = :salespersonId', { salespersonId });
    }

    return query.orderBy('action.dueDate', 'ASC').getMany();
  }

  async markTaskOverdue(taskId: string): Promise<void> {
    const task = await this.crmActionsRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.status === 'pending' && task.dueDate < new Date()) {
      task.status = 'overdue';
      await this.crmActionsRepository.save(task);

      // Send urgent notification
      await this.notificationsService.create(
        task.salespersonId,
        NotificationType.PUSH,
        'Task Overdue!',
        `Task "${task.title}" is now overdue!`,
        { taskId: task.id },
      );
    }
  }

  async getAutomationRules(): Promise<TaskAutomationRule[]> {
    return this.defaultRules;
  }

  async runTaskAutomationCheck(): Promise<{ tasksCreated: number; overdueTasks: number }> {
    let tasksCreated = 0;
    let overdueTasks = 0;

    // Create automated tasks
    await this.createAutomatedTasks();
    tasksCreated += await this.getRecentAutomatedTaskCount();

    // Mark overdue tasks
    const overdue = await this.getOverdueTasks();
    for (const task of overdue) {
      await this.markTaskOverdue(task.id);
      overdueTasks++;
    }

    return { tasksCreated, overdueTasks };
  }

  private async getRecentAutomatedTaskCount(): Promise<number> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    return this.crmActionsRepository.count({
      where: {
        metadata: { createdBy: 'system' },
        createdAt: MoreThan(oneHourAgo),
      },
    });
  }
}
