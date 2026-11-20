import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { EmailBounce } from '../entities/email-bounce.entity';
import { User } from '../../users/entities/user.entity';
import { isPlaceholderEmail } from '../utils/notification-format.util';

export interface BounceRecordInput {
  bounceType?: string;
  bounceSubType?: string | null;
  reason?: string | null;
  source?: string;
  diagnosticCode?: string | null;
  bouncedAt?: Date;
}

const SNS_CERT_URL_RE = /^https:\/\/sns\.[a-z0-9-]+\.amazonaws\.com(\.cn)?\/[a-zA-Z0-9._/-]+\.pem$/;
const SNS_SUBSCRIBE_URL_RE = /^https:\/\/sns\.[a-z0-9-]+\.amazonaws\.com(\.cn)?\//;

/**
 * Central email suppression & bounce tracking service.
 *
 * Responsibilities:
 * 1. Blocks all placeholder / `noemail` / bounced addresses before any email is dispatched.
 * 2. Processes AWS SES -> SNS webhooks (auto-confirming SubscriptionConfirmation, recording
 *    SES Bounces & Complaints on both `email_bounces` and matching `users` profiles).
 * 3. Records synchronous SES / SMTP 5xx permanent rejections immediately.
 * 4. Clears / re-syncs bounce state when a customer's email is updated or manually cleared by admin.
 */
@Injectable()
export class EmailSuppressionService {
  private readonly logger = new Logger(EmailSuppressionService.name);
  private readonly certCache = new Map<string, string>();

