import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('rewards')
export class Reward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('int')
  pointsCost: number; // Points required to redeem

  @Column({ type: 'enum', enum: ['discount', 'free_service', 'product', 'upgrade'], default: 'discount' })
  rewardType: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  value: number; // Monetary value or discount amount

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  tier: string; // 'bronze', 'silver', 'gold', 'platinum' - minimum tier required

  @Column('int', { nullable: true })
  stockQuantity: number; // Available quantity (null = unlimited)

  @Column('int', { default: 0 })
  redeemedCount: number; // Total times redeemed

  @Column('json', { nullable: true })
  applicableServices: string[]; // Service IDs this reward applies to

  @Column('json', { nullable: true })
  applicableClinics: string[]; // Clinic IDs this reward applies to

  @Column({ type: 'date', nullable: true })
  expiryDate: Date; // When this reward expires

  @Column('text', { nullable: true })
  termsAndConditions: string;

  @Column({ nullable: true })
  imageUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
