import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('form_submissions')
export class FormSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  source: string; // 'facebook_ads', 'google_ads', 'website', etc.

  @Column()
  formType: string; // 'interest', 'booking', 'callback', etc.

  @Column({ nullable: true })
  mergedCustomerId: string; // User ID if merged with existing customer

  @Column({ nullable: true })
  leadId: string; // Lead ID if created as new lead

  // Raw data from form (before merge)
  @Column()
  rawName: string;

  @Column()
  rawEmail: string;

  @Column({ nullable: true })
  rawPhone: string;

  @Column('jsonb', { nullable: true })
  formData: any; // Complete form data including ad metadata

  @Column({ type: 'timestamptz' })
  submittedAt: Date;

  @Column({ default: false })
  isDuplicate: boolean; // True if merged with existing customer

  @Column({ nullable: true })
  duplicateMatchedBy: string; // 'phone', 'email', 'both'

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'mergedCustomerId' })
  mergedCustomer: User;
}
