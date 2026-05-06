import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('MAIL_HOST');
    const port = this.configService.get<number>('MAIL_PORT');
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');

    if (host && user && pass) {
      this.logger.log(`Initializing MailService with ${host.includes('amazon') ? 'AWS SES SMTP' : 'SMTP'}`);
      this.transporter = nodemailer.createTransport({
        host,
        port: port || 587,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
    } else {
      this.logger.warn('MailService initialized without configuration. Emails will not be sent.');
    }
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    const from = this.configService.get<string>('MAIL_FROM');
    
    if (!this.transporter) {
      this.logger.error('Cannot send email: Transporter not initialized');
      return null;
    }
    
    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        text,
        html: html || text.replace(/\n/g, '<br>'),
      });
      
      this.logger.log(`Email sent successfully to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      return null;
    }
  }
}


