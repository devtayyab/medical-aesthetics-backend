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

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    const from = this.configService.get<string>('MAIL_FROM');
    
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
      // Don't throw error to avoid breaking the calling process, but log it
      return null;
    }
  }
}
