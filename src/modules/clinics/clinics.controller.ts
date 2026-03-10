import { Controller, Get, Param, Query, Post, Body, UseGuards, Request, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ReviewStatus } from './enums/review-status.enum';
import { TreatmentStatus } from './enums/treatment-status.enum';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ClinicsService } from './clinics.service';

@ApiTags('Clinics')
@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) { }

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

  // Admin Treatment Approval
  @Get('treatments/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get treatments pending approval' })
  async getPendingTreatments() {
    return this.clinicsService.getPendingTreatments();
  }

  @Patch('treatments/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve or reject a treatment' })
  async setTreatmentStatus(
    @Param('id') id: string,
    @Body() body: { status: TreatmentStatus },
  ) {
    return this.clinicsService.setTreatmentStatus(id, body.status);
  }

  @Get('treatments/:id')
  @ApiOperation({ summary: 'Get treatment details with clinics offering it' })
  getTreatmentDetails(@Param('id') id: string) {
    return this.clinicsService.getTreatmentDetails(id);
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

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get approved reviews for a clinic' })
  async getPublicReviews(
    @Param('id') id: string,
    @Query() query: any,
  ) {
    return this.clinicsService.getPublicReviews(id, query);
  }

  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a review for a clinic' })
  async createReview(
    @Param('id') clinicId: string,
    @Body() body: { rating: number; comment?: string; appointmentId?: string },
    @Request() req,
  ) {
    return this.clinicsService.createReview(
      clinicId,
      req.user.id,
      body.rating,
      body.comment,
      body.appointmentId,
    );
  }

  @Get('reviews/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get pending reviews for moderation' })
  async getPendingReviews(@Query() query: any) {
    return this.clinicsService.getPendingReviews(query);
  }

  @Patch('reviews/:id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Moderate a review' })
  async moderateReview(
    @Param('id') id: string,
    @Body() body: { status: ReviewStatus; rejectReason?: string },
    @Request() req,
  ) {
    return this.clinicsService.moderateReview(
      req.user.id,
      id,
      body.status,
      body.rejectReason,
    );
  }

}