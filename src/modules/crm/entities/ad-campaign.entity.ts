import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'ad_campaigns' })
export class AdCampaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 50 })
  platform: 'facebook' | 'google' | 'tiktok' | 'other';

  @Column({ type: 'varchar', length: 255 })
  channel: string; // More descriptive channel name

  @Index()
  @Column({ type: 'varchar', length: 255 })
  externalId: string; // e.g., Facebook Campaign ID

  @Index()
  @Column({ type: 'uuid', nullable: true })
  ownerAgentId: string | null; // salesperson/owner responsible

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  budget: number;

  @Column({ type: 'timestamptz', nullable: true })
  startDate: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endDate: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
