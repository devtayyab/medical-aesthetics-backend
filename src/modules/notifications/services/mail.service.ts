import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { isPlaceholderEmail } from '../utils/notification-format.util';

const BRAND = 'Beauty Doctors';

function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

@Injectable()
export class MailService {
  private transporter?: nodemailer.Transporter;
  private sesClient?: SESClient;
  private readonly logger = new Logger(MailService.name);
  private fromAddress: string;

  constructor(private configService: ConfigService) {
    const fromEmail = this.configService.get<string>('MAIL_FROM') || 'no-reply@beautydoctors.gr';
    const fromName = this.configService.get<string>('MAIL_FROM_NAME') || BRAND;
    // A display name improves deliverability and shows "Beauty Doctors" in the inbox.
    this.fromAddress = fromEmail.includes('<') ? fromEmail : `${fromName} <${fromEmail}>`;

    // 1. AWS SES SDK. Explicit keys, or MAIL_TRANSPORT=ses to use the default AWS credential
    //    chain (e.g. the EC2 instance role) without putting keys in the environment.
    const awsRegion =
      this.configService.get<string>('SES_REGION') ||
      this.configService.get<string>('AWS_REGION') ||
      this.configService.get<string>('AWS_DEFAULT_REGION') ||
      'eu-central-1';
    const awsAccessKey = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const awsSecretKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const transport = (this.configService.get<string>('MAIL_TRANSPORT') || '').toLowerCase();

    if ((awsAccessKey && awsSecretKey) || transport === 'ses') {
      this.logger.log(`Initializing AWS SES client for region ${awsRegion}`);
      this.sesClient = new SESClient({
        region: awsRegion,
        ...(awsAccessKey && awsSecretKey
          ? { credentials: { accessKeyId: awsAccessKey, secretAccessKey: awsSecretKey } }
          : {}),
      });
    }

    // 2. SMTP (e.g. the Amazon SES SMTP endpoint).
    const host = this.configService.get<string>('MAIL_HOST');
    const port = Number(this.configService.get<number>('MAIL_PORT') || 587);
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');

    if (host && user && pass) {
      this.logger.log(`Initializing MailService with SMTP (${host})`);
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    }

    if (!this.sesClient && !this.transporter) {
      this.logger.warn('MailService has no SES or SMTP configuration. Emails are only logged.');
    }
  }

  /** True when a real transport (SES or SMTP) is configured. */
  isConfigured(): boolean {
    return !!(this.sesClient || this.transporter);
  }

