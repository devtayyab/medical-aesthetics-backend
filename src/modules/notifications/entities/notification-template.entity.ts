import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { NotificationType } from '../../../common/enums/notification-type.enum';
import { NotificationTrigger } from '../../../common/enums/notification-trigger.enum';

@Entity('notification_templates')
@Index(['trigger', 'type'], { unique: true })
export class NotificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationTrigger,
  })
  trigger: NotificationTrigger;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType; // Strictly EMAIL or PUSH based on user request

  @Column()
  subject: string; // Used for email or push title

  @Column('text')
  content: string; // The template content with placeholders like {{customerName}}

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
