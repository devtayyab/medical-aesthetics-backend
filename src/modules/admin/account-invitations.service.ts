import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { AccountLinksService } from '../users/account-links.service';
import { EmailSuppressionService } from '../notifications/services/email-suppression.service';
import { isPlaceholderEmail } from '../notifications/utils/notification-format.util';
import { PlatformSettings } from './entities/platform-settings.entity';
import {
  INVITATION_MODE_KEY,
  INVITATION_TEST_EMAILS_KEY,
  InvitationSettings,
  parseInvitationSettings,
} from '../users/account-invitation-settings';

const MAX_PER_SEND = 50;

/** Customers without a password, and invitations sent by hand to the ones an admin selected. */
@Injectable()
export class AccountInvitationsService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(PlatformSettings) private readonly settingsRepository: Repository<PlatformSettings>,
    private readonly accountLinks: AccountLinksService,
    private readonly suppression: EmailSuppressionService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async list() {
    const rows: any[] = await this.usersRepository.query(`
      SELECT u.id, u."firstName", u."lastName", u.email, u.phone, u."invitationSentAt", u."emailBounced",
             COALESCE(u.profile::jsonb ->> 'disableNotifications', 'false') = 'true' AS "notificationsDisabled",
             COUNT(a.id)::int AS "appointmentCount",
             MAX(a."startTime") AS "lastAppointmentAt",
             COALESCE(BOOL_OR(a.notes ILIKE '%fresha%'), false) AS "fromFresha"
      FROM "users" u
      LEFT JOIN "appointments" a ON a."clientId" = u.id AND a.status <> 'DELETED'
      WHERE u.role = 'client' AND u."isActive" = true AND u."accountSetupPending" = true
      GROUP BY u.id
      ORDER BY u."lastName" NULLS LAST, u."firstName" NULLS LAST
    `);
    const suppressed = await this.suppression.filterSuppressedEmails(rows.map((r) => r.email).filter(Boolean));
    return rows.map(({ emailBounced, notificationsDisabled, ...r }) => {
      let blockedReason: string | null = null;
      if (isPlaceholderEmail(r.email)) blockedReason = 'no_valid_email';
      else if (emailBounced || suppressed.has(String(r.email).trim().toLowerCase())) blockedReason = 'email_bounced';
      else if (notificationsDisabled) blockedReason = 'notifications_disabled';
      return { ...r, blockedReason };
    });
  }

  async send(actorId: string, userIds: unknown, resend: boolean) {
    const ids: string[] = Array.isArray(userIds) ? [...new Set(userIds.filter((id) => typeof id === 'string' && id))] : [];
    if (ids.length === 0) throw new BadRequestException('Select at least one customer.');
    if (ids.length > MAX_PER_SEND) throw new BadRequestException(`Select up to ${MAX_PER_SEND} customers at a time.`);

    const users = await this.usersRepository.find({ where: { id: In(ids) } });
    const results: Array<{ userId: string; sent: boolean; reason?: string }> = [];
    for (const id of ids) {
      const user = users.find((u) => u.id === id);
      const result = user
        ? await this.accountLinks.deliverClientInvitation(user, { requestedBy: 'admin', resend })
        : { sent: false, reason: 'not_found' };
      results.push({ userId: id, ...result });
      if (result.sent) this.audit(actorId, 'ACCOUNT_INVITATION_SENT', id, { resend });
    }
    return { sent: results.filter((r) => r.sent).length, results };
  }

  getSettings(): Promise<InvitationSettings> {
    return this.accountLinks.getInvitationSettings();
  }

  async updateSettings(actorId: string, body: { mode?: unknown; testEmails?: unknown }): Promise<InvitationSettings> {
    if (!['off', 'test', 'on'].includes(String(body?.mode))) {
      throw new BadRequestException('mode must be off, test or on');
    }
    const before = await this.getSettings();
    const next = parseInvitationSettings(body.mode, body.testEmails ?? before.testEmails);
    await this.store(INVITATION_TEST_EMAILS_KEY, next.testEmails);
    await this.store(INVITATION_MODE_KEY, next.mode);
    this.audit(actorId, 'ACCOUNT_INVITATION_SETTINGS', null, { before, after: next });
    return next;
  }

  private async store(key: string, value: any) {
    const row =
      (await this.settingsRepository.findOne({ where: { key } })) ||
      this.settingsRepository.create({ key, category: 'notifications' });
    row.value = value;
    await this.settingsRepository.save(row);
  }

  private audit(userId: string, action: string, resourceId: string | null, data: any) {
    this.eventEmitter.emit('audit.log', { userId, action, resource: 'users', resourceId, data });
  }
}
