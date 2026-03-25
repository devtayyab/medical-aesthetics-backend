import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';
import { User } from '../../users/entities/user.entity';
import { Clinic } from '../../clinics/entities/clinic.entity';
import { Service } from '../../clinics/entities/service.entity';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clinicId: string;

  @Column()
  serviceId: string;

  @Column({ type: 'uuid', nullable: true })
  providerId?: string | null; // Doctor/Practitioner

  @Column()
  clientId: string;

  @Column('json', { nullable: true })
  clientDetails: {
    fullName: string;
    email: string;
    phone: string;
  };

  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'timestamptz' })
  endTime: Date;

  @Column({
    type: 'varchar',
    length: 50,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column('text', { nullable: true })
  notes: string;

  @Column({ nullable: true })
  paymentMethod: string; // 'cash', 'card', 'bank_transfer', etc.

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  advancePaymentAmount: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  totalAmount: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  amountPaid: number; // For turnover

  @Column({ nullable: true })
  holdId: string; // Reference to temporary hold

  @Column('json', { nullable: true })
  treatmentDetails: any;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'uuid', nullable: true })
  cancelledById: string;

  @Column({ type: 'timestamptz', nullable: true })
  noShowMarkedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  noShowMarkedById: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'platform_broker',
  })
  appointmentSource: 'clinic_own' | 'platform_broker';

  @Column({
    type: 'enum',
    enum: ['showed_up', 'no_show', 'pending'],
    nullable: true,
  })
  showStatus?: 'showed_up' | 'no_show' | 'pending'; // Patient attendance status

  @Column({ default: false })
  serviceExecuted: boolean; // Whether the service was actually performed

  @Column({ nullable: true })
  followUpServiceId?: string; // Next service appointment (renewal)

  @Column('text', { nullable: true })
  clinicNotes?: string; // Notes from clinic about the appointment

  @Column({ type: 'uuid', nullable: true })
  bookedById: string;

  @Column('json', { nullable: true })
  appointmentCompletionReport?: {
    patientCame: boolean;
    servicePerformed: string;
    amountPaid: number;
    renewalDate?: Date;
    notes?: string;
    recordedAt: Date;
    recordedById: string;
  };

  @Column({ type: 'boolean', default: false })
  isReturned: boolean; // True if client had a previous COMPLETED appointment before this one

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Clinic, (clinic) => clinic.appointments)
  @JoinColumn({ name: 'clinicId' })
  clinic: Clinic;

  @ManyToOne(() => Service, (service) => service.appointments)
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @ManyToOne(() => User, (user) => user.providerAppointments)
  @JoinColumn({ name: 'providerId' })
  provider: User;

  @ManyToOne(() => User, (user) => user.clientAppointments)
  @JoinColumn({ name: 'clientId' })
  client: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'bookedById' })
  bookedBy: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'cancelledById' })
  cancelledBy: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'noShowMarkedById' })
  noShowMarkedBy: User;
}