import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  code: string; // Promo code

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  discountAmount: number;

  @Column('int', { nullable: true })
  discountPercentage: number;

  @Column({ type: 'enum', enum: ['percentage', 'fixed_amount', 'free_service'], default: 'percentage' })
  discountType: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  targetAudience: string; // 'all', 'new_clients', 'returning_clients', 'vip'

  @Column('int', { nullable: true })
  usageLimit: number; // Max number of times this offer can be used

  @Column('int', { default: 0 })
  usageCount: number; // Current usage count

  @Column('json', { nullable: true })
  applicableServices: string[]; // Service IDs this offer applies to

  @Column('json', { nullable: true })
  applicableClinics: string[]; // Clinic IDs this offer applies to

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  minPurchaseAmount: number;

  @Column('text', { nullable: true })
  termsAndConditions: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
