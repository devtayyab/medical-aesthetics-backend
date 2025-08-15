import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('appointment_holds')
export class AppointmentHold {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clinicId: string;

  @Column()
  serviceId: string;

  @Column()
  providerId: string;

  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'timestamptz' })
  endTime: Date;

  @Column({ type: 'timestamptz' })
  expiresAt: Date; // Usually 15 minutes from creation

  @Column({ nullable: true })
  clientId: string;

  @CreateDateColumn()
  createdAt: Date;
}