  constructor(
    @InjectRepository(EmailBounce)
    private readonly bounceRepository: Repository<EmailBounce>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  normalize(email?: string | null): string | null {
    if (!email || typeof email !== 'string') return null;
    const trimmed = email.trim().toLowerCase();
    return trimmed || null;
  }

  /**
   * Returns whether an email address must NOT receive any outgoing email.
   * Covers both `noemail`/`placeholder` addresses and previously bounced/complained addresses.
   */
  async isEmailSuppressed(email?: string | null): Promise<{ suppressed: boolean; reason?: string }> {
    if (isPlaceholderEmail(email)) {
      return { suppressed: true, reason: 'placeholder_or_noemail' };
    }
    const normalized = this.normalize(email);
    if (!normalized) {
      return { suppressed: true, reason: 'missing_email' };
    }

    try {
      const bounce = await this.bounceRepository.findOne({
        where: { email: normalized },
        select: ['email', 'bounceType', 'reason'],
      });
      if (bounce) {
        return { suppressed: true, reason: bounce.reason || `bounced:${bounce.bounceType}` };
      }

      // Fallback check directly on users table in case a row was flagged without email_bounces entry
      const bouncedUser = await this.userRepository
        .createQueryBuilder('u')
        .select(['u.id', 'u.emailBounced', 'u.emailBounceReason'])
        .where('LOWER(u.email) = :email', { email: normalized })
        .andWhere('u."emailBounced" = true')
        .getOne();

      if (bouncedUser) {
        return { suppressed: true, reason: bouncedUser.emailBounceReason || 'user_email_bounced' };
      }
    } catch (err: any) {
      // Never crash mail flow on a transient lookup hiccup, just log and allow
      this.logger.warn(`Bounce lookup failed for ${normalized}: ${err?.message || err}`);
    }

    return { suppressed: false };
  }

  /**
   * Returns a Set of normalized emails from the input list that are currently suppressed.
   */
  async filterSuppressedEmails(emails: Array<string | null | undefined>): Promise<Set<string>> {
    const suppressed = new Set<string>();
    const candidates: string[] = [];

    for (const raw of emails) {
      const norm = this.normalize(raw);
      if (!norm || isPlaceholderEmail(norm)) {
        if (norm) suppressed.add(norm);
        continue;
      }
      candidates.push(norm);
    }

    const unique = [...new Set(candidates)];
    if (unique.length === 0) return suppressed;

    try {
      const rows = await this.bounceRepository
        .createQueryBuilder('b')
        .select(['b.email'])
        .where('b.email IN (:...emails)', { emails: unique })
        .getMany();
      for (const r of rows) {
        if (r.email) suppressed.add(r.email.toLowerCase());
      }

      const bouncedUsers = await this.userRepository
        .createQueryBuilder('u')
        .select(['u.email'])
        .where('LOWER(u.email) IN (:...emails)', { emails: unique })
        .andWhere('u."emailBounced" = true')
        .getMany();
      for (const u of bouncedUsers) {
        if (u.email) suppressed.add(u.email.toLowerCase());
      }
    } catch (err: any) {
      this.logger.warn(`Bulk bounce lookup failed: ${err?.message || err}`);
    }

    return suppressed;
  }

  /**
   * Records a bounced or complained email address in `email_bounces` AND marks all matching
   * user profile(s) so staff see the bounce warning directly on the customer profile.
   */
  async recordBounce(email: string, info: BounceRecordInput = {}): Promise<void> {
    const normalized = this.normalize(email);
    if (!normalized) return;

    const bounceType = (info.bounceType || 'Permanent').slice(0, 64);
    const bounceSubType = info.bounceSubType ? String(info.bounceSubType).slice(0, 120) : null;
    const diagnosticCode = info.diagnosticCode ? String(info.diagnosticCode).slice(0, 1000) : null;
    const reason =
      (info.reason ||
        diagnosticCode ||
        [bounceType, bounceSubType].filter(Boolean).join(' / ') ||
        'Email bounced').slice(0, 1000);
    const source = (info.source || 'ses_sns').slice(0, 64);
    const bouncedAt = info.bouncedAt instanceof Date && !isNaN(info.bouncedAt.getTime())
      ? info.bouncedAt
      : new Date();

    try {
      await this.bounceRepository.save(
        this.bounceRepository.create({
          email: normalized,
          bounceType,
          bounceSubType,
          reason,
          source,
          diagnosticCode,
          bouncedAt,
        }),
      );

      await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set({
          emailBounced: true,
          emailBouncedAt: bouncedAt,
          emailBounceReason: reason,
          emailBounceType: bounceType,
        } as any)
        .where('LOWER(email) = :email', { email: normalized })
        .execute();

      this.logger.warn(
        `Recorded email bounce for ${normalized} [${bounceType}${bounceSubType ? `/${bounceSubType}` : ''}] via ${source}: ${reason}`,
      );
    } catch (err: any) {
      this.logger.error(`Failed to record bounce for ${normalized}: ${err?.message || err}`);
    }
  }

  /**
   * Inspects a synchronous SES / SMTP send error and records a bounce if it represents
   * a permanent recipient address rejection (5xx invalid user/mailbox/domain).
   * Explicitly ignores transient throttling, auth failures, and AWS SES sandbox errors.
   */
  async recordSynchronousSendError(email: string, error: any, source: 'ses_sync' | 'smtp_sync'): Promise<boolean> {
    const normalized = this.normalize(email);
    if (!normalized || isPlaceholderEmail(normalized) || !error) return false;

    const msg = String(error?.message || error?.response || '');
    const code = Number(error?.responseCode || error?.statusCode || 0);
    const errName = String(error?.name || error?.Code || '');

    // Never treat sender/server misconfig or throttling as a recipient bounce
    if (
      /not verified|sandbox|throttl|rate exceeded|daily sending quota|authentication|invalid login|credentials|access denied|535\b/i.test(
        msg,
      )
    ) {
      return false;
    }

    const isPermanentSmtpRecipientError =
      (code === 550 || code === 551 || code === 552 || code === 553 || code === 554) &&
      /user unknown|no such user|does not exist|mailbox unavailable|mailbox not found|recipient address rejected|invalid recipient|unknown user|address rejected|bad destination|relaying denied|undeliverable|account disabled|blacklisted|suppressed/i.test(
        msg,
      );

    const isPermanentSesAddressError =
      (errName === 'MessageRejected' || errName === 'InvalidParameterValue' || code === 400) &&
      /address is blacklisted|suppressed|invalid.*address|illegal address|missing final '@domain'|domain contains|local address contains/i.test(
        msg,
      );

    if (!isPermanentSmtpRecipientError && !isPermanentSesAddressError) {
      return false;
    }

    await this.recordBounce(normalized, {
      bounceType: source === 'smtp_sync' ? 'SMTP_5xx' : 'SES_Rejected',
      bounceSubType: code ? String(code) : errName || null,
      reason: msg.slice(0, 500),
      diagnosticCode: msg.slice(0, 1000),
      source,
    });
    return true;
  }

  /**
   * Re-syncs a user's bounce columns when their email changes:
   * - If the new email is NOT in `email_bounces`, clears bounce flags on the user.
   * - If the new email IS already in `email_bounces`, copies that bounce status onto the user.
   */
  async syncUserEmailBounceStatus(userId: string, newEmail?: string | null): Promise<void> {
    const normalized = this.normalize(newEmail);
    if (!normalized || isPlaceholderEmail(normalized)) {
      await this.userRepository.update(userId, {
        emailBounced: false,
        emailBouncedAt: null,
        emailBounceReason: null,
        emailBounceType: null,
      } as any);
      return;
    }

    const existing = await this.bounceRepository.findOne({ where: { email: normalized } });
    if (existing) {
      await this.userRepository.update(userId, {
        emailBounced: true,
        emailBouncedAt: existing.bouncedAt,
        emailBounceReason: existing.reason,
        emailBounceType: existing.bounceType,
      } as any);
    } else {
      await this.userRepository.update(userId, {
        emailBounced: false,
        emailBouncedAt: null,
        emailBounceReason: null,
        emailBounceType: null,
      } as any);
    }
  }

  /**
   * Admin action: manually clear a bounce flag on a customer profile and remove the address
   * from the global `email_bounces` suppression list so emails can resume.
   */
  async clearBounceForUser(userId: string): Promise<{ success: boolean; email: string | null }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const normalized = this.normalize(user.email);
    if (normalized) {
      await this.bounceRepository.delete({ email: normalized });
      await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set({
          emailBounced: false,
          emailBouncedAt: null,
          emailBounceReason: null,
          emailBounceType: null,
        } as any)
        .where('LOWER(email) = :email', { email: normalized })
        .execute();
    } else {
      await this.userRepository.update(user.id, {
        emailBounced: false,
        emailBouncedAt: null,
        emailBounceReason: null,
        emailBounceType: null,
      } as any);
    }

    this.logger.log(`Cleared email bounce suppression for user ${userId} (${normalized || 'no email'})`);
    return { success: true, email: normalized };
  }

