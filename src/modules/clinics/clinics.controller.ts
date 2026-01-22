import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ClinicsService } from './clinics.service';

@ApiTags('Clinics')
@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Get()
  @ApiOperation({ summary: 'Search clinics with filters' })
  search(@Query() params: any) {
    return this.clinicsService.search(params);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured clinics' })
  getFeatured() {
    return this.clinicsService.getFeatured();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get clinic details' })
  findOne(@Param('id') id: string) {
    return this.clinicsService.findById(id);
  }

  @Get(':id/services')
  @ApiOperation({ summary: 'Get clinic services' })
  findServices(@Param('id') id: string) {
    return this.clinicsService.findServices(id);
  }

  @Get(':id/providers')
  @ApiOperation({ summary: 'Get clinic providers (doctors/aestheticians)' })
  getProviders(@Param('id') id: string) {
    return this.clinicsService.getClinicProviders(id);
  }

  @Get(':id/services/:serviceId/providers')
  @ApiOperation({ summary: 'Get providers for a specific service' })
  getServiceProviders(
    @Param('id') clinicId: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.clinicsService.getServiceProviders(clinicId, serviceId);
  }
}