import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { LeadStatus } from '../../../common/enums/lead-status.enum';
import { User } from '../../users/entities/user.entity';
import { Tag } from '../../admin/entities/tag.entity';
import { Task } from '../../tasks/entities/task.entity';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  source: string; // 'facebook_ads', 'google_ads', 'referral', etc.

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  facebookLeadId: string; // Facebook's unique lead ID

  @Column({ nullable: true })
  facebookFormId: string; // Facebook form ID

  @Column({ nullable: true })
  facebookCampaignId: string; // Facebook campaign ID

  @Column({ nullable: true })
  facebookAdSetId: string; // Facebook ad set ID

  @Column({ nullable: true })
  facebookAdId: string; // Facebook ad ID

  @Column('json', { nullable: true })
  facebookLeadData: any; // Raw lead data from Facebook

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: LeadStatus,
    default: LeadStatus.NEW,
    nullable: false,
  })
  status: LeadStatus;

  @Column('text', { nullable: true })
  notes: string;

  @Column({ nullable: true })
  assignedSalesId: string;

  @Column('json', { nullable: true })
  metadata: any; // Additional data from ads/webhooks

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  estimatedValue: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastContactedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  convertedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => User, (user) => user.assignedLeads)
  @JoinColumn({ name: 'assignedSalesId' })
  assignedSales: User;

  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'lead_tags',
    joinColumn: { name: 'leadId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: Tag[];

  @OneToMany(() => Task, (task) => task.customer)
  tasks: Task[];

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}