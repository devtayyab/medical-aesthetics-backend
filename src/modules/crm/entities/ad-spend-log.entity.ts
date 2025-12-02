import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

@Entity({ name: 'ad_spend_logs' })
export class AdSpendLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  campaignId: string;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'int', default: 0 })
  clicks: number;

  @Column({ type: 'int', default: 0 })
  impressions: number;

  @Column({ type: 'int', default: 0 })
  leads: number;

  @CreateDateColumn()
  createdAt: Date;
}
