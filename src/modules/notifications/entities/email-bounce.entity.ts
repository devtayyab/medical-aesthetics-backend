import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Global suppression list of email addresses that generated a hard bounce or spam complaint
 * (recorded via AWS SES -> SNS webhook or synchronous SES/SMTP 5xx rejections).
 * Any email present here is permanently skipped across all outgoing email paths unless an
 * administrator explicitly clears it.
 */
@Entity('email_bounces')
export class EmailBounce {
  /** Normalized lowercase email address */
  @PrimaryColumn({ type: 'varchar', length: 320 })
  email: string;

  /** Permanent | Undetermined | Transient | Complaint | SMTP_5xx | SES_Rejected */
  @Column({ type: 'varchar', length: 64, default: 'Permanent' })
  bounceType: string;

  /** e.g. General, NoEmail, Suppressed, MailboxFull, abuse, etc. */
  @Column({ type: 'varchar', length: 120, nullable: true })
  bounceSubType: string | null;

  /** Human-readable bounce reason / SMTP diagnostic */
  @Column({ type: 'text', nullable: true })
  reason: string | null;

  /** ses_sns | ses_sync | smtp_sync | manual */
  @Column({ type: 'varchar', length: 64, default: 'ses_sns' })
  source: string;

  /** Raw diagnostic code reported by remote MTA / SES */
  @Column({ type: 'text', nullable: true })
  diagnosticCode: string | null;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  bouncedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
