import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { User } from './entities/user.entity';
import { MailService } from '../notifications/services/mail.service';
import { resolveJwtSecret } from '../../common/utils/jwt-secret.util';

export type PasswordTokenPurpose = 'password_reset' | 'password_set';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

/**
 * Signed, single-purpose links sent by email: email verification, password reset and
 * set-password (accounts created by staff or approved staff requests).
 *
 * Password links carry a fingerprint of the current password hash, so a link stops
 * working as soon as the password changes (single use).
 */
@Injectable()
export class AccountLinksService {
  private readonly logger = new Logger(AccountLinksService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
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

  private layout(title: string, paragraphs: string[], buttonLabel?: string, url?: string): string {
    const body = paragraphs.map((p) => `<p style="font-size:14px;line-height:1.6;color:#475569;margin:0 0 16px">${p}</p>`).join('');
    const button = url && buttonLabel
      ? `<p style="text-align:center;margin:28px 0"><a href="${url}" style="display:inline-block;background:#0f172a;color:#CBFF38;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:800;font-size:13px">${buttonLabel}</a></p>
         <p style="font-size:12px;color:#64748b;word-break:break-all">${url}</p>`
      : '';
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f8fafc;padding:24px;color:#1e293b">
<div style="max-width:540px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px">
<h1 style="font-size:20px;color:#0f172a;margin:0 0 16px">${title}</h1>${body}${button}
<p style="font-size:11px;color:#94a3b8;margin-top:24px">BeautyDoctors</p></div></body></html>`;
  }

  async sendVerificationLink(user: User, redirect?: string): Promise<void> {
    if (!user.email) return;
    const token = this.signEmailVerifyToken(user);
    const safe = this.safeRedirect(redirect);
    const url = `${this.frontendUrl}/verify-email?token=${encodeURIComponent(token)}${safe ? `&redirect=${encodeURIComponent(safe)}` : ''}`;
    const name = escapeHtml(user.firstName || '');
    const subject = 'Επιβεβαίωση email / Verify your email - BeautyDoctors';
    const text = `Γεια σας ${name},\n\nΕπιβεβαιώστε το email σας: ${url}\n\nHello ${name},\n\nPlease verify your email address: ${url}\n\nThe link is valid for 3 days.`;
    const html = this.layout(
      'Επιβεβαίωση email / Verify your email',
      [`Γεια σας ${name}, πατήστε το κουμπί για να επιβεβαιώσετε το email σας.`, `Hello ${name}, please click the button to verify your email address. The link is valid for 3 days.`],
      'Επιβεβαίωση / Verify',
      url,
    );
    await this.safeSend(user.email, subject, text, html);
  }

  async sendPasswordResetLink(user: User): Promise<void> {
    if (!user.email) return;
    const token = this.signPasswordToken(user, 'password_reset', '1h');
    const url = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    await this.mailService.sendPasswordResetEmail(user.email, url, user.firstName).catch((err: any) => {
      this.logger.error(`Failed to send password reset email to user ${user.id}: ${err?.message}`);
    });
  }

  /**
   * One set-password link for an account somebody else created (staff-created client,
   * approved staff member). Valid for 7 days, usable once.
   */
  async sendSetPasswordLink(user: User, context: 'client' | 'staff' = 'client'): Promise<void> {
    if (!user.email) return;
    const token = this.signPasswordToken(user, 'password_set', '7d');
    const url = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(token)}&setup=1`;
    const name = escapeHtml(user.firstName || '');
    const intro = context === 'staff'
      ? ['Δημιουργήθηκε λογαριασμός προσωπικού για εσάς στο BeautyDoctors.', 'A staff account was created for you on BeautyDoctors.']
      : ['Δημιουργήθηκε λογαριασμός για εσάς στο BeautyDoctors.', 'An account was created for you on BeautyDoctors.'];
    const subject = 'Ορίστε τον κωδικό σας / Set your password - BeautyDoctors';
    const text = `Γεια σας ${name},\n\n${intro[0]} Ορίστε τον κωδικό σας: ${url}\n\nHello ${name},\n\n${intro[1]} Set your password here: ${url}\n\nThe link is valid for 7 days and works once.`;
    const html = this.layout(
      'Ορίστε τον κωδικό σας / Set your password',
      [`Γεια σας ${name}, ${intro[0]}`, `Hello ${name}, ${intro[1]} The link is valid for 7 days and works once.`],
      'Ορισμός κωδικού / Set password',
      url,
    );
    await this.safeSend(user.email, subject, text, html);
  }

  async sendLoginCode(user: User, code: string): Promise<void> {
    if (!user.email) return;
    const subject = `${code} - Κωδικός σύνδεσης / Login code - BeautyDoctors`;
    const text = `Ο κωδικός σύνδεσης σας: ${code}\nYour login code: ${code}\n\nΙσχύει για 10 λεπτά. Valid for 10 minutes.\nΑν δεν προσπαθήσατε να συνδεθείτε, αλλάξτε τον κωδικό σας.\nIf you did not try to log in, change your password.`;
    const html = this.layout(
      'Κωδικός σύνδεσης / Login code',
      [
        `<span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#0f172a">${code}</span>`,
        'Ισχύει για 10 λεπτά. Valid for 10 minutes.',
        'Αν δεν προσπαθήσατε να συνδεθείτε, αλλάξτε τον κωδικό σας. If you did not try to log in, change your password.',
      ],
    );
    await this.safeSend(user.email, subject, text, html);
  }

  private async safeSend(to: string, subject: string, text: string, html: string) {
    try {
      await this.mailService.sendMail(to, subject, text, html);
    } catch (err: any) {
      // No subject or address in logs: the login-code subject contains the code itself.
      this.logger.error(`Failed to send an account email: ${err?.message}`);
    }
  }
}
