import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { createHash } from 'crypto';
import { User } from './entities/user.entity';
import { PlatformSettings } from '../admin/entities/platform-settings.entity';
import {
  INVITATION_MODE_KEY,
  INVITATION_TEST_EMAILS_KEY,
  InvitationSettings,
  invitationAllowed,
  invitationBodyForAppointmentEmail,
  parseInvitationSettings,
} from './account-invitation-settings';
import { NotificationTemplate } from '../notifications/entities/notification-template.entity';
import { NotificationTrigger } from '../../common/enums/notification-trigger.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { MailService } from '../notifications/services/mail.service';
import { EmailSuppressionService } from '../notifications/services/email-suppression.service';
import { isPlaceholderEmail } from '../notifications/utils/notification-format.util';
import { resolveJwtSecret } from '../../common/utils/jwt-secret.util';

export type PasswordTokenPurpose = 'password_reset' | 'password_set';

export interface AccountInvitationOptions {
  appointmentDate?: string;
  clinicName?: string;
  clinicPhone?: string;
  disableNotifications?: boolean;
  /** Who asked for this email; leave out for automatic sends. */
  requestedBy?: 'admin' | 'customer';
  /** Admin only: send again although an invitation went out before. */
  resend?: boolean;
}

export interface InvitationResult {
  sent: boolean;
  reason?: string;
}

const CLIENT_SETUP_LINK_TTL = '30d';
const INVITATION_COOLDOWN_MS = 2 * 60 * 1000;

const DEFAULT_CLIENT_INVITATION_SUBJECT = 'Ο λογαριασμός σας στο Beauty Doctors';
const DEFAULT_CLIENT_INVITATION_CONTENT =
  'Καλησπέρα {{name}},\n\n' +
  'Με αφορμή το ραντεβού σας στις {{date}} στο {{clinic}}, δημιουργήσαμε έναν λογαριασμό για εσάς στη νέα πλατφόρμα του Beauty Doctors.\n\n' +
  'Μέσα από την πλατφόρμα μπορείτε να ανακαλύψετε όλες τις υπηρεσίες των συνεργαζόμενων κλινικών μας, να διαχειρίζεστε τα ραντεβού σας και να απολαμβάνετε αποκλειστικές προσφορές για τα μέλη μας.\n\n' +
  'Για να ενεργοποιήσετε τον λογαριασμό σας, ορίστε τον κωδικό σας από τον παρακάτω σύνδεσμο:\n\n' +
  '{{link}}\n\n' +
  '(Ο σύνδεσμος ισχύει για 30 ημέρες.)\n\n' +
  'Για οποιαδήποτε απορία, μη διστάσετε να επικοινωνήσετε μαζί μας στο {{phone}}.\n\n' +
  'Με εκτίμηση,\nΗ ομάδα Beauty Doctors';

/**
 * Signed, single-purpose links sent by email: email verification, password reset and
 * set-password (client invitations & staff setup).
 *
 * All emails are governed by NotificationTemplate rows in Settings -> Notifications
 * (ON/OFF toggle + editable content), strictly skip `noemail` / placeholder addresses,
 * and client invitations are sent at most once per customer (`users.invitationSentAt`).
 */
@Injectable()
export class AccountLinksService {
  private readonly logger = new Logger(AccountLinksService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly emailSuppressionService: EmailSuppressionService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(NotificationTemplate)
    private readonly templateRepository: Repository<NotificationTemplate>,
    @InjectRepository(PlatformSettings)
    private readonly settingsRepository: Repository<PlatformSettings>,
  ) {}

  private async isBlockedRecipient(user?: User | null): Promise<boolean> {
    if (!user?.email || user.emailBounced || isPlaceholderEmail(user.email)) return true;
    const check = await this.emailSuppressionService.isEmailSuppressed(user.email);
    return check.suppressed;
  }

  // Same secret the auth module uses for its default JwtService.
  private get secret(): string {
    return resolveJwtSecret('JWT_SECRET', 'JWT_ACCESS_SECRET');
  }

