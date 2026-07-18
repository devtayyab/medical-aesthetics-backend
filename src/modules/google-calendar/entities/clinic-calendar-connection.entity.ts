import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Clinic } from '../../clinics/entities/clinic.entity';

export type CalendarConnectionStatus = 'connected' | 'error' | 'disconnected';

/**
 * One Google Calendar connection per clinic. Stores the clinic's OAuth
 * refresh/access tokens (encrypted at rest), the dedicated calendar we sync
 * into, the incremental sync cursor, and the push-notification (watch) channel
 * metadata used for real-time inbound sync.
 */
@Entity('clinic_calendar_connections')
export class ClinicCalendarConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  clinicId: string;

  @Column({ type: 'varchar', length: 20, default: 'google' })
  provider: string;

  // The Google account email that authorized the connection (for display only).
  @Column({ nullable: true })
  googleAccountEmail: string;

  // The Google calendar the clinic chose to sync (both directions).
  // Null until the clinic selects one after connecting.
  @Column({ nullable: true })
  calendarId: string;

  // Human-readable name of the selected calendar (for display in the UI).
  @Column({ nullable: true })
  calendarSummary: string;

  // Encrypted OAuth tokens (AES-256-GCM). Never serialized in API responses.
  @Exclude()
  @Column({ type: 'text', nullable: true })
  refreshTokenEnc: string;

  @Exclude()
  @Column({ type: 'text', nullable: true })
  accessTokenEnc: string;

  @Column({ type: 'timestamptz', nullable: true })
  tokenExpiry: Date;

  // Incremental sync cursor returned by Google events.list — advanced on each sync.
  @Exclude()
  @Column({ type: 'text', nullable: true })
  syncToken: string;

  // Push-notification (watch) channel metadata for real-time inbound sync.
  @Column({ nullable: true })
  watchChannelId: string;

  @Column({ nullable: true })
  watchResourceId: string;

  // Secret token echoed back by Google on every push; used to authenticate webhooks.
  @Exclude()
  @Column({ nullable: true })
  watchToken: string;

  @Column({ type: 'timestamptz', nullable: true })
  watchExpiration: Date;

  @Column({ type: 'varchar', length: 20, default: 'connected' })
  status: CalendarConnectionStatus;

  @Column({ default: true })
  syncEnabled: boolean;

  @Column({ type: 'text', nullable: true })
  lastError: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Clinic)
  @JoinColumn({ name: 'clinicId' })
  clinic: Clinic;
}
