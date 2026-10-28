import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { HubspotService } from './hubspot.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

// HubSpot holds BeautyDoctors CRM history: platform staff only (never clinics or clients)
@ApiTags('HubSpot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SALESPERSON)
@Controller('hubspot')
export class HubspotController {
  constructor(private readonly hubspotService: HubspotService) {}

  @Get('contact-overview')
  @ApiOperation({ summary: 'Get a summary of a lead from HubSpot (bookings, notes)' })
  @ApiQuery({ name: 'email', required: false, description: 'Email address of the lead' })
  @ApiQuery({ name: 'phone', required: false, description: 'Phone number of the lead' })
  async getContactOverview(@Query('email') email?: string, @Query('phone') phone?: string) {
    return this.hubspotService.getContactOverview(email, phone);
  }
}
