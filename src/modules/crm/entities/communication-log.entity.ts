import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('communication_logs')
export class CommunicationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string; // Can be Lead ID or User ID (client)

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

  @Column('text')
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

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'salespersonId' })
  salesperson: User;
}
