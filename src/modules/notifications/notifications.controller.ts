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
      throw new BadRequestException('Πάρα πολλά μηνύματα. Δοκιμάστε ξανά αργότερα.');
    }
    recent.push(now);
    this.contactSubmissions.set(ip, recent);

    // Store the message first so it is never lost, then alert admins in-app.
    const saved = await this.notificationsService.saveContactMessage(body);

    const supportEmail =
      this.configService.get<string>('SUPPORT_EMAIL') ||
      this.configService.get<string>('MAIL_FROM');

    if (supportEmail) {
      const text =
        `Νέο μήνυμα από τη φόρμα επικοινωνίας\n\n` +
        `Όνομα: ${body.name}\n` +
        `Email: ${body.email}\n` +
        `Τηλέφωνο: ${body.phone || '-'}\n` +
        `Θέμα: ${body.subject}\n\n` +
        `Μήνυμα:\n${body.message}`;
      const sent = await this.mailService.sendMail(supportEmail, `[Φόρμα επικοινωνίας] ${body.subject}`, text);
      if (!sent) {
        this.logger.warn(`Contact form email could not be sent; message stored as ${saved.id}`);
      }
    }

    return { success: true };
  }

  @Post('send')
  @ApiOperation({ summary: 'Send notification' })
  // BeautyDoctors staff only: any recipient. Clinic accounts use POST /clinic/notifications/send,
  // which only reaches the clinic's own patients.
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SALESPERSON)
  @UseGuards(RolesGuard)
  sendNotification(@Body() body: any, @Request() req) {
    return this.notificationsService.create(
      body.recipientId,
      body.type,
      body.title,
      body.message,
      { ...(body.data || {}), category: 'message', senderId: req.user.id },
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get notifications for logged-in user' })
  getUserNotifications(@Request() req, @Query('limit') limit?: number) {
    // Everyone, admins included, sees only their own notifications. Returning every user's
    // rows to admins showed each event many times and leaked client message copies.
    return this.notificationsService.findByRecipient(req.user.id, limit);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register this browser/device for web push (FCM token)' })
  registerDevice(@Request() req, @Body() body: { token: string }) {
    return this.notificationsService.registerDeviceToken(req.user.id, body?.token);
  }

  // Broadcast to clients with marketing consent
  @Get('broadcast/audience')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Number of clients who accepted marketing communication' })
  async getBroadcastAudience() {
    return { count: await this.notificationsService.getBroadcastAudienceCount() };
  }

  @Post('broadcast')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Send push and/or email to all clients with marketing consent' })
  broadcast(@Request() req, @Body() body: { title: string; message: string; push?: boolean; email?: boolean }) {
    return this.notificationsService.broadcastToMarketingClients(
      body?.title,
      body?.message,
      { push: !!body?.push, email: !!body?.email },
      req.user.id,
    );
  }

  // Contact form inbox (admin)
  @Get('contact-messages')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'List contact form messages' })
  listContactMessages(@Query() query: { limit?: number; offset?: number; unreadOnly?: string }) {
    return this.notificationsService.listContactMessages(query);
  }

  @Patch('contact-messages/:id/read')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Mark a contact message read or unread' })
  setContactMessageRead(@Param('id') id: string, @Body() body: { isRead?: boolean }, @Request() req) {
    return this.notificationsService.setContactMessageRead(id, body?.isRead !== false, req.user.id);
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
    // Always scoped to the caller's own notifications (prevents IDOR).
    return this.notificationsService.markAsRead(id, req.user.id);
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