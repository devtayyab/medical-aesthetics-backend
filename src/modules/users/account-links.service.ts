import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { User } from './entities/user.entity';
import { NotificationTemplate } from '../notifications/entities/notification-template.entity';
import { NotificationTrigger } from '../../common/enums/notification-trigger.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { MailService } from '../notifications/services/mail.service';
import { isPlaceholderEmail } from '../notifications/utils/notification-format.util';
import { resolveJwtSecret } from '../../common/utils/jwt-secret.util';

export type PasswordTokenPurpose = 'password_reset' | 'password_set';

export interface AccountInvitationOptions {
  appointmentDate?: string;
  clinicName?: string;
  clinicPhone?: string;
  disableNotifications?: boolean;
  force?: boolean;
}

const DEFAULT_CLIENT_INVITATION_SUBJECT = 'Ο λογαριασμός σας στο Beauty Doctors';
const DEFAULT_CLIENT_INVITATION_CONTENT =
  'Καλησπέρα {{name}},\n\n' +
  'Με αφορμή το ραντεβού σας στις {{date}} στο {{clinic}}, δημιουργήσαμε έναν λογαριασμό για εσάς στη νέα πλατφόρμα του Beauty Doctors.\n\n' +
  'Μέσα από την πλατφόρμα μπορείτε να ανακαλύψετε όλες τις υπηρεσίες των συνεργαζόμενων κλινικών μας, να διαχειρίζεστε τα ραντεβού σας και να απολαμβάνετε αποκλειστικές προσφορές για τα μέλη μας.\n\n' +
  'Για να ενεργοποιήσετε τον λογαριασμό σας, ορίστε τον κωδικό σας από τον παρακάτω σύνδεσμο:\n\n' +
  '{{link}}\n\n' +
  '(Ο σύνδεσμος ισχύει για 7 ημέρες.)\n\n' +
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
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(NotificationTemplate)
    private readonly templateRepository: Repository<NotificationTemplate>,
  ) {}

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
    if (!user?.email || isPlaceholderEmail(user.email)) return;
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
    const html = this.mailService.renderLayout(
      subject,
      this.mailService.textToHtml(text.replace(url, '').trim()),
      { url, label: 'Επιβεβαίωση email' },
    );
    await this.safeSend(user.email, subject, text, html);
  }

  async sendPasswordResetLink(user: User): Promise<void> {
    if (!user?.email || isPlaceholderEmail(user.email)) return;
    const { allowed, template } = await this.loadEmailTemplate(NotificationTrigger.PASSWORD_RESET);
    if (!allowed) return;

    const token = this.signPasswordToken(user, 'password_reset', '1h');
    const url = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    if (template?.subject && template?.content) {
      const name = (user.firstName || '').trim();
      const ctx = { name, customerName: name, link: url };
      const subject = this.renderTemplateText(template.subject, ctx);
      const text = this.renderTemplateText(template.content, ctx);
      const html = this.mailService.renderLayout(
        subject,
        this.mailService.textToHtml(text.replace(url, '').trim()),
        { url, label: 'Ορισμός νέου κωδικού' },
      );
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
    if (!user?.email || isPlaceholderEmail(user.email)) {
      this.logger.debug(`Skipping set-password email for user ${user?.id}: missing or invalid/noemail address`);
      return false;
    }

    if (context === 'client') {
      if (options.disableNotifications || (user as any)?.profile?.disableNotifications === true) {
        this.logger.debug(`Skipping client invitation for user ${user.id}: notifications disabled`);
        return false;
      }
      if ((user as any)?.profile?.bulkImported === true) {
        this.logger.debug(`Skipping client invitation for user ${user.id}: bulk-imported customer`);
        return false;
      }

      // Reload latest invitationSentAt from DB so concurrent requests can never send twice.
      const freshUser = await this.usersRepository.findOne({
        where: { id: user.id },
        select: ['id', 'invitationSentAt', 'isActive'] as any,
      });
      if (!freshUser || !freshUser.isActive) return false;
      if (freshUser.invitationSentAt && !options.force) {
        this.logger.debug(`Skipping client invitation for user ${user.id}: already sent at ${freshUser.invitationSentAt.toISOString()}`);
        return false;
      }

      const { allowed, template } = await this.loadEmailTemplate(NotificationTrigger.ACCOUNT_INVITATION);
      if (!allowed) {
        this.logger.debug(`Skipping client invitation for user ${user.id}: ACCOUNT_INVITATION template is OFF`);
        return false;
      }

      const token = this.signPasswordToken(user, 'password_set', '7d');
      const url = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(token)}&setup=1`;
      const name = `${user.firstName || ''}`.trim() || 'πελάτη μας';
      const supportPhone =
        options.clinicPhone ||
        this.configService.get<string>('SUPPORT_PHONE') ||
        'info@beautydoctors.gr';
      const apptDate = (options.appointmentDate || '').trim();
      const clinicName = (options.clinicName || '').trim();

      const ctx: Record<string, string> = {
        name,
        customerName: name,
        date: apptDate,
        appointmentDate: apptDate,
        clinic: clinicName,
        clinicName,
        link: url,
        phone: supportPhone,
      };

      const rawSubject = template?.subject || DEFAULT_CLIENT_INVITATION_SUBJECT;
      let rawContent = template?.content || DEFAULT_CLIENT_INVITATION_CONTENT;

      // When sent without an appointment context (e.g. direct online self-registration),
      // remove the empty "Με αφορμή το ραντεβού σας στις {{date}} στο {{clinic}}, " prefix cleanly.
      if (!apptDate || !clinicName) {
        rawContent = rawContent.replace(
          /Με αφορμή το ραντεβού σας στις\s*\{\{date\}\}\s*στο\s*\{\{clinic\}\},?\s*/gi,
          '',
        );
      }

      const subject = this.renderTemplateText(rawSubject, ctx);
      const text = this.renderTemplateText(rawContent, ctx);
      const htmlBody = this.mailService.textToHtml(text.replace(url, '').replace(/\n{3,}/g, '\n\n').trim());
      const html = this.mailService.renderLayout(subject, htmlBody, {
        url,
        label: 'Ορισμός κωδικού',
      });

      const sent = await this.safeSend(user.email, subject, text, html);
      if (sent) {
        await this.usersRepository.update(user.id, { invitationSentAt: new Date() });
      }
      return sent;
    }

    // Staff setup link
    const { allowed, template } = await this.loadEmailTemplate(NotificationTrigger.STAFF_ACCOUNT_INVITATION);
    if (!allowed) return false;

    const token = this.signPasswordToken(user, 'password_set', '7d');
    const url = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(token)}&setup=1`;
    const name = `${user.firstName || ''}`.trim();
    const ctx = { name, customerName: name, link: url };
    const subject = template?.subject
      ? this.renderTemplateText(template.subject, ctx)
      : 'Ορισμός κωδικού προσωπικού - Beauty Doctors';
    const text = template?.content
      ? this.renderTemplateText(template.content, ctx)
      : `Γεια σας ${name},\n\nΔημιουργήθηκε λογαριασμός προσωπικού για εσάς στο Beauty Doctors. Ορίστε τον κωδικό σας από τον παρακάτω σύνδεσμο:\n\n${url}\n\nΟ σύνδεσμος ισχύει για 7 ημέρες και μπορεί να χρησιμοποιηθεί μία φορά.\n\nΜε εκτίμηση,\nΗ ομάδα Beauty Doctors`;
    const html = this.mailService.renderLayout(
      subject,
      this.mailService.textToHtml(text.replace(url, '').replace(/\n{3,}/g, '\n\n').trim()),
      { url, label: 'Ορισμός κωδικού' },
    );
    return this.safeSend(user.email, subject, text, html);
  }

  async sendLoginCode(user: User, code: string): Promise<void> {
    if (!user?.email || isPlaceholderEmail(user.email)) return;
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
