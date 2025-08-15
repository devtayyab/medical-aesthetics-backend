import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ClinicsService } from './clinics.service';

@ApiTags('Clinics')
@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

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
}