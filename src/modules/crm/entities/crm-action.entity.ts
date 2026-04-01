import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CustomerRecord } from './customer-record.entity';
import { Lead } from './lead.entity';

@Entity('crm_actions')
export class CrmAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Customer relation
  @Column({ type: 'uuid', nullable: true })
  customerId: string;

  @ManyToOne(() => CustomerRecord, customer => customer.actions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: CustomerRecord;

  // Salesperson relation
  @Column({ type: 'uuid' })
  salespersonId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'salespersonId' })
  salesperson: User;

  // Action type
  @Column({
    type: 'enum',
    enum: ['call', 'mobile_message', 'follow_up_call', 'email', 'appointment', 'confirmation_call_reminder', 'satisfaction_check', 'complaint'],
  })
  actionType: string;

  @Column({ nullable: true })
  therapy?: string;

  // Title
  @Column()
  title: string;

  // Optional description
  @Column({ type: 'text', nullable: true })
  description?: string;

  // Status
  @Column({
    type: 'enum',
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'missed'],
    default: 'pending',
  })
  status: string;

  // Priority
  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  })
  priority: string;

  // Optional timestamps
  @Column({ type: 'timestamptz', nullable: true })
  dueDate?: Date;

  @Column({ type: 'timestamptz', nullable: false })
  reminderDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  // Recurrence logic
  @Column({ default: false })
  isRecurring: boolean;

  @Column({
    type: 'enum',
    enum: ['daily', 'weekly', 'monthly', 'custom'],
    nullable: true,
  })
  recurrenceType?: string;

  @Column({ type: 'integer', nullable: true })
  recurrenceInterval?: number; // for custom/interval based

  @Column({ type: 'uuid', nullable: true })
  originalTaskId?: string;

  // Optional relations
  @Column({ type: 'uuid', nullable: true })
  relatedAppointmentId?: string;

  @Column({ type: 'uuid', nullable: true })
  relatedLeadId?: string;

  @ManyToOne(() => Lead, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'relatedLeadId' })
  relatedLead: Lead;

  // Mandatory fields for call actions
  @Column({ nullable: true })
  clinic?: string;

  @Column({ nullable: true })
  proposedTreatment?: string;

  @Column({
    type: 'enum',
    enum: ['successful', 'failed', 'pending'],
    nullable: true,
  })
  callOutcome?: string;

  // Optional cost
  @Column({ type: 'numeric', nullable: true })
  cost?: number;

  // Optional metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
