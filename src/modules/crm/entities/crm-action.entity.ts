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

@Entity('crm_actions')
export class CrmAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Customer relation
  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => CustomerRecord, customerRecord => customerRecord.actions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customerRecord: CustomerRecord;

  // Salesperson relation
  @Column({ type: 'uuid' })
  salespersonId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'salespersonId' })
  salesperson: User;

  // Action type
  @Column({
    type: 'enum',
    enum: ['phone_call', 'email', 'follow_up', 'appointment_confirmation', 'meeting', 'treatment_reminder'],
  })
  actionType: string;

  // Title
  @Column()
  title: string;

  // Optional description
  @Column({ type: 'text', nullable: true })
  description?: string;

  // Status
  @Column({
    type: 'enum',
    enum: ['pending', 'completed', 'cancelled', 'missed'],
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

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  // Optional relations
  @Column({ type: 'uuid', nullable: true })
  relatedAppointmentId?: string;

  @Column({ type: 'uuid', nullable: true })
  relatedLeadId?: string;

  // Mandatory fields for phone_call actions
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
