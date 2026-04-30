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
import { Clinic } from '../../clinics/entities/clinic.entity';
import { Appointment } from '../../bookings/entities/appointment.entity';

export enum PaymentMethod {
  CASH = 'cash',
  POS = 'pos',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  VIVA_WALLET = 'viva_wallet',
  ONLINE_DEPOSIT = 'online_deposit',
  GIFT_CARD = 'gift_card',
}

export enum PaymentType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  DEPOSIT = 'deposit',
  VOID = 'void',
}

export enum PaymentStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  VOIDED = 'voided',
}

@Entity('payment_records')
export class PaymentRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  appointmentId: string;

  @Column({ type: 'uuid' })
  clinicId: string;

  @Column({ type: 'uuid' })
  clientId: string;

  @Column({ type: 'uuid', nullable: true })
  providerId: string;

  @Column({ type: 'uuid', nullable: true })
  salespersonId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'EUR' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  method: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentType,
    default: PaymentType.PAYMENT,
  })
  type: PaymentType;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.COMPLETED,
  })
  status: PaymentStatus;

  @Column({ nullable: true })
  transactionReference: string;

  @Column('text', { nullable: true })
  notes: string;

  @Column('json', { nullable: true })
  metadata: any;

  @Column({ type: 'uuid', nullable: true })
  recordedById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Appointment)
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @ManyToOne(() => Clinic)
  @JoinColumn({ name: 'clinicId' })
  clinic: Clinic;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'clientId' })
  client: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'providerId' })
  provider: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'salespersonId' })
  salesperson: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recordedById' })
  recordedBy: User;
}
