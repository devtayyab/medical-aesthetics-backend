import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('crm_actions')
export class CrmAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column()
  salespersonId: string;

  @Column({
    type: 'enum',
    enum: ['phone_call', 'follow_up', 'appointment_scheduled', 'email_sent', 'meeting', 'update', 'other'],
  })
  actionType: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'completed', 'cancelled', 'missed'],
    default: 'pending',
  })
  status: string;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  })
  priority: string;

  @Column({ type: 'timestamptz', nullable: true })
  dueDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  relatedAppointmentId: string;

  @Column({ nullable: true })
  relatedLeadId: string;

  @Column('json', { nullable: true })
  metadata: any; // Call outcome, notes, etc.

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'salespersonId' })
  salesperson: User;
}
