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
import { Clinic } from './clinic.entity';
import { Treatment } from './treatment.entity';
import { Appointment } from '../../bookings/entities/appointment.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  durationMinutes: number;

  @Column('json', { nullable: true })
  metadata: any;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  clinicId: string;

  @Column()
  treatmentId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Clinic, (clinic) => clinic.services)
  @JoinColumn({ name: 'clinicId' })
  clinic: Clinic;

  @ManyToOne(() => Treatment, (treatment) => treatment.offerings)
  @JoinColumn({ name: 'treatmentId' })
  treatment: Treatment;

  @OneToMany(() => Appointment, (appointment) => appointment.service)
  appointments: Appointment[];
}