  get frontendUrl(): string {
    return (this.configService.get<string>('FRONTEND_URL') || 'https://beautydoctors.gr').replace(/\/$/, '');
  }

  passwordFingerprint(passwordHash?: string | null): string {
    return createHash('sha256').update(passwordHash || '').digest('hex').slice(0, 16);
  }

  signPasswordToken(user: User, purpose: PasswordTokenPurpose, expiresIn: string): string {
    return this.jwtService.sign(
      { sub: user.id, email: user.email, purpose, pwf: this.passwordFingerprint(user.passwordHash) },
      { secret: this.secret, expiresIn: expiresIn as any },
    );
  }

  verifyPasswordToken(token: string): { sub: string; email: string; purpose: PasswordTokenPurpose; pwf?: string } {
    let payload: any;
    try {
      payload = this.jwtService.verify(token, { secret: this.secret });
    } catch {
      throw new BadRequestException('This link has expired or is invalid. Please request a new one.');
    }
    if (!payload?.sub || (payload.purpose !== 'password_reset' && payload.purpose !== 'password_set')) {
      throw new BadRequestException('Invalid link.');
    }
    return payload;
  }

  signEmailVerifyToken(user: User): string {
    return this.jwtService.sign(
      { sub: user.id, email: user.email, purpose: 'email_verify' },
      { secret: this.secret, expiresIn: '3d' },
    );
  }

  verifyEmailToken(token: string): { sub: string; email: string } {
    let payload: any;
    try {
      payload = this.jwtService.verify(token, { secret: this.secret });
    } catch {
      throw new BadRequestException('This verification link has expired or is invalid. Please request a new one.');
    }
    if (!payload?.sub || payload.purpose !== 'email_verify') {
      throw new BadRequestException('Invalid verification link.');
    }
    return payload;
  }

  /** Short-lived token that ties step 2 of the login (email code) to step 1 (password). */
  signLoginChallenge(user: User): string {
    return this.jwtService.sign(
      { sub: user.id, purpose: 'login_challenge' },
      { secret: this.secret, expiresIn: '15m' },
    );
  }

  verifyLoginChallenge(token: string): { sub: string } {
    let payload: any;
    try {
      payload = this.jwtService.verify(token, { secret: this.secret });
    } catch {
      throw new BadRequestException('Your login session has expired. Please log in again.');
    }
    if (!payload?.sub || payload.purpose !== 'login_challenge') {
      throw new BadRequestException('Invalid login session. Please log in again.');
    }
    return payload;
  }

