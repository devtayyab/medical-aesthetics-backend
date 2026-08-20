import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { HubspotService } from './hubspot.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('HubSpot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
