import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Tag } from '../../admin/entities/tag.entity';

@Entity('customer_tags')
export class CustomerTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column()
  tagId: string;

  @Column({ nullable: true })
  addedBy: string; // Salesperson who added the tag

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @ManyToOne(() => Tag)
  @JoinColumn({ name: 'tagId' })
  tag: Tag;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'addedBy' })
  addedByUser: User;
}
