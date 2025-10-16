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

  @Column()
  providerId?: string; // Doctor/Practitioner

  @Column()
  clientId: string;

  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'timestamptz' })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
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

  @Column({ nullable: true })
  holdId: string; // Reference to temporary hold

  @Column('json', { nullable: true })
  treatmentDetails: any;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

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
}