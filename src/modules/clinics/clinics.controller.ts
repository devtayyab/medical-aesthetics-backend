import { Controller, Get, Param, Query, Post, Body, UseGuards, Request, Patch, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ReviewStatus } from './enums/review-status.enum';
import { TreatmentStatus } from './enums/treatment-status.enum';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ClinicsService } from './clinics.service';

@ApiTags('Clinics')
@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) { }

  @Public()
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Search clinics with filters' })
  search(@Query() params: any, @Request() req: any) {
    return this.clinicsService.search(params, req?.user);
  }

  @Public()
  @UseGuards(JwtAuthGuard)
  @Get('featured')
  @ApiOperation({ summary: 'Get featured clinics' })
  getFeatured(@Request() req: any) {
    return this.clinicsService.getFeatured(req?.user);
  }

  // Public category tree (top-level categories with their subcategories nested)
  @Get('categories')
  @ApiOperation({ summary: 'Get the public category tree (categories + subcategories)' })
  getCategoryTree(@Query('withTreatments') withTreatments?: string) {
    return this.clinicsService.getCategoryTree(false, withTreatments === 'true');
  }

  @Get('categories/:id/treatments')
  @ApiOperation({ summary: 'Get approved treatments for a category or subcategory' })
  getCategoryTreatments(@Param('id') id: string) {
    return this.clinicsService.getPublicTreatmentsByCategory(id);
  }

  @Get('top-treatments')
  @ApiOperation({ summary: 'Get super-admin-curated featured (top) treatments' })
  getTopTreatments(@Query('limit') limit?: string) {
    const parsed = limit ? parseInt(limit, 10) : NaN;
    return this.clinicsService.getFeaturedTreatments(Number.isFinite(parsed) ? parsed : undefined);
  }

  @Get('cities')
  @ApiOperation({ summary: 'Get distinct cities from all active clinics' })
  getPublicCities() {
    return this.clinicsService.getPublicCities();
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

  @Public()
  @UseGuards(JwtAuthGuard)
  @Get('treatments/:id')
  @ApiOperation({ summary: 'Get treatment details with clinics offering it' })
  getTreatmentDetails(@Param('id') id: string, @Request() req: any) {
    return this.clinicsService.getTreatmentDetails(id, req?.user);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get treatment name suggestions' })
  getSuggestions(@Query('q') q: string) {
    return this.clinicsService.getSuggestions(q);
  }

  @Public()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get clinic details' })
  findOne(@Param('id') id: string, @Request() req: any) {
    if (!req?.user) {
      throw new UnauthorizedException('Authentication required to view clinic details');
    }
    return this.clinicsService.findById(id, req.user);
  }

  @Public()
  @UseGuards(JwtAuthGuard)
  @Get(':id/services')
  @ApiOperation({ summary: 'Get clinic services' })
  findServices(@Param('id') id: string, @Request() req: any) {
    return this.clinicsService.findServices(id, req?.user);
  }

  @Public()
  @UseGuards(JwtAuthGuard)
  @Get(':id/providers')
  @ApiOperation({ summary: 'Get clinic providers (doctors/aestheticians)' })
  getProviders(@Param('id') id: string, @Request() req: any) {
    if (!req?.user) {
      return [];
    }
    return this.clinicsService.getClinicProviders(id, req.user);
  }

  @Public()
  @UseGuards(JwtAuthGuard)
  @Get(':id/services/:serviceId/providers')
  @ApiOperation({ summary: 'Get providers for a specific service' })
  getServiceProviders(
    @Param('id') clinicId: string,
    @Param('serviceId') serviceId: string,
    @Request() req: any,
  ) {
    if (!req?.user) {
      return [];
    }
    return this.clinicsService.getServiceProviders(clinicId, serviceId, req.user);
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

  @Patch('reviews/:id/response-visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Hide or show the clinic reply to a review (admin)' })
  async setReviewResponseVisibility(
    @Param('id') id: string,
    @Body() body: { hidden: boolean },
  ) {
    return this.clinicsService.setReviewResponseVisibility(id, !!body?.hidden);
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