import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AdCampaign } from './ad-campaign.entity';
import { CustomerRecord } from './customer-record.entity';

@Entity('ad_attributions')
export class AdAttribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CustomerRecord, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerRecordId' })
  customerRecord: CustomerRecord;

  @Column({ type: 'uuid' })
  customerRecordId: string;

  @ManyToOne(() => AdCampaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'adCampaignId' })
  adCampaign: AdCampaign;

  @Column({ type: 'uuid' })
  adCampaignId: string;

  @Column({ type: 'timestamptz' })
  firstInteractionAt: Date;

  @Column({ type: 'timestamptz' })
  lastInteractionAt: Date;

  @Column({ type: 'int', default: 1 })
  interactionCount: number;

  @Column({ type: 'boolean', default: false })
  converted: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  convertedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper method to update interaction
  public recordInteraction(isConversion = false): void {
    this.lastInteractionAt = new Date();
    this.interactionCount += 1;
    
    if (isConversion && !this.converted) {
      this.converted = true;
      this.convertedAt = new Date();
    }
  }
}
