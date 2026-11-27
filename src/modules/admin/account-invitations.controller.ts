import { Body, Controller, Get, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { AccountInvitationsService } from './account-invitations.service';

@ApiTags('Admin')
@Controller('admin/account-invitations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AccountInvitationsController {
  constructor(private readonly invitations: AccountInvitationsService) {}

  @Get()
  @ApiOperation({ summary: 'Customers who have not set a password yet' })
  list() {
    return this.invitations.list();
  }

  @Post('send')
  @ApiOperation({ summary: 'Send the invitation to the selected customers only (max 50)' })
  send(@Request() req, @Body() body: { userIds: string[]; resend?: boolean }) {
    return this.invitations.send(req.user.id, body?.userIds, body?.resend === true);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Automatic invitations: off / test / on' })
  getSettings() {
    return this.invitations.getSettings();
  }

  @Put('settings')
  @ApiOperation({ summary: 'Switch automatic invitations off / test / on' })
  updateSettings(@Request() req, @Body() body: { mode: string; testEmails?: string[] }) {
    return this.invitations.updateSettings(req.user.id, body);
  }
}
