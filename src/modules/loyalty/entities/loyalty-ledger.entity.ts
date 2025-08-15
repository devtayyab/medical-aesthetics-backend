import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Clinic } from '../../clinics/entities/clinic.entity';

@Entity('loyalty_ledger')
export class LoyaltyLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clientId: string;

  @Column()
  clinicId: string;

  @Column()
  points: number; // Can be positive (earned) or negative (redeemed)

  @Column()
  transactionType: string; // 'earned', 'redeemed', 'expired', 'bonus'

  @Column('text', { nullable: true })
  description: string;

  @Column('json', { nullable: true })
  metadata: any;

  @Column({ nullable: true })
  appointmentId: string; // Reference to related appointment

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.loyaltyRecords)
  @JoinColumn({ name: 'clientId' })
  client: User;

  @ManyToOne(() => Clinic)
  @JoinColumn({ name: 'clinicId' })
  clinic: Clinic;
}