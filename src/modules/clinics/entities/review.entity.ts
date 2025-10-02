import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Clinic } from './clinic.entity';
import { User } from '../../users/entities/user.entity';
import { Appointment } from '../../bookings/entities/appointment.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clinicId: string;

  @Column()
  clientId: string;

  @Column({ nullable: true })
  appointmentId: string;

  @Column('int')
  rating: number; // 1-5

  @Column('text', { nullable: true })
  comment: string;

  @Column({ default: true })
  isVisible: boolean;

  @Column({ nullable: true })
  response: string; // Clinic's response to the review

  @Column({ nullable: true })
  respondedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Clinic)
  @JoinColumn({ name: 'clinicId' })
  clinic: Clinic;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'clientId' })
  client: User;

  @ManyToOne(() => Appointment, { nullable: true })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;
}
