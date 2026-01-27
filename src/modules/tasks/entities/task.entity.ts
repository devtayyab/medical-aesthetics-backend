import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TaskStatus } from '../../../common/enums/task-status.enum';
import { TaskType } from '../../../common/enums/task-type.enum';
import { User } from '../../users/entities/user.entity';
import { Lead } from '../../crm/entities/lead.entity';
import { CustomerRecord } from '../../crm/entities/customer-record.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskType,
    default: TaskType.GENERAL,
  })
  type: TaskType;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @Column({ type: 'timestamptz' })
  dueDate: Date;

  @Column({ nullable: true })
  assigneeId: string;

  @Column({ nullable: true })
  customerId: string; // Lead ID

  @Column('json', { nullable: true })
  metadata: any;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => User, (user) => user.assignedTasks)
  @JoinColumn({ name: 'assigneeId' })
  assignee: User;

  @ManyToOne(() => Lead, (lead) => lead.tasks)
  @JoinColumn({ name: 'customerId' })
  customer: Lead;

  @Column({ nullable: true })
  customerRecordId: string;

  @ManyToOne(() => CustomerRecord)
  @JoinColumn({ name: 'customerRecordId' })
  customerRecord: CustomerRecord;
}