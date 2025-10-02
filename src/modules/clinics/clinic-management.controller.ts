import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClinicsService } from './clinics.service';
import { BookingsService } from '../bookings/bookings.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { AvailabilityService } from '../bookings/availability.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateClinicProfileDto,
  UpdateClinicProfileDto,
  UpdateAppointmentStatusDto,
  RecordPaymentDto,
  AvailabilitySettingsDto,
  ClinicAnalyticsQueryDto,
} from './dto/clinic.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';

@ApiTags('Clinic Management')
@Controller('clinic')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ClinicManagementController {
  constructor(
    private readonly clinicsService: ClinicsService,
    private readonly bookingsService: BookingsService,
    private readonly loyaltyService: LoyaltyService,
    private readonly availabilityService: AvailabilityService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Clinic Profile Management
  @Post('profile')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER)
  @ApiOperation({ summary: 'Create clinic profile' })
  @ApiResponse({ status: 201, description: 'Clinic profile created successfully' })
  async createClinicProfile(
    @Body() createClinicProfileDto: CreateClinicProfileDto,
    @Request() req,
  ) {
    return this.clinicsService.createClinic({
      ...createClinicProfileDto,
      ownerId: req.user.id,
    });
  }

  @Get('profile')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT, UserRole.SALESPERSON)
  @ApiOperation({ summary: 'Get clinic profile' })
  @ApiResponse({ status: 200, description: 'Clinic profile retrieved successfully' })
  async getClinicProfile(@Request() req) {
    return this.clinicsService.findByOwnerId(req.user.id);
  }

  @Put('profile')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER)
  @ApiOperation({ summary: 'Update clinic profile' })
  @ApiResponse({ status: 200, description: 'Clinic profile updated successfully' })
  async updateClinicProfile(
    @Body() updateClinicProfileDto: UpdateClinicProfileDto,
    @Request() req,
  ) {
    return this.clinicsService.updateClinicProfile(req.user.id, updateClinicProfileDto);
  }

  // Appointment Management
  @Get('appointments')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT, UserRole.SALESPERSON)
  @ApiOperation({ summary: 'Get clinic appointments' })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  async getClinicAppointments(
    @Query() query: { status?: string; date?: string; providerId?: string },
    @Request() req,
  ) {
    return this.bookingsService.findClinicAppointments(req.user.id, req.user.role, query);
  }

  @Get('appointments/:id')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT, UserRole.SALESPERSON)
  @ApiOperation({ summary: 'Get appointment details' })
  @ApiResponse({ status: 200, description: 'Appointment details retrieved successfully' })
  async getAppointment(@Param('id') id: string, @Request() req) {
    return this.bookingsService.findAppointmentForClinic(id, req.user.id, req.user.role);
  }

  @Patch('appointments/:id/status')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Update appointment status' })
  @ApiResponse({ status: 200, description: 'Appointment status updated successfully' })
  async updateAppointmentStatus(
    @Param('id') id: string,
    @Body() updateAppointmentStatusDto: UpdateAppointmentStatusDto,
    @Request() req,
  ) {
    return this.bookingsService.updateAppointmentStatus(
      id,
      updateAppointmentStatusDto.status as AppointmentStatus,
      req.user.id,
      req.user.role,
      updateAppointmentStatusDto,
    );
  }

  @Patch('appointments/:id/complete')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Complete appointment with payment recording' })
  @ApiResponse({ status: 200, description: 'Appointment completed successfully' })
  async completeAppointment(
    @Param('id') id: string,
    @Body() body: { paymentData?: RecordPaymentDto; treatmentDetails?: any },
    @Request() req,
  ) {
    return this.bookingsService.completeAppointmentWithPayment(
      id,
      req.user.id,
      req.user.role,
      body.paymentData,
      body.treatmentDetails,
    );
  }

  // Availability Management
  @Get('availability')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Get clinic availability' })
  @ApiResponse({ status: 200, description: 'Availability retrieved successfully' })
  async getAvailability(@Query() query: any, @Request() req) {
    return this.availabilityService.getClinicAvailability(req.user.id, req.user.role, query);
  }

  @Put('availability')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Update clinic availability settings' })
  @ApiResponse({ status: 200, description: 'Availability settings updated successfully' })
  async updateAvailability(
    @Body() availabilitySettingsDto: AvailabilitySettingsDto,
    @Request() req,
  ) {
    return this.clinicsService.updateClinicAvailability(
      req.user.id,
      availabilitySettingsDto,
    );
  }

  // Payment Recording
  @Post('appointments/:id/payment')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Record payment for appointment' })
  @ApiResponse({ status: 201, description: 'Payment recorded successfully' })
  async recordPayment(
    @Param('id') id: string,
    @Body() recordPaymentDto: RecordPaymentDto,
    @Request() req,
  ) {
    return this.bookingsService.recordPayment(
      id,
      req.user.id,
      recordPaymentDto,
    );
  }

  @Get('appointments/:id/payments')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Get appointment payment history' })
  @ApiResponse({ status: 200, description: 'Payment history retrieved successfully' })
  async getAppointmentPayments(@Param('id') id: string, @Request() req) {
    return this.bookingsService.getAppointmentPayments(id, req.user.id, req.user.role);
  }

  // Analytics and Reports
  @Get('analytics/appointments')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.SALESPERSON)
  @ApiOperation({ summary: 'Get appointment analytics' })
  @ApiResponse({ status: 200, description: 'Appointment analytics retrieved successfully' })
  async getAppointmentAnalytics(
    @Query() query: ClinicAnalyticsQueryDto,
    @Request() req,
  ) {
    return this.bookingsService.getClinicAppointmentAnalytics(
      req.user.id,
      req.user.role,
      query,
    );
  }

  @Get('analytics/revenue')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.SALESPERSON)
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiResponse({ status: 200, description: 'Revenue analytics retrieved successfully' })
  async getRevenueAnalytics(
    @Query() query: ClinicAnalyticsQueryDto,
    @Request() req,
  ) {
    return this.bookingsService.getClinicRevenueAnalytics(
      req.user.id,
      req.user.role,
      query,
    );
  }

  @Get('analytics/loyalty')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.SALESPERSON)
  @ApiOperation({ summary: 'Get loyalty program analytics' })
  @ApiResponse({ status: 200, description: 'Loyalty analytics retrieved successfully' })
  async getLoyaltyAnalytics(
    @Query() query: ClinicAnalyticsQueryDto,
    @Request() req,
  ) {
    return this.loyaltyService.getClinicLoyaltyAnalytics(
      req.user.id,
      req.user.role,
      query,
    );
  }

  @Get('analytics/repeat-forecast')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.SALESPERSON)
  @ApiOperation({ summary: 'Get repeat client forecast' })
  @ApiResponse({ status: 200, description: 'Repeat forecast retrieved successfully' })
  async getRepeatForecast(
    @Query() query: ClinicAnalyticsQueryDto,
    @Request() req,
  ) {
    return this.bookingsService.getRepeatClientForecast(
      req.user.id,
      req.user.role,
      query,
    );
  }

  // Client Management
  @Get('clients')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT, UserRole.SALESPERSON)
  @ApiOperation({ summary: 'Get clinic clients' })
  @ApiResponse({ status: 200, description: 'Clients retrieved successfully' })
  async getClinicClients(
    @Query() query: { search?: string; limit?: number; offset?: number },
    @Request() req,
  ) {
    return this.bookingsService.getClinicClients(req.user.id, req.user.role, query);
  }

  @Get('clients/:id')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT, UserRole.SALESPERSON)
  @ApiOperation({ summary: 'Get client details and history' })
  @ApiResponse({ status: 200, description: 'Client details retrieved successfully' })
  async getClientDetails(@Param('id') id: string, @Request() req) {
    return this.bookingsService.getClientDetails(id, req.user.id, req.user.role);
  }

  // Treatment/Service Management
  @Get('services')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Get clinic services/treatments' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  async getClinicServices(@Request() req) {
    return this.clinicsService.getClinicServices(req.user.id);
  }

  @Post('services')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER)
  @ApiOperation({ summary: 'Create new service/treatment' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  async createService(
    @Body() createServiceDto: any,
    @Request() req,
  ) {
    return this.clinicsService.createService(req.user.id, createServiceDto);
  }

  @Put('services/:id')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER)
  @ApiOperation({ summary: 'Update service/treatment' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  async updateService(
    @Param('id') id: string,
    @Body() updateServiceDto: any,
    @Request() req,
  ) {
    return this.clinicsService.updateService(req.user.id, id, updateServiceDto);
  }

  @Patch('services/:id/toggle')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER)
  @ApiOperation({ summary: 'Toggle service active status' })
  @ApiResponse({ status: 200, description: 'Service status updated successfully' })
  async toggleServiceStatus(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.clinicsService.toggleServiceStatus(req.user.id, id);
  }

  // Appointment Reschedule
  @Patch('appointments/:id/reschedule')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Reschedule appointment' })
  @ApiResponse({ status: 200, description: 'Appointment rescheduled successfully' })
  async rescheduleAppointment(
    @Param('id') id: string,
    @Body() rescheduleDto: { startTime: string; endTime: string; reason?: string },
    @Request() req,
  ) {
    return this.bookingsService.rescheduleAppointment(
      id,
      req.user.id,
      req.user.role,
      new Date(rescheduleDto.startTime),
      new Date(rescheduleDto.endTime),
      rescheduleDto.reason,
    );
  }

  // Notification Management
  @Post('notifications/send')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Send notification to user' })
  @ApiResponse({ status: 201, description: 'Notification sent successfully' })
  async sendNotification(
    @Body() notificationDto: { recipientId: string; type: string; title: string; message: string; data?: any },
    @Request() req,
  ) {
    return this.notificationsService.create(
      notificationDto.recipientId,
      notificationDto.type as any,
      notificationDto.title,
      notificationDto.message,
      notificationDto.data,
    );
  }

  @Post('notifications/send-bulk')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER)
  @ApiOperation({ summary: 'Send bulk notifications to multiple users' })
  @ApiResponse({ status: 201, description: 'Bulk notifications sent successfully' })
  async sendBulkNotifications(
    @Body() bulkNotificationDto: { recipientIds: string[]; type: string; title: string; message: string; data?: any },
    @Request() req,
  ) {
    await this.notificationsService.sendBulk(
      bulkNotificationDto.recipientIds,
      bulkNotificationDto.type as any,
      bulkNotificationDto.title,
      bulkNotificationDto.message,
      bulkNotificationDto.data,
    );
    return { message: 'Bulk notifications sent successfully' };
  }

  @Post('appointments/:id/send-reminder')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Send appointment reminder to client' })
  @ApiResponse({ status: 201, description: 'Reminder sent successfully' })
  async sendAppointmentReminder(
    @Param('id') id: string,
    @Request() req,
  ) {
    const appointment = await this.bookingsService.findAppointmentForClinic(id, req.user.id, req.user.role);
    
    return this.notificationsService.sendAppointmentReminder(
      appointment.clientId,
      {
        id: appointment.id,
        time: appointment.startTime,
        serviceName: appointment.service?.name,
      },
    );
  }

  // Review Management
  @Get('reviews')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Get clinic reviews' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  async getClinicReviews(
    @Query() query: { limit?: number; offset?: number },
    @Request() req,
  ) {
    return this.clinicsService.getClinicReviews(req.user.id, query);
  }

  @Get('reviews/statistics')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER)
  @ApiOperation({ summary: 'Get review statistics' })
  @ApiResponse({ status: 200, description: 'Review statistics retrieved successfully' })
  async getReviewStatistics(@Request() req) {
    return this.clinicsService.getReviewStatistics(req.user.id);
  }

  @Post('reviews/:id/respond')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER)
  @ApiOperation({ summary: 'Respond to a review' })
  @ApiResponse({ status: 200, description: 'Response added successfully' })
  async respondToReview(
    @Param('id') id: string,
    @Body() body: { response: string },
    @Request() req,
  ) {
    return this.clinicsService.respondToReview(req.user.id, id, body.response);
  }

  @Patch('reviews/:id/toggle-visibility')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER)
  @ApiOperation({ summary: 'Toggle review visibility' })
  @ApiResponse({ status: 200, description: 'Review visibility toggled successfully' })
  async toggleReviewVisibility(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.clinicsService.toggleReviewVisibility(req.user.id, id);
  }
}
