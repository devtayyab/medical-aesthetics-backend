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
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationType } from '../../common/enums/notification-type.enum';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Post('send')
  @ApiOperation({ summary: 'Send notification' })
  @Roles(UserRole.ADMIN, UserRole.SECRETARIAT)
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
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }
}