  async listRecentBounces(limit = 100): Promise<EmailBounce[]> {
    return this.bounceRepository.find({
      order: { bouncedAt: 'DESC' },
      take: Math.min(Math.max(Number(limit) || 100, 1), 500),
    });
  }

  async getBounceByEmail(email?: string | null): Promise<EmailBounce | null> {
    const normalized = this.normalize(email);
    if (!normalized) return null;
    return this.bounceRepository.findOne({ where: { email: normalized } });
  }

  // ---------------------------------------------------------------------------
  // AWS SES -> SNS Webhook Processing
  // ---------------------------------------------------------------------------

  private buildSnsCanonicalString(payload: Record<string, any>): string {
    const type = payload.Type;
    const keys =
      type === 'Notification'
        ? ['Message', 'MessageId', 'Subject', 'Timestamp', 'TopicArn', 'Type']
        : ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'];

    let str = '';
    for (const key of keys) {
      if (payload[key] !== undefined && payload[key] !== null) {
        str += `${key}\n${payload[key]}\n`;
      }
    }
    return str;
  }

  private async fetchSigningCert(certUrl: string): Promise<string> {
    if (!SNS_CERT_URL_RE.test(certUrl)) {
      throw new BadRequestException('Invalid SNS SigningCertURL');
    }
    const cached = this.certCache.get(certUrl);
    if (cached) return cached;

    const res = await fetch(certUrl);
    if (!res.ok) {
      throw new BadRequestException(`Failed to fetch SNS signing certificate (HTTP ${res.status})`);
    }
    const pem = await res.text();
    if (!pem.includes('BEGIN CERTIFICATE')) {
      throw new BadRequestException('Invalid PEM certificate returned by SNS SigningCertURL');
    }
    if (this.certCache.size > 20) {
      this.certCache.clear();
    }
    this.certCache.set(certUrl, pem);
    return pem;
  }

  private async verifySnsSignature(payload: Record<string, any>): Promise<boolean> {
    const certUrl = String(payload?.SigningCertURL || '');
    const signature = String(payload?.Signature || '');
    if (!certUrl || !signature) return false;

    const pem = await this.fetchSigningCert(certUrl);
    const algo = String(payload.SignatureVersion) === '2' ? 'RSA-SHA256' : 'RSA-SHA1';
    const verifier = crypto.createVerify(algo);
    verifier.update(this.buildSnsCanonicalString(payload), 'utf8');
    return verifier.verify(pem, signature, 'base64');
  }