  private safeRedirect(redirect?: string): string | undefined {
    if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
      return redirect;
    }
    return undefined;
  }

  private renderTemplateText(template: string, context: Record<string, string>): string {
    return String(template || '').replace(/\{\{(.*?)\}\}/g, (_match, rawKey) => {
      const key = String(rawKey || '').trim();
      return context[key] !== undefined ? context[key] : '';
    });
  }

  private async loadEmailTemplate(
    trigger: NotificationTrigger,
  ): Promise<{ allowed: boolean; template: NotificationTemplate | null }> {
    try {
      const tpl = await this.templateRepository.findOne({
        where: { trigger, type: NotificationType.EMAIL },
      });
      if (tpl && !tpl.isActive) {
        return { allowed: false, template: tpl };
      }
      return { allowed: true, template: tpl };
    } catch (err: any) {
      this.logger.warn(`Could not load template ${trigger}: ${err?.message || err}`);
      return { allowed: true, template: null };
    }
  }

  async sendVerificationLink(user: User, redirect?: string): Promise<void> {
    if (await this.isBlockedRecipient(user)) return;
    const { allowed, template } = await this.loadEmailTemplate(NotificationTrigger.EMAIL_VERIFICATION);
    if (!allowed) return;

    const token = this.signEmailVerifyToken(user);
    const safe = this.safeRedirect(redirect);
    const url = `${this.frontendUrl}/verify-email?token=${encodeURIComponent(token)}${safe ? `&redirect=${encodeURIComponent(safe)}` : ''}`;
    const name = (user.firstName || '').trim();
    const ctx = { name, customerName: name, link: url };
    const subject = template?.subject
      ? this.renderTemplateText(template.subject, ctx)
      : 'Επιβεβαίωση email - Beauty Doctors';
    const text = template?.content
      ? this.renderTemplateText(template.content, ctx)
      : `Γεια σας ${name},\n\nΕπιβεβαιώστε το email σας: ${url}\n\nΟ σύνδεσμος ισχύει για 3 ημέρες.\n\nΜε εκτίμηση,\nΗ ομάδα Beauty Doctors`;
    const html = this.mailService.renderLinkEmail(subject, text, { url, label: 'Επιβεβαίωση email' });
    await this.safeSend(user.email, subject, text, html);
  }

  async sendPasswordResetLink(user: User): Promise<void> {
    if (await this.isBlockedRecipient(user)) return;
    const { allowed, template } = await this.loadEmailTemplate(NotificationTrigger.PASSWORD_RESET);
    if (!allowed) return;

    const token = this.signPasswordToken(user, 'password_reset', '1h');
    const url = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    if (template?.subject && template?.content) {
      const name = (user.firstName || '').trim();
      const ctx = { name, customerName: name, link: url };
      const subject = this.renderTemplateText(template.subject, ctx);
      const text = this.renderTemplateText(template.content, ctx);
      const html = this.mailService.renderLinkEmail(subject, text, { url, label: 'Ορισμός νέου κωδικού' });
      await this.safeSend(user.email, subject, text, html);
      return;
    }

    await this.mailService.sendPasswordResetEmail(user.email, url, user.firstName).catch((err: any) => {
      this.logger.error(`Failed to send password reset email to user ${user.id}: ${err?.message}`);
    });
  }

  /**
   * Sends the Greek "Set your password" invitation link.
   *
   * For clients:
   *  - Governed by the editable `ACCOUNT_INVITATION` template in Settings -> Notifications.
   *  - Never sent if `disableNotifications`, placeholder/`noemail` address, bulk-imported,
   *    or already sent once (`user.invitationSentAt` is set).
   *  - Records `user.invitationSentAt` when successfully sent.
   */
  async sendSetPasswordLink(
    user: User,
    context: 'client' | 'staff' = 'client',
    options: AccountInvitationOptions = {},
  ): Promise<boolean> {
    if (context === 'client') {
      return (await this.deliverClientInvitation(user, options)).sent;
    }

    if (await this.isBlockedRecipient(user)) {
      this.logger.debug(`Skipping set-password email for user ${user?.id}: missing, invalid/noemail, or bounced address`);
      return false;
    }

    // Staff setup link
    const { allowed, template } = await this.loadEmailTemplate(NotificationTrigger.STAFF_ACCOUNT_INVITATION);
    if (!allowed) return false;

    const url = this.setPasswordUrl(user, '7d');
    const name = `${user.firstName || ''}`.trim();
    const ctx = { name, customerName: name, link: url };
    const subject = template?.subject
      ? this.renderTemplateText(template.subject, ctx)
      : 'Ορισμός κωδικού προσωπικού - Beauty Doctors';
    const text = template?.content
      ? this.renderTemplateText(template.content, ctx)
      : `Γεια σας ${name},\n\nΔημιουργήθηκε λογαριασμός προσωπικού για εσάς στο Beauty Doctors. Ορίστε τον κωδικό σας από τον παρακάτω σύνδεσμο:\n\n${url}\n\nΟ σύνδεσμος ισχύει για 7 ημέρες και μπορεί να χρησιμοποιηθεί μία φορά.\n\nΜε εκτίμηση,\nΗ ομάδα Beauty Doctors`;
    const html = this.mailService.renderLinkEmail(subject, text, { url, label: 'Ορισμός κωδικού' });
    return this.safeSend(user.email, subject, text, html);
  }

  /**
   * Sends the ACCOUNT_INVITATION email with a new link. Says why when it was not sent.
   *  - automatic (no `requestedBy`): needs the template ON, at most once per customer
   *  - 'admin': an admin picked this customer; the template toggle does not matter
   *  - 'customer': the customer asked for it (tried to register / opened an expired link)
   */
  async deliverClientInvitation(user: User, options: AccountInvitationOptions = {}): Promise<InvitationResult> {
    if (await this.isBlockedRecipient(user)) return { sent: false, reason: 'no_valid_email' };
    const { requestedBy } = options;

    if (
      requestedBy !== 'customer' &&
      (options.disableNotifications || (user as any)?.profile?.disableNotifications === true)
    ) {
      return { sent: false, reason: 'notifications_disabled' };
    }
    if (!requestedBy && (user as any)?.profile?.bulkImported === true) {
      return { sent: false, reason: 'bulk_imported' };
    }

    const fresh = await this.usersRepository.findOne({ where: { id: user.id } });
    if (!fresh || !fresh.isActive || String(fresh.role).toLowerCase() !== 'client') {
      return { sent: false, reason: 'not_an_active_customer' };
    }
    if (requestedBy === 'admin' && !fresh.accountSetupPending) return { sent: false, reason: 'password_already_set' };
    if (fresh.invitationSentAt) {
      if (!requestedBy || (requestedBy === 'admin' && !options.resend)) return { sent: false, reason: 'already_sent' };
      // Public endpoints can trigger this: never flood a mailbox.
      const age = Date.now() - new Date(fresh.invitationSentAt).getTime();
      if (age < INVITATION_COOLDOWN_MS) return { sent: false, reason: 'just_sent' };
    }

    const { allowed, template } = await this.loadEmailTemplate(NotificationTrigger.ACCOUNT_INVITATION);
    if (!allowed && !requestedBy) return { sent: false, reason: 'template_off' };

    const url = this.setPasswordUrl(fresh, CLIENT_SETUP_LINK_TTL);
    const ctx = this.invitationContext(fresh, url, options);
    const subject = this.renderTemplateText(template?.subject || DEFAULT_CLIENT_INVITATION_SUBJECT, ctx);
    const text = this.renderTemplateText(this.prepareInvitationContent(template?.content, ctx), ctx);
    const html = this.mailService.renderLinkEmail(subject, text, { url, label: 'Ορισμός κωδικού' });

    if (!(await this.safeSend(fresh.email, subject, text, html))) return { sent: false, reason: 'send_failed' };
    await this.usersRepository.update(fresh.id, { invitationSentAt: new Date() });
    return { sent: true };
  }

  /** Every call signs a new token, so each email carries its own link. */
  private setPasswordUrl(user: User, expiresIn: string): string {
    const token = this.signPasswordToken(user, 'password_set', expiresIn);
    return `${this.frontendUrl}/set-password?token=${encodeURIComponent(token)}`;
  }

  private invitationContext(user: User, url: string, options: AccountInvitationOptions): Record<string, string> {
    const name = `${user.firstName || ''}`.trim() || 'πελάτη μας';
    const date = (options.appointmentDate || '').trim();
    const clinic = (options.clinicName || '').trim();
    return {
      name,
      customerName: name,
      date,
      appointmentDate: date,
      clinic,
      clinicName: clinic,
      link: url,
      phone: options.clinicPhone || this.configService.get<string>('SUPPORT_PHONE') || 'info@beautydoctors.gr',
    };
  }

  private prepareInvitationContent(content: string | undefined, ctx: Record<string, string>): string {
    // Templates already stored in the database still say 7 days.
    let raw = (content || DEFAULT_CLIENT_INVITATION_CONTENT).replace(/ισχύει για 7 ημέρες/g, 'ισχύει για 30 ημέρες');
    // Without an appointment, drop the "Με αφορμή το ραντεβού σας στις ... στο ..., " opening.
    if (!ctx.date || !ctx.clinic) {
      raw = raw.replace(
        /Με αφορμή το ραντεβού σας στις\s*\{\{date\}\}\s*στο\s*\{\{clinic\}\},?\s*(\S)/gi,
        (_match, first) => first.toLocaleUpperCase('el'),
      );
    }
    return raw;
  }

  async getInvitationSettings(): Promise<InvitationSettings> {
    const rows = await this.settingsRepository.find({
      where: { key: In([INVITATION_MODE_KEY, INVITATION_TEST_EMAILS_KEY]) },
    });
    const value = (key: string) => rows.find((r) => r.key === key)?.value;
    return parseInvitationSettings(value(INVITATION_MODE_KEY), value(INVITATION_TEST_EMAILS_KEY));
  }

  async isAutomaticInvitationAllowed(email?: string | null): Promise<boolean> {
    return invitationAllowed(await this.getInvitationSettings(), email);
  }

  /**
   * Invitation section for the bottom of an appointment email, with a new personal link; null
   * when switched off or when the customer already has a password.
   */
  async buildAppointmentEmailInvitation(
    user: User | null | undefined,
    options: AccountInvitationOptions = {},
  ): Promise<{ text: string; url: string } | null> {
    if (!user?.id || !user.accountSetupPending || !user.isActive) return null;
    if (String(user.role || '').toLowerCase() !== 'client') return null;
    if (!user.email || isPlaceholderEmail(user.email)) return null;
    if (!(await this.isAutomaticInvitationAllowed(user.email))) return null;
    const { template } = await this.loadEmailTemplate(NotificationTrigger.ACCOUNT_INVITATION);
    const url = this.setPasswordUrl(user, CLIENT_SETUP_LINK_TTL);
    const ctx = this.invitationContext(user, url, options);
    const body = invitationBodyForAppointmentEmail(this.prepareInvitationContent(template?.content, ctx));
    return { text: this.renderTemplateText(body, ctx), url };
  }

  /** Signature check only: lets the owner of an EXPIRED set-password link ask for a new one. */
  verifyExpiredSetupToken(token: string): { sub: string; email: string } | null {
    try {
      const payload: any = this.jwtService.verify(token, { secret: this.secret, ignoreExpiration: true });
      return payload?.sub && payload.purpose === 'password_set' ? payload : null;
    } catch {
      return null;
    }
  }

  async sendLoginCode(user: User, code: string): Promise<void> {
    if (await this.isBlockedRecipient(user)) return;
    const { allowed, template } = await this.loadEmailTemplate(NotificationTrigger.LOGIN_CODE);
    if (!allowed) return;

    const name = `${user.firstName || ''}`.trim();
    const ctx = { name, customerName: name, code };
    const subject = template?.subject
      ? this.renderTemplateText(template.subject, ctx)
      : `${code} - Κωδικός σύνδεσης - Beauty Doctors`;
    const text = template?.content
      ? this.renderTemplateText(template.content, ctx)
      : `Ο κωδικός σύνδεσής σας είναι: ${code}\n\nΙσχύει για 10 λεπτά. Αν δεν προσπαθήσατε να συνδεθείτε, αλλάξτε τον κωδικό σας.`;
    const html = this.mailService.renderLayout(
      'Κωδικός σύνδεσης',
      `<p style="text-align:center;font-size:32px;font-weight:800;letter-spacing:8px;color:#0f172a;margin:16px 0">${code}</p>${this.mailService.textToHtml(text)}`,
    );
    await this.safeSend(user.email, subject, text, html);
  }

  private async safeSend(to: string, subject: string, text: string, html: string): Promise<boolean> {
    try {
      const res = await this.mailService.sendMail(to, subject, text, html);
      return Boolean(res?.messageId);
    } catch (err: any) {
      // No subject or address in logs: the login-code subject contains the code itself.
      this.logger.error(`Failed to send an account email: ${err?.message}`);
      return false;
    }
  }
}
