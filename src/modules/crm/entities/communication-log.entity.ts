import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Lead } from './lead.entity';

@Entity('communication_logs')
export class CommunicationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  customerId?: string;

  @Column({ type: 'uuid', nullable: true })
  relatedLeadId?: string;

  @Column()
  salespersonId: string;

  @Column({
    type: 'enum',
    enum: ['call', 'email', 'sms', 'whatsapp', 'meeting', 'note'],
    enumName: 'communication_logs_type_enum',
  })
  type: string;

  @Column({
    type: 'enum',
    enum: ['outgoing', 'incoming', 'missed'],
    nullable: true,
    enumName: 'communication_logs_direction_enum',
  })
  direction: string;

  @Column({
    type: 'enum',
    enum: ['completed', 'missed', 'no_answer', 'voicemail', 'scheduled', 'cancelled'],
    default: 'completed',
    enumName: 'communication_logs_status_enum',
  })
  status: string;

  @Column('text', { nullable: true })
  subject: string;

  @Column('text', { nullable: true })
  notes: string;

  @Column('int', { nullable: true })
  durationSeconds: number; // For calls

  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt: Date; // For scheduled follow-ups

  @Column('json', { nullable: true })
  metadata: any; // Additional data (recording URL, email thread ID, etc.)

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @ManyToOne(() => Lead, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'relatedLeadId' })
  relatedLead: Lead;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'salespersonId' })
  salesperson: User;
}
