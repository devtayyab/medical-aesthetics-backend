import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { NotificationsService } from './notifications.service';
import { MailService } from './services/mail.service';
import { Public } from '../../common/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import { Logger, BadRequestException } from '@nestjs/common';

export class ContactFormDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsEmail()
  @MaxLength(200)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  subject: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message: string;

  // Honeypot — real users never fill this hidden field
  @IsOptional()
  @IsString()
  website?: string;
}
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { NotificationTrigger } from '../../common/enums/notification-trigger.enum';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);
  // naive in-memory rate limit: max 5 submissions / 10 min per IP
  private contactSubmissions = new Map<string, number[]>();

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) { }

  @Public()
  @Post('contact')
  @ApiOperation({ summary: 'Public contact-us form submission' })
  async submitContactForm(@Body() body: ContactFormDto, @Request() req: any) {
    // Honeypot filled = bot; pretend success so scripts don't adapt
    if (body.website) {
      return { success: true };
    }

    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 10 * 60 * 1000;
    const recent = (this.contactSubmissions.get(ip) || []).filter((t) => now - t < windowMs);
    if (recent.length >= 5) {
      throw new BadRequestException('Too many messages — please try again later.');
    }
    recent.push(now);
    this.contactSubmissions.set(ip, recent);

    const supportEmail =
      this.configService.get<string>('SUPPORT_EMAIL') ||
      this.configService.get<string>('MAIL_FROM');

    if (!supportEmail) {
      this.logger.error('Contact form received but SUPPORT_EMAIL/MAIL_FROM is not configured');
      throw new BadRequestException('Contact form is temporarily unavailable. Please email us directly.');
    }

    const text =
      `New contact form submission\n\n` +
      `Name: ${body.name}\n` +
      `Email: ${body.email}\n` +
      `Phone: ${body.phone || '—'}\n` +
      `Subject: ${body.subject}\n\n` +
      `Message:\n${body.message}`;

    const sent = await this.mailService.sendMail(
      supportEmail,
      `[Contact Form] ${body.subject}`,
      text,
    );
    if (!sent) {
      // Mail transport not configured or failed — log the full message so it is not lost
      this.logger.warn(`Contact form email could not be sent. Payload: ${JSON.stringify({ ...body, message: body.message.slice(0, 500) })}`);
    }

    return { success: true };
  }

  @Post('send')
  @ApiOperation({ summary: 'Send notification' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT)
  @UseGuards(RolesGuard)
  sendNotification(@Body() body: any) {
    return this.notificationsService.create(
      body.recipientId,
      body.type,
      body.title,
      body.message,
      body.data,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get notifications for logged-in user' })
  getUserNotifications(@Request() req, @Query('limit') limit?: number) {
    if (req.user.role === UserRole.SUPER_ADMIN || req.user.role === UserRole.ADMIN) {
      return this.notificationsService.findAllGlobal(limit);
    }
    return this.notificationsService.findByRecipient(req.user.id, limit);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user.id).then(count => ({ count }));
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(@Param('id') id: string, @Request() req) {
    // Admins may mark any notification; everyone else is scoped to their own (prevents IDOR).
    const isPrivileged = req.user.role === UserRole.SUPER_ADMIN || req.user.role === UserRole.ADMIN;
    return this.notificationsService.markAsRead(id, isPrivileged ? undefined : req.user.id);
  }

  // Template Management
  @Get('templates')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  getTemplates() {
    return this.notificationsService.getTemplates();
  }

  @Post('templates')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  createTemplate(@Body() data: any) {
    return this.notificationsService.createTemplate(data);
  }

  @Patch('templates/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  updateTemplate(@Param('id') id: string, @Body() data: any) {
    return this.notificationsService.updateTemplate(id, data);
  }

  @Post('templates/reset-defaults')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  resetDefaultTemplates() {
    return this.notificationsService.seedDefaultTemplates();
  }
}