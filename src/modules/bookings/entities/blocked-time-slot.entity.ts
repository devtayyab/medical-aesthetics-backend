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

@Entity('blocked_time_slots')
export class BlockedTimeSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clinicId: string;

  @Column({ nullable: true })
  providerId?: string; // If null, applies to all providers in clinic

  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'timestamptz' })
  endTime: Date;

  @Column('text', { nullable: true })
  reason: string; // Why the time is blocked (e.g., "Doctor unavailable", "Lunch break")

  @Column({ nullable: true })
  blockedById: string; // User who blocked this time

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Clinic)
  @JoinColumn({ name: 'clinicId' })
  clinic: Clinic;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'providerId' })
  provider: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'blockedById' })
  blockedBy: User;
}
