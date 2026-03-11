import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from '../../common/enums/task-status.enum';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private eventEmitter: EventEmitter2,
  ) { }

  private validateReminderAndDueDates(reminderAt: Date, dueDate: Date) {
    if (!reminderAt) {
      throw new BadRequestException('Reminder time (reminderAt) is required for all tasks');
    }

    const now = new Date();
    const maxReminderDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    if (reminderAt > maxReminderDate) {
      throw new BadRequestException('Reminder time cannot be more than 1 year in the future');
    }

    if (reminderAt > dueDate) {
      throw new BadRequestException('Reminder time cannot be after the task due date');
    }
  }

  private validateRecurringConfig(dto: CreateTaskDto | UpdateTaskDto) {
    if (dto.isRecurring) {
      if (!dto.recurringIntervalDays) {
        throw new BadRequestException('Recurring tasks must have recurringIntervalDays set');
      }
    }
  }

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const dueDate = new Date(createTaskDto.dueDate);
    const reminderAt = new Date(createTaskDto.reminderAt);

    this.validateReminderAndDueDates(reminderAt, dueDate);
    this.validateRecurringConfig(createTaskDto);

    const task = this.tasksRepository.create({
      ...createTaskDto,
      reminderAt,
      dueDate,
    });

    const savedTask = await this.tasksRepository.save(task);

    // Emit event for notifications
    this.eventEmitter.emit('task.created', savedTask);

    return savedTask;
  }

  async findAll(filters: any = {}): Promise<Task[]> {
    const queryBuilder = this.tasksRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.customer', 'customer')
      .leftJoinAndSelect('task.customerRecord', 'customerRecord');

    if (filters.assigneeId) {
      queryBuilder.where('task.assigneeId = :assigneeId', {
        assigneeId: filters.assigneeId,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('task.status = :status', { status: filters.status });
    }

    if (filters.type) {
      queryBuilder.andWhere('task.type = :type', { type: filters.type });
    }

    if (filters.dueDateFrom) {
      queryBuilder.andWhere('task.dueDate >= :dueDateFrom', {
        dueDateFrom: filters.dueDateFrom,
      });
    }

    if (filters.dueDateTo) {
      queryBuilder.andWhere('task.dueDate <= :dueDateTo', {
        dueDateTo: filters.dueDateTo,
      });
    }

    if (filters.overdueOnly) {
      queryBuilder.andWhere('task.status = :pendingStatus', {
        pendingStatus: TaskStatus.PENDING,
      });
      queryBuilder.andWhere('task.dueDate < NOW()');
    }

    queryBuilder
      .orderBy(
        "CASE WHEN task.status = :pendingStatus AND task.dueDate < NOW() THEN 0 ELSE 1 END",
        'ASC',
      )
      .addOrderBy('task.dueDate', 'ASC')
      .setParameter('pendingStatus', TaskStatus.PENDING);

    return queryBuilder.getMany();
  }

  async findById(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['assignee', 'customer', 'customerRecord'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findById(id);

    const updateData: any = { ...updateTaskDto };

    if (updateTaskDto.dueDate) {
      updateData.dueDate = new Date(updateTaskDto.dueDate);
    }

    if (updateTaskDto.reminderAt || updateTaskDto.dueDate) {
      const newDueDate = updateTaskDto.dueDate
        ? new Date(updateTaskDto.dueDate)
        : task.dueDate;
      const newReminderAt = updateTaskDto.reminderAt
        ? new Date(updateTaskDto.reminderAt)
        : task.reminderAt;

      this.validateReminderAndDueDates(newReminderAt, newDueDate);
      updateData.reminderAt = newReminderAt;
    }

    this.validateRecurringConfig(updateTaskDto);

    // Check for status changes
    if (updateTaskDto.status && updateTaskDto.status !== task.status) {
      if (updateTaskDto.status === TaskStatus.COMPLETED) {
        updateData.completedAt = new Date();
      }

      this.eventEmitter.emit('task.status.changed', {
        task,
        oldStatus: task.status,
        newStatus: updateTaskDto.status,
      });
    }

    await this.tasksRepository.update(id, updateData);
    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.tasksRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Task not found');
    }
  }

  async findOverdueTasks(): Promise<Task[]> {
    const now = new Date();

    return this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.customer', 'customer')
      .where('task.status = :status', { status: TaskStatus.PENDING })
      .andWhere('task.dueDate < :now', { now })
      .orderBy('task.dueDate', 'ASC')
      .getMany();
  }
}