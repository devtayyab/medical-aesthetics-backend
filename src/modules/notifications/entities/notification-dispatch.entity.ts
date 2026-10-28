import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * Persistent "already sent" flag for one-off notifications (appointment reminders,
 * review requests). The unique `dispatchKey` (e.g. `reminder_24h:<appointmentId>`)
 * makes the send idempotent across restarts and multiple app instances: the row is
 * inserted first and only the instance that inserted it sends the notification.
 */
@Entity('notification_dispatch_log')
export class NotificationDispatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 200 })
  dispatchKey: string;

  @Column({ type: 'varchar', length: 60 })
  kind: string;

  @Column({ type: 'uuid', nullable: true })
  appointmentId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