  /**
   * Sends an email. Returns null when the email was NOT delivered to a transport, so callers
   * (and the notification queue) never mark a failed email as sent.
   */
  async sendMail(to: string, subject: string, text: string, html?: string): Promise<{ messageId?: string } | null> {
    if (isPlaceholderEmail(to)) {
      this.logger.warn(`Skipping email "${subject}": recipient has no real email address`);
      return null;
    }

    const from = this.fromAddress;
    const htmlBody = html || this.renderLayout(subject, this.textToHtml(text));

    if (this.sesClient) {
      try {
        const command = new SendEmailCommand({
          Source: from,
          Destination: { ToAddresses: [to] },
          Message: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: {
              Text: { Data: text, Charset: 'UTF-8' },
              Html: { Data: htmlBody, Charset: 'UTF-8' },
            },
          },
        });

        const res = await this.sesClient.send(command);
        this.logger.log(`Email dispatched via AWS SES to ${to}: MessageId ${res.MessageId}`);
        return { messageId: res.MessageId };
      } catch (err: any) {
        this.logger.error(`AWS SES send failed to ${to}: ${err.message}`, err.stack);
        // Fall through to SMTP if it is configured as well
      }
    }

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({ from, to, subject, text, html: htmlBody });
        this.logger.log(`Email dispatched via SMTP to ${to}: ${info.messageId}`);
        return info;
      } catch (error: any) {
        this.logger.error(`SMTP send failed to ${to}: ${error.message}`);
        return null;
      }
    }

    if (this.sesClient) {
      // SES was configured but failed and there is no SMTP fallback: report the failure.
      return null;
    }

    // Development fallback: nothing configured at all
    // Never log the body: it can carry password-reset links and login codes.
    this.logger.warn(`[DEV MODE - EMAIL NOT SENT] Subject: ${subject}`);
    return { messageId: `mock-dev-${Date.now()}` };
  }

  /** Plain text (with blank-line paragraphs) to simple HTML paragraphs. */
  textToHtml(text: string): string {
    return String(text || '')
      .split(/\n{2,}/)
      .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
      .join('\n');
  }

  /** Shared branded layout for every outgoing email. */
  renderLayout(heading: string, bodyHtml: string, button?: { url: string; label: string }): string {
    const buttonHtml = button
      ? `<div class="btn-wrap"><a href="${escapeHtml(button.url)}" class="btn" target="_blank">${escapeHtml(button.label)}</a></div>
         <p style="font-size: 12px; color: #64748b;">Αν το κουμπί δεν λειτουργεί, αντιγράψτε τον σύνδεσμο στον browser σας:<br><a href="${escapeHtml(button.url)}" style="color: #3b82f6; word-break: break-all;">${escapeHtml(button.url)}</a></p>`
      : '';

    return `<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #0f172a; padding: 28px 24px; text-align: center; }
    .logo { color: #CBFF38; font-size: 22px; font-weight: 900; letter-spacing: 2px; margin: 0; }
    .content { padding: 32px; }
    h1 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 16px; }
    p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px; }
    .btn-wrap { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background-color: #0f172a; color: #CBFF38 !important; text-decoration: none; padding: 14px 32px; font-size: 13px; font-weight: 800; border-radius: 12px; letter-spacing: 1px; }
    .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><div class="logo">${BRAND}</div></div>
    <div class="content">
      <h1>${escapeHtml(heading)}</h1>
      ${bodyHtml}
      ${buttonHtml}
    </div>
    <div class="footer">&copy; ${new Date().getFullYear()} ${BRAND} · info@beautydoctors.gr</div>
  </div>
</body>
</html>`;
  }

  /** Password reset link (Greek). */
  async sendPasswordResetEmail(to: string, resetUrl: string, userName?: string): Promise<boolean> {
    const greeting = userName ? `Γεια σας ${userName},` : 'Γεια σας,';
    const subject = 'Επαναφορά κωδικού πρόσβασης - Beauty Doctors';
    const text =
      `${greeting}\n\n` +
      `Λάβαμε αίτημα επαναφοράς του κωδικού σας. Ανοίξτε τον παρακάτω σύνδεσμο για να ορίσετε νέο κωδικό:\n\n${resetUrl}\n\n` +
      `Ο σύνδεσμος ισχύει για 1 ώρα. Αν δεν κάνατε εσείς το αίτημα, αγνοήστε αυτό το email.\n\n` +
      `Με εκτίμηση,\nΗ ομάδα Beauty Doctors`;
    const html = this.renderLayout(
      'Επαναφορά κωδικού πρόσβασης',
      `<p>${escapeHtml(greeting)}</p>
       <p>Λάβαμε αίτημα επαναφοράς του κωδικού σας. Πατήστε το κουμπί για να ορίσετε νέο κωδικό.</p>
       <p style="font-size: 12px; color: #94a3b8;">Ο σύνδεσμος ισχύει για 1 ώρα. Αν δεν κάνατε εσείς το αίτημα, αγνοήστε αυτό το email.</p>`,
      { url: resetUrl, label: 'Ορισμός νέου κωδικού' },
    );
    const res = await this.sendMail(to, subject, text, html);
    return !!res?.messageId;
  }

  /** Email verification: a link and/or a one-time code (Greek). */
  async sendVerificationEmail(to: string, options: { userName?: string; verifyUrl?: string; code?: string }): Promise<boolean> {
    const greeting = options.userName ? `Γεια σας ${options.userName},` : 'Γεια σας,';
    const subject = 'Επιβεβαίωση email - Beauty Doctors';
    const textParts = [`${greeting}`, 'Επιβεβαιώστε τη διεύθυνση email σας για να ολοκληρωθεί η εγγραφή σας.'];
    if (options.code) textParts.push(`Ο κωδικός επιβεβαίωσης είναι: ${options.code}\nΙσχύει για 15 λεπτά. Μην τον μοιραστείτε με κανέναν.`);
    if (options.verifyUrl) textParts.push(`Σύνδεσμος επιβεβαίωσης:\n${options.verifyUrl}`);
    textParts.push('Αν δεν δημιουργήσατε εσείς λογαριασμό, αγνοήστε αυτό το email.\n\nΜε εκτίμηση,\nΗ ομάδα Beauty Doctors');
    const text = textParts.join('\n\n');

    const codeHtml = options.code
      ? `<p style="text-align:center; font-size: 28px; font-weight: 900; letter-spacing: 8px; color: #0f172a;">${escapeHtml(options.code)}</p>
         <p style="font-size: 12px; color: #94a3b8; text-align:center;">Ο κωδικός ισχύει για 15 λεπτά. Μην τον μοιραστείτε με κανέναν.</p>`
      : '';
    const html = this.renderLayout(
      'Επιβεβαίωση email',
      `<p>${escapeHtml(greeting)}</p>
       <p>Επιβεβαιώστε τη διεύθυνση email σας για να ολοκληρωθεί η εγγραφή σας.</p>
       ${codeHtml}`,
      options.verifyUrl ? { url: options.verifyUrl, label: 'Επιβεβαίωση email' } : undefined,
    );
    const res = await this.sendMail(to, subject, text, html);
    return !!res?.messageId;
  }

  /** Welcome email with the generated password (Greek). */
  async sendWelcomeCredentialsEmail(to: string, password: string, userName?: string, loginUrl?: string): Promise<boolean> {
    const greeting = userName ? `Γεια σας ${userName},` : 'Γεια σας,';
    const siteUrl = loginUrl || this.configService.get<string>('FRONTEND_URL') || 'https://beautydoctors.gr/login';
    const subject = 'Καλώς ήρθατε στο Beauty Doctors - Ο λογαριασμός σας είναι έτοιμος';
    const text =
      `${greeting}\n\nΟ λογαριασμός σας στο Beauty Doctors δημιουργήθηκε.\n\n` +
      `Στοιχεία σύνδεσης:\nEmail: ${to}\nΠροσωρινός κωδικός: ${password}\n\nΣύνδεση: ${siteUrl}\n\n` +
      `Για την ασφάλειά σας, αλλάξτε τον κωδικό μετά την πρώτη σύνδεση.\n\nΜε εκτίμηση,\nΗ ομάδα Beauty Doctors`;
    const html = this.renderLayout(
      'Καλώς ήρθατε στο Beauty Doctors',
      `<p>${escapeHtml(greeting)}</p>
       <p>Ο λογαριασμός σας δημιουργήθηκε. Μπορείτε να δείτε τα ραντεβού και τις θεραπείες σας online.</p>
       <p><strong>Email:</strong> ${escapeHtml(to)}<br><strong>Προσωρινός κωδικός:</strong> <code>${escapeHtml(password)}</code></p>
       <p style="font-size: 12px; color: #64748b;">Για την ασφάλειά σας, αλλάξτε τον κωδικό μετά την πρώτη σύνδεση.</p>`,
      { url: siteUrl, label: 'Σύνδεση στον λογαριασμό' },
    );
    const res = await this.sendMail(to, subject, text, html);
    return !!res?.messageId;
  }
}
