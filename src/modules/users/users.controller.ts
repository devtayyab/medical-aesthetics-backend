import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req) {
    return req.user;
  }

  @Get('me/referral-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user referral statistics' })
  getReferralStats(@Request() req) {
    return this.usersService.getReferralStats(req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALESPERSON, UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiQuery({ name: 'salespersonId', required: false })
  findAll(@Request() req, @Query() query: { role?: string; search?: string; limit?: number; offset?: number; salespersonId?: string }) {
    // Clinic accounts use this to find colleagues and BeautyDoctors staff (new chat). They see
    // their own patients through /clinic/patients, never the platform-wide client list.
    const isClinicAccount = [UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT]
      .some((r) => r === String(req.user?.role || '').toLowerCase());
    return this.usersService.findAll({ ...query, excludeClients: isClinicAccount });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  // Clinic owners request staff through POST /clinic/staff (admin approval), not here.
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new user (Agent/Staff)' })
  create(@Request() req, @Body() createUserDto: CreateUserDto) {
    // A manager creates sales agents only; any other role (manager, clinic, admin) is an admin task.
    const actorRole = String(req.user?.role || '').toLowerCase();
    if (actorRole === UserRole.MANAGER && createUserDto.role !== UserRole.SALESPERSON) {
      throw new ForbiddenException('Managers can create salesperson accounts only.');
    }
    // Prevent privilege escalation: only a SUPER_ADMIN may create ADMIN/SUPER_ADMIN accounts.
    const requestedRole = createUserDto.role;
    const privilegedRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
    if (
      requestedRole &&
      privilegedRoles.includes(requestedRole) &&
      req.user?.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('You are not allowed to assign this role.');
    }
    // Created by staff with a password they hand over: no verification link is sent, so the account
    // must not be blocked by the email-verification check at login.
    return this.usersService.create({ ...createUserDto, isEmailVerified: true } as CreateUserDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user details (Admin only)' })
  async update(@Request() req, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    // Only a SUPER_ADMIN may grant the SUPER_ADMIN role or change a SUPER_ADMIN account.
    if (req.user?.role !== UserRole.SUPER_ADMIN) {
      const target = await this.usersService.findById(id);
      if (updateUserDto.role === UserRole.SUPER_ADMIN || String(target.role).toUpperCase() === UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('You are not allowed to change this account or assign the SUPER_ADMIN role.');
      }
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own profile' })
  updateOwnProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    // UpdateProfileDto omits role/clinic fields; the global whitelist pipe strips any
    // privileged fields a client tries to send, so this can no longer escalate roles.
    return this.usersService.update(req.user.id, updateProfileDto);
  }

  @Post(':id/consent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record user consent' })
  recordConsent(
    @Request() req,
    @Param('id') userId: string,
    @Body() consentData: any,
  ) {
    // Consent is personal: only the user themselves (or an admin) records it.
    const isAdmin = [UserRole.ADMIN, UserRole.SUPER_ADMIN].some(
      (r) => r.toLowerCase() === String(req.user?.role || '').toLowerCase(),
    );
    if (!isAdmin && String(userId) !== String(req.user?.id)) {
      throw new ForbiddenException('You can only record your own consent.');
    }
    return this.usersService.recordConsent(
      userId,
      consentData.consentType,
      consentData.version,
      consentData.granted,
      consentData.metadata,
    );
  }

  @Get('me/export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export user data (GDPR)' })
  exportData(@Request() req) {
    return this.usersService.exportUserData(req.user.id);
  }

  @Post('me/delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user data (GDPR)' })
  deleteData(@Request() req) {
    return this.usersService.deleteUserData(req.user.id);
  }

  @Post('me/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate user account' })
  deactivateData(@Request() req) {
    return this.usersService.deactivateUserData(req.user.id);
  }

  @Post('me/cancel-deletion')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel pending account deletion' })
  cancelDeletion(@Request() req) {
    return this.usersService.cancelAccountDeletion(req.user.id);
  }

  @Post('me/permanent-delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Permanently delete and anonymize user account' })
  permanentDelete(@Request() req) {
    return this.usersService.executePermanentDeletion(req.user.id);
  }

  @Post('me/change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change own password' })
  changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.id, changePasswordDto);
  }
}