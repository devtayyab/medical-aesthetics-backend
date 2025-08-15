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
import { Appointment } from '../../bookings/entities/appointment.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  durationMinutes: number;

  @Column({ nullable: true })
  category: string;

  @Column('json', { nullable: true })
  metadata: any;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  clinicId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Clinic, (clinic) => clinic.services)
  @JoinColumn({ name: 'clinicId' })
  clinic: Clinic;

  @OneToMany(() => Appointment, (appointment) => appointment.service)
  appointments: Appointment[];
}