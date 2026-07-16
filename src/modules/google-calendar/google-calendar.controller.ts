import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { GoogleCalendarService } from './google-calendar.service';
import { GoogleCalendarConfig } from './google-calendar.config';
import { ClinicsService } from '../clinics/clinics.service';

@ApiTags('Google Calendar')
@Controller('google-calendar')
export class GoogleCalendarController {
  constructor(
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly config: GoogleCalendarConfig,
    private readonly clinicsService: ClinicsService,
  ) {}

  /** Owner/admin gate: only clinic owners of THIS clinic (or platform staff) may manage it. */
  private async assertClinicAccess(req: any, clinicId: string): Promise<void> {
    const role = String(req.user?.role || '').toLowerCase();
    const privileged = ['admin', 'super_admin', 'manager'];
    if (privileged.includes(role)) return;

    if (role === UserRole.CLINIC_OWNER) {
      const clinic = await this.clinicsService.findById(clinicId).catch(() => null);
      if (clinic && clinic.ownerId === req.user.id) return;
    }
    throw new ForbiddenException('You do not have access to this clinic');
  }

  @Get('clinics/:clinicId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.MANAGER,
    UserRole.CLINIC_OWNER,
  )
  @ApiOperation({ summary: 'Get the clinic Google Calendar connection status' })
  async getStatus(@Param('clinicId') clinicId: string, @Req() req: any) {
    await this.assertClinicAccess(req, clinicId);
    return this.googleCalendarService.getStatus(clinicId);
  }

  @Get('clinics/:clinicId/connect')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.MANAGER,
    UserRole.CLINIC_OWNER,
  )
  @ApiOperation({
    summary: 'Get the Google consent URL to connect this clinic calendar',
  })
  async connect(@Param('clinicId') clinicId: string, @Req() req: any) {
    await this.assertClinicAccess(req, clinicId);
    const url = await this.googleCalendarService.getConsentUrl(
      clinicId,
      req.user.id,
    );
    return { url };
  }

  @Delete('clinics/:clinicId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.MANAGER,
    UserRole.CLINIC_OWNER,
  )
  @ApiOperation({ summary: 'Disconnect the clinic Google Calendar' })
  async disconnect(@Param('clinicId') clinicId: string, @Req() req: any) {
    await this.assertClinicAccess(req, clinicId);
    await this.googleCalendarService.disconnect(clinicId);
    return { success: true };
  }

  /**
   * OAuth redirect target. Public because Google sends the user's browser here
   * with no JWT — authenticity is carried by the signed `state` param.
   */
  @Public()
  @Get('oauth/callback')
  @ApiOperation({ summary: 'Google OAuth callback (redirect target)' })
  async oauthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const base = this.config.frontendUrl.replace(/\/$/, '');
    if (error) {
      return res.redirect(
        `${base}/settings/calendar?google=error&reason=${encodeURIComponent(error)}`,
      );
    }
    if (!code || !state) {
      throw new BadRequestException('Missing code or state');
    }
    try {
      const { clinicId } = await this.googleCalendarService.handleOAuthCallback(
        code,
        state,
      );
      return res.redirect(
        `${base}/settings/calendar?google=connected&clinicId=${clinicId}`,
      );
    } catch (err) {
      return res.redirect(
        `${base}/settings/calendar?google=error&reason=${encodeURIComponent(err.message || 'unknown')}`,
      );
    }
  }
}
