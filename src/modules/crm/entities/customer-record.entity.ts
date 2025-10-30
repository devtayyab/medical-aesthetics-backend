import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CommunicationLog } from './communication-log.entity';
import { CustomerTag } from './customer-tag.entity';
import { CrmAction } from './crm-action.entity';

@Entity('customer_records')
export class CustomerRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string; // User ID (client)

  @Column({ nullable: true })
  assignedSalespersonId: string;

  @Column({
    type: 'enum',
    enum: ['new', 'contacted', 'qualified', 'active', 'inactive', 'vip'],
    default: 'new',
  })
  customerStatus: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  lifetimeValue: number; // Total amount spent

  @Column('int', { default: 0 })
  totalAppointments: number;

  @Column('int', { default: 0 })
  completedAppointments: number;

  @Column('int', { default: 0 })
  cancelledAppointments: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastAppointmentDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  nextAppointmentDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastContactDate: Date;

  @Column('int', { nullable: true })
  averageDaysBetweenVisits: number;

  @Column('json', { nullable: true })
  preferences: any; // Preferred services, times, etc.

  @Column('json', { nullable: true })
  treatmentHistory: any[]; // Summary of treatments received

  @Column({ nullable: true })
  preferredClinicId: string;

  @Column({ nullable: true })
  preferredDoctorId: string;

  @Column('json', { nullable: true })
  clinicHistory: any[]; // Array of clinic affiliations with treatment details

  @Column('json', { nullable: true })
  doctorHistory: any[]; // Array of doctor affiliations with treatment details

  @Column({ nullable: true })
  lastClinicId: string; // Most recent clinic visited

  @Column({ nullable: true })
  lastDoctorId: string; // Most recent doctor seen

  @Column('json', { nullable: true })
  treatmentPreferences: any; // Preferred treatments per clinic/doctor

  @Column({ default: false })
  isRepeatCustomer: boolean;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  repeatCount: string

  @Column({ type: 'date', nullable: true })
  expectedNextVisit: Date; // Predicted next visit based on patterns

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;


  @ManyToOne(() => User)
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assignedSalespersonId' })
  assignedSalesperson: User;

  @OneToMany(() => CommunicationLog, (log) => log.customer)
  communications: CommunicationLog[];


  @OneToMany(() => CustomerTag, (tag) => tag.customer)
  tags: CustomerTag[];


}