  async processSnsWebhook(rawPayload: any): Promise<{ status: string; processed?: number }> {
    let payload: any = rawPayload;
    if (typeof rawPayload === 'string') {
      try {
        payload = JSON.parse(rawPayload);
      } catch {
        throw new BadRequestException('Invalid JSON payload');
      }
    } else if (Buffer.isBuffer(rawPayload)) {
      try {
        payload = JSON.parse(rawPayload.toString('utf8'));
      } catch {
        throw new BadRequestException('Invalid JSON buffer payload');
      }
    }

    if (!payload || typeof payload !== 'object' || !payload.Type) {
      throw new BadRequestException('Missing SNS message Type');
    }

    // Optional TopicArn allow-list if configured in env
    const allowedTopicArn = this.configService.get<string>('AWS_SNS_SES_TOPIC_ARN');
    if (allowedTopicArn && payload.TopicArn && payload.TopicArn !== allowedTopicArn) {
      this.logger.warn(`Rejected SNS webhook from unexpected TopicArn: ${payload.TopicArn}`);
      throw new BadRequestException('Unexpected SNS TopicArn');
    }

    // Cryptographically verify authentic AWS SNS signature
    const verified = await this.verifySnsSignature(payload);
    if (!verified) {
      this.logger.warn(`Rejected SNS webhook with invalid signature (Type=${payload.Type})`);
      throw new BadRequestException('Invalid SNS signature');
    }

    // 1. Auto-confirm AWS SNS HTTPS Subscription
    if (payload.Type === 'SubscriptionConfirmation') {
      const subscribeUrl = String(payload.SubscribeURL || '');
      if (!SNS_SUBSCRIBE_URL_RE.test(subscribeUrl)) {
        throw new BadRequestException('Invalid SNS SubscribeURL');
      }
      const res = await fetch(subscribeUrl);
      if (!res.ok) {
        this.logger.error(`Failed to confirm SNS subscription (HTTP ${res.status})`);
        throw new BadRequestException('SNS subscription confirmation failed');
      }
      this.logger.log(`Auto-confirmed AWS SNS subscription for topic ${payload.TopicArn}`);
      return { status: 'subscription_confirmed' };
    }

    if (payload.Type === 'UnsubscribeConfirmation') {
      this.logger.warn(`Received AWS SNS UnsubscribeConfirmation for topic ${payload.TopicArn}`);
      return { status: 'unsubscribed' };
    }

    if (payload.Type !== 'Notification') {
      return { status: 'ignored' };
    }

    // 2. Parse inner SES notification JSON
    let sesMessage: any = payload.Message;
    if (typeof sesMessage === 'string') {
      try {
        sesMessage = JSON.parse(sesMessage);
      } catch {
        this.logger.log(`Received non-JSON SNS notification: ${String(payload.Message).slice(0, 120)}`);
        return { status: 'ignored' };
      }
    }

    // Support both SES Identity notifications (`notificationType`) and Configuration Set events (`eventType`)
    const eventType = String(sesMessage?.notificationType || sesMessage?.eventType || '');

    if (eventType === 'Bounce' && sesMessage?.bounce) {
      const bounce = sesMessage.bounce;
      const bounceType = String(bounce.bounceType || 'Permanent');
      const bounceSubType = String(bounce.bounceSubType || '');
      const timestamp = bounce.timestamp ? new Date(bounce.timestamp) : new Date();

      // Skip harmless out-of-office / auto-responder transient notices
      if (
        bounceType === 'Transient' &&
        /outofoffice|autoreply|contentrejected/i.test(bounceSubType)
      ) {
        this.logger.log(`Ignoring non-fatal transient bounce (${bounceSubType})`);
        return { status: 'ignored_transient', processed: 0 };
      }

      const recipients = Array.isArray(bounce.bouncedRecipients) ? bounce.bouncedRecipients : [];
      let processed = 0;
      for (const r of recipients) {
        const addr = r?.emailAddress;
        if (!addr) continue;
        const diag = r?.diagnosticCode || null;
        const reason = diag
          ? `${bounceType}${bounceSubType ? ` (${bounceSubType})` : ''}: ${diag}`
          : `${bounceType}${bounceSubType ? ` (${bounceSubType})` : ''} bounce`;

        await this.recordBounce(addr, {
          bounceType,
          bounceSubType: bounceSubType || null,
          reason,
          diagnosticCode: diag,
          source: 'ses_sns',
          bouncedAt: timestamp,
        });
        processed++;
      }

      return { status: 'bounce_recorded', processed };
    }

    if (eventType === 'Complaint' && sesMessage?.complaint) {
      const complaint = sesMessage.complaint;
      const feedbackType = String(complaint.complaintFeedbackType || 'abuse');
      const timestamp = complaint.timestamp ? new Date(complaint.timestamp) : new Date();
      const recipients = Array.isArray(complaint.complainedRecipients) ? complaint.complainedRecipients : [];

      let processed = 0;
      for (const r of recipients) {
        const addr = r?.emailAddress;
        if (!addr) continue;
        await this.recordBounce(addr, {
          bounceType: 'Complaint',
          bounceSubType: feedbackType,
          reason: `Recipient spam complaint (${feedbackType})`,
          source: 'ses_sns',
          bouncedAt: timestamp,
        });
        processed++;
      }

      return { status: 'complaint_recorded', processed };
    }

    return { status: 'ignored', processed: 0 };
  }
}
