import { Injectable, NotFoundException } from '@nestjs/common';
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
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.tasksRepository.create({
      ...createTaskDto,
      dueDate: new Date(createTaskDto.dueDate),
    });
    
    const savedTask = await this.tasksRepository.save(task);
    
    // Emit event for notifications
    this.eventEmitter.emit('task.created', savedTask);
    
    return savedTask;
  }

  async findAll(filters: any = {}): Promise<Task[]> {
    const queryBuilder = this.tasksRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.customer', 'customer');

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

    return queryBuilder.orderBy('task.dueDate', 'ASC').getMany();
  }

  async findById(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['assignee', 'customer'],
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
    return this.tasksRepository.find({
      where: {
        status: TaskStatus.PENDING,
        dueDate: new Date(),
      },
      relations: ['assignee', 'customer'],
    });
  }
}