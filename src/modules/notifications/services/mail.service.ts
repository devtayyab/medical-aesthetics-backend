import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

@Injectable()
export class MailService {
  private transporter?: nodemailer.Transporter;
  private sesClient?: SESClient;
  private readonly logger = new Logger(MailService.name);
  private fromAddress: string;

  constructor(private configService: ConfigService) {
    this.fromAddress = this.configService.get<string>('MAIL_FROM') || 'no-reply@beautydoctors.gr';

    // 1. Check for AWS SES SDK configuration
    const awsRegion = this.configService.get<string>('AWS_REGION') || this.configService.get<string>('AWS_DEFAULT_REGION') || 'eu-central-1';
    const awsAccessKey = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const awsSecretKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    if (awsAccessKey && awsSecretKey) {
      this.logger.log(`Initializing AWS SES Client for region ${awsRegion}`);
      this.sesClient = new SESClient({
        region: awsRegion,
        credentials: {
          accessKeyId: awsAccessKey,
          secretAccessKey: awsSecretKey,
        },
      });
    }

    // 2. Check for SMTP (e.g. Amazon SES SMTP or standard SMTP)
    const host = this.configService.get<string>('MAIL_HOST');
    const port = this.configService.get<number>('MAIL_PORT') || 587;
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');

    if (host && user && pass) {
      this.logger.log(`Initializing MailService with SMTP (${host})`);
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
    }

    if (!this.sesClient && !this.transporter) {
      this.logger.warn('MailService initialized without email configuration. Emails will be logged to console in dev mode.');
    }
  }

  async sendMail(to: string, subject: string, text: string, html?: string): Promise<{ messageId?: string } | null> {
    const from = this.fromAddress;

    // Prefer AWS SES SDK if configured
    if (this.sesClient) {
      try {
        const command = new SendEmailCommand({
          Source: from,
          Destination: {
            ToAddresses: [to],
          },
          Message: {
            Subject: {
              Data: subject,
              Charset: 'UTF-8',
            },
            Body: {
              Text: {
                Data: text,
                Charset: 'UTF-8',
              },
              ...(html ? { Html: { Data: html, Charset: 'UTF-8' } } : {}),
            },
          },
        });

        const res = await this.sesClient.send(command);
        this.logger.log(`Email dispatched via AWS SES to ${to}: MessageId ${res.MessageId}`);
        return { messageId: res.MessageId };
      } catch (err: any) {
        this.logger.error(`AWS SES send failed to ${to}: ${err.message}`, err.stack);
        // Fallback to SMTP if available
      }
    }

    // Use SMTP if configured
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from,
          to,
          subject,
          text,
          html: html || text.replace(/\n/g, '<br>'),
        });

        this.logger.log(`Email dispatched via SMTP to ${to}: ${info.messageId}`);
        return info;
      } catch (error: any) {
        this.logger.error(`SMTP send failed to ${to}: ${error.message}`);
        return null;
      }
    }

    // Development fallback log
    this.logger.warn(`[DEV MODE - EMAIL NOT SENT] To: ${to} | Subject: ${subject}\nText: ${text}`);
    return { messageId: `mock-dev-${Date.now()}` };
  }

  /**
   * Sends a styled Password Reset email with link
   */
  async sendPasswordResetEmail(to: string, resetUrl: string, userName?: string): Promise<boolean> {
    const greeting = userName ? `Hello ${userName},` : 'Hello,';
    const subject = 'Reset Your Password - Beauty & Doctors';

    const text = `${greeting}\n\nWe received a request to reset your password. Please click the link below to set a new password:\n\n${resetUrl}\n\nThis link is valid for 1 hour. If you did not request this, please ignore this email.\n\nBest regards,\nBeauty & Doctors Team`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .header { background: #0f172a; padding: 32px 24px; text-align: center; }
        .logo { color: #CBFF38; font-size: 22px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin: 0; }
        .content { padding: 36px 32px; }
        h1 { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
        p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px; }
        .btn-wrap { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background-color: #0f172a; color: #CBFF38 !important; text-decoration: none; padding: 14px 32px; font-size: 13px; font-weight: 800; border-radius: 12px; letter-spacing: 1px; text-transform: uppercase; }
        .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Beauty & Doctors</div>
        </div>
        <div class="content">
          <h1>Password Reset Request</h1>
          <p>${greeting}</p>
          <p>We received a request to reset your account password. Click the button below to choose a new secure password:</p>
          <div class="btn-wrap">
            <a href="${resetUrl}" class="btn" target="_blank">Reset My Password</a>
          </div>
          <p style="font-size: 12px; color: #64748b;">Or copy and paste this link in your browser:<br><a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a></p>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">This link will expire in 1 hour for your security. If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Beauty & Doctors. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    `;

    const res = await this.sendMail(to, subject, text, html);
    return !!res?.messageId;
  }

  /**
   * Sends a styled Welcome email with system-generated password when a lead is converted
   */
  async sendWelcomeCredentialsEmail(to: string, password: string, userName?: string, loginUrl?: string): Promise<boolean> {
    const greeting = userName ? `Hello ${userName},` : 'Hello,';
    const siteUrl = loginUrl || this.configService.get<string>('FRONTEND_URL') || 'https://beautydoctors.gr/login';
    const subject = 'Welcome to Beauty & Doctors - Your Account is Ready';

    const text = `${greeting}\n\nWelcome to Beauty & Doctors! Your customer account has been created.\n\nYou can now log in using the following credentials:\n\nEmail: ${to}\nTemporary Password: ${password}\n\nLogin URL: ${siteUrl}\n\nPlease change your password after logging in for security.\n\nBest regards,\nBeauty & Doctors Team`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .header { background: #0f172a; padding: 32px 24px; text-align: center; }
        .logo { color: #CBFF38; font-size: 22px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin: 0; }
        .content { padding: 36px 32px; }
        h1 { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
        p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px; }
        .cred-box { background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 14px; padding: 20px; margin: 24px 0; text-align: left; }
        .cred-item { margin-bottom: 10px; font-size: 13px; color: #334155; }
        .cred-label { font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; display: block; margin-bottom: 2px; }
        .cred-val { font-family: monospace; font-size: 15px; font-weight: 700; color: #0f172a; background: #ffffff; padding: 6px 10px; border-radius: 6px; border: 1px solid #e2e8f0; display: inline-block; }
        .btn-wrap { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background-color: #0f172a; color: #CBFF38 !important; text-decoration: none; padding: 14px 32px; font-size: 13px; font-weight: 800; border-radius: 12px; letter-spacing: 1px; text-transform: uppercase; }
        .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Beauty & Doctors</div>
        </div>
        <div class="content">
          <h1>Welcome to Beauty & Doctors!</h1>
          <p>${greeting}</p>
          <p>Your client account has been activated. You can now access your treatments, appointments, and medical history online.</p>
          
          <div class="cred-box">
            <div class="cred-item">
              <span class="cred-label">Login Email</span>
              <span class="cred-val">${to}</span>
            </div>
            <div class="cred-item" style="margin-bottom: 0;">
              <span class="cred-label">Your Generated Password</span>
              <span class="cred-val">${password}</span>
            </div>
          </div>

          <div class="btn-wrap">
            <a href="${siteUrl}" class="btn" target="_blank">Sign In To Your Account</a>
          </div>
          
          <p style="font-size: 12px; color: #64748b;">For your security, we recommend changing your password from your profile settings after your first login.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Beauty & Doctors. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    `;

    const res = await this.sendMail(to, subject, text, html);
    return !!res?.messageId;
  }
}
