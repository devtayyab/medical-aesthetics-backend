import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Req,
  Res,
  UseGuards,
  Logger,
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
import { SelectCalendarDto } from './dto/select-calendar.dto';

// Platform staff plus the clinic portal roles. Clinic roles are further
// restricted to clinics they belong to by assertClinicAccess().
const CLINIC_MANAGER_ROLES = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.MANAGER,
  UserRole.CLINIC_OWNER,
  UserRole.DOCTOR,
  UserRole.SECRETARIAT,
] as const;

const CLINIC_PORTAL_ROLES: string[] = [
  UserRole.CLINIC_OWNER,
  UserRole.DOCTOR,
  UserRole.SECRETARIAT,
];

@ApiTags('Google Calendar')
@Controller('google-calendar')
export class GoogleCalendarController {
  private readonly logger = new Logger(GoogleCalendarController.name);

  constructor(
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly config: GoogleCalendarConfig,
    private readonly clinicsService: ClinicsService,
  ) {}

  /**
   * Access gate: platform staff may manage any clinic; clinic portal users
   * (owner, doctor, secretariat) only clinics they belong to (owner, ownership
   * mapping, agent access or assigned clinic).
   */
  private async assertClinicAccess(req: any, clinicId: string): Promise<void> {
    const role = String(req.user?.role || '').toLowerCase();
    const privileged = ['admin', 'super_admin', 'manager'];
    if (privileged.includes(role)) return;

    if (CLINIC_PORTAL_ROLES.includes(role)) {
      const clinics = await this.clinicsService
        .findAllByOwner(req.user.id)
        .catch(() => []);
      if (clinics.some((c) => c?.id === clinicId)) return;
    }
    throw new ForbiddenException('You do not have access to this clinic');
  }

  @Get('clinics/:clinicId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(...CLINIC_MANAGER_ROLES)
  @ApiOperation({ summary: 'Get the clinic Google Calendar connection status' })
  async getStatus(@Param('clinicId') clinicId: string, @Req() req: any) {
    await this.assertClinicAccess(req, clinicId);
    return this.googleCalendarService.getStatus(clinicId);
  }

  @Get('clinics/:clinicId/connect')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(...CLINIC_MANAGER_ROLES)
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

  @Get('clinics/:clinicId/calendars')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(...CLINIC_MANAGER_ROLES)
  @ApiOperation({ summary: 'List the connected account\'s writable calendars to choose from' })
  async listCalendars(@Param('clinicId') clinicId: string, @Req() req: any) {
    await this.assertClinicAccess(req, clinicId);
    return this.googleCalendarService.listCalendars(clinicId);
  }

  @Put('clinics/:clinicId/calendar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(...CLINIC_MANAGER_ROLES)
  @ApiOperation({ summary: 'Choose which calendar to sync (starts backfill + inbound sync)' })
  async selectCalendar(
    @Param('clinicId') clinicId: string,
    @Body() dto: SelectCalendarDto,
    @Req() req: any,
  ) {
    await this.assertClinicAccess(req, clinicId);
    if (!dto.calendarId && !dto.createNewName) {
      throw new BadRequestException('Provide calendarId or createNewName');
    }
    return this.googleCalendarService.selectCalendar(clinicId, {
      calendarId: dto.calendarId,
      createNewName: dto.createNewName,
    });
  }

  @Delete('clinics/:clinicId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(...CLINIC_MANAGER_ROLES)
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
    // Return to the clinic portal Google Calendar page (all clinic roles can open it).
    const page = `${base}/clinic/google-calendar`;
    if (error) {
      return res.redirect(
        `${page}?google=error&reason=${encodeURIComponent(error)}`,
      );
    }
    if (!code || !state) {
      return res.redirect(`${page}?google=error&reason=missing_code`);
    }
    try {
      const { clinicId } = await this.googleCalendarService.handleOAuthCallback(
        code,
        state,
      );
      // Connected, but the clinic must now pick which calendar to sync.
      return res.redirect(
        `${page}?google=connected&select=1&clinicId=${clinicId}`,
      );
    } catch (err) {
      // Log details server-side; never reflect raw internal error text into the URL.
      this.logger.error(`OAuth callback failed: ${err?.message}`);
      return res.redirect(
        `${page}?google=error&reason=connection_failed`,
      );
    }
  }
}
