import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clinic } from './entities/clinic.entity';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClinicsService } from './clinics.service';
import { BookingsService } from '../bookings/bookings.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { AvailabilityService } from '../bookings/availability.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FinancialService } from '../payments/financial.service';
import {
  CreateClinicProfileDto,
  UpdateClinicProfileDto,
  UpdateAppointmentStatusDto,
  RecordPaymentDto,
  AvailabilitySettingsDto,
  ClinicAnalyticsQueryDto,
  CreateServiceDto,
  UpdateServiceDto,
  CreateTreatmentDto,
  UpdateTreatmentDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  UpdateBankDetailsDto,
} from './dto/clinic.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { User } from '../users/entities/user.entity';
import { ClinicPatientsService, PatientInput } from './clinic-patients.service';

const CLINIC_PORTAL_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.DOCTOR];
const isClinicAccount = (role: string) =>
  [UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.DOCTOR].some((r) => r === String(role || '').toLowerCase());

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
    private readonly financialService: FinancialService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Clinic)
    private readonly clinicsRepository: Repository<Clinic>,
    private readonly clinicPatientsService: ClinicPatientsService,
  ) { }

  // Clinics the logged-in clinic account works for (replaces /crm/accessible-clinics
  // for the clinic portal; a clinic account without a clinic gets an empty list)
  @Get('accessible-clinics')
  @Roles(...CLINIC_PORTAL_ROLES)
  @ApiOperation({ summary: 'Clinics accessible to the current clinic account' })
  async getAccessibleClinics(@Request() req) {
    return this.clinicPatientsService.getAccessibleClinics(req.user.id, req.user.role);
  }

  // Clinic patients (own clinic only)
  @Get('patients')
  @Roles(...CLINIC_PORTAL_ROLES)
  @ApiOperation({ summary: 'Patients of the clinic: appointments at this clinic + clients the clinic added' })
  async listPatients(
    @Query() query: { search?: string; clinicId?: string; limit?: number; offset?: number },
    @Request() req,
  ) {
    return this.clinicPatientsService.listPatients(req.user.id, req.user.role, query);
  }

  @Get('patients/search')
  @Roles(...CLINIC_PORTAL_ROLES)
  @ApiOperation({ summary: 'Find a patient: own patients by name/phone/email, BeautyDoctors clients only by exact full phone' })
  async searchPatients(@Query('q') q: string, @Query('clinicId') clinicId: string, @Request() req) {
    return this.clinicPatientsService.searchPatients(req.user.id, req.user.role, q, clinicId);
  }

  @Post('patients')
  @Roles(...CLINIC_PORTAL_ROLES)
  @ApiOperation({ summary: 'Add patient (phone rule: known phone links to the existing contact, new phone = clinic own client)' })
  async createPatient(@Body() body: PatientInput, @Request() req) {
    return this.clinicPatientsService.createPatient(req.user.id, req.user.role, body);
  }

  @Patch('patients/:id')
  @Roles(...CLINIC_PORTAL_ROLES)
  @ApiOperation({ summary: 'Update an own patient (details reach the account, appointments and CRM card)' })
  async updatePatient(@Param('id') id: string, @Body() body: Partial<PatientInput>, @Request() req) {
    return this.clinicPatientsService.updatePatient(req.user.id, req.user.role, id, body);
  }

  @Get('patients/:id/medical-record')
  @Roles(...CLINIC_PORTAL_ROLES)
  @ApiOperation({ summary: 'Medical record (own clinic appointments + clinic notes) for the PDF export' })
  async getMedicalRecord(@Param('id') id: string, @Request() req) {
    return this.clinicPatientsService.getMedicalRecord(req.user.id, req.user.role, id);
  }

  // Clinic Profile Management
  // Clinic self-registration is disabled (item 57): only admins create clinics.
  @Post('profile')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
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
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.SALESPERSON, UserRole.MANAGER, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get clinic profile' })
  @ApiResponse({ status: 200, description: 'Clinic profile retrieved successfully' })
  async getClinicProfile(@Request() req, @Query('clinicId') clinicId?: string) {
    if (clinicId && isClinicAccount(req.user.role)) {
      // A clinic account only reads its own clinic(s); none assigned = no access
      const allowed = await this.clinicPatientsService.resolveClinicIds(req.user.id, req.user.role);
      if (allowed && !allowed.includes(clinicId)) {
        throw new NotFoundException('Clinic not found');
      }
    }
    if (clinicId) {
      return this.clinicsService.findById(clinicId);
    }
    return this.clinicsService.findByOwnerId(req.user.id);
  }

  @Get('my-clinics')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.SALESPERSON, UserRole.MANAGER, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get all clinics accessible to current user' })
  async getMyClinics(@Request() req) {
    if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.SUPER_ADMIN) {
      return this.clinicsRepository.find({ where: { isActive: true }, order: { name: 'ASC' } });
    }
    return this.clinicsService.findAllByOwner(req.user.id);
  }

  @Put('profile')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Update clinic profile' })
  @ApiResponse({ status: 200, description: 'Clinic profile updated successfully' })
  async updateClinicProfile(
    @Body() updateClinicProfileDto: UpdateClinicProfileDto,
    @Request() req,
  ) {
    return this.clinicsService.updateClinicProfile(req.user.id, updateClinicProfileDto);
  }

  // ─── Bank / Payout Details ────────────────────────────────────────────────
  @Get('bank-details')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER)
  @ApiOperation({ summary: 'Get clinic bank/IBAN details for Viva payouts' })
  async getBankDetails(@Request() req) {
    const owned = await this.clinicsService.findByOwnerId(req.user.id);
    // Bank columns are select: false; load them explicitly for the owner/admin only.
    const clinic = await this.clinicsRepository.createQueryBuilder('clinic')
      .addSelect(['clinic.bankIban', 'clinic.bankBic', 'clinic.bankAccountHolder', 'clinic.bankName'])
      .where('clinic.id = :id', { id: owned.id })
      .getOne();
    return {
      bankIban: clinic.bankIban || null,
      bankAccountHolder: clinic.bankAccountHolder || null,
      bankName: clinic.bankName || null,
      bankBic: clinic.bankBic || null,
    };
  }

  @Patch('bank-details')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER)
  @ApiOperation({ summary: 'Save clinic IBAN bank details for Viva payouts' })
  async updateBankDetails(
    @Body() dto: UpdateBankDetailsDto,
    @Request() req,
  ) {
    const clinic = await this.clinicsService.findByOwnerId(req.user.id);
    await this.clinicsRepository.update(clinic.id, {
      bankIban: dto.bankIban,
      bankAccountHolder: dto.bankAccountHolder,
      bankName: dto.bankName,
      bankBic: dto.bankBic,
    });
    return { message: 'Bank details updated successfully', clinicId: clinic.id };
  }

  // Admin: Update any clinic's bank details by clinicId
  @Patch('admin/:clinicId/bank-details')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Save any clinic IBAN by clinicId' })
  async adminUpdateBankDetails(
    @Param('clinicId') clinicId: string,
    @Body() dto: UpdateBankDetailsDto,
  ) {
    await this.clinicsRepository.update(clinicId, {
      bankIban: dto.bankIban,
      bankAccountHolder: dto.bankAccountHolder,
      bankName: dto.bankName,
      bankBic: dto.bankBic,
    });
    return { message: 'Bank details updated successfully', clinicId };
  }

  // Appointment Management
  @Get('appointments')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.SALESPERSON, UserRole.MANAGER, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get clinic appointments' })
  @ApiResponse({ status: 200, description: 'Appointments retrieved successfully' })
  async getClinicAppointments(
    @Query() query: { status?: string; date?: string; providerId?: string; appointmentSource?: 'clinic_own' | 'platform_broker' },
    @Request() req,
  ) {
    return this.bookingsService.findClinicAppointments(req.user.id, req.user.role, query);
  }

  @Post('appointments')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Create clinic own appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  async createClinicAppointment(
    @Body() createAppointmentDto: any,
    @Request() req,
  ) {
    // Clinic accounts only book into their own clinic(s).
    await this.clinicPatientsService.assertClinicAccess(req.user.id, req.user.role, createAppointmentDto?.clinicId);
    // Ensure appointment is marked as clinic_own and track who booked it
    return this.bookingsService.createAppointment({
      ...createAppointmentDto,
      appointmentSource: 'clinic_own',
      bookedById: req.user.id,
    }, { id: req.user.id, role: req.user.role });
  }

  @Get('appointments/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.SALESPERSON, UserRole.MANAGER, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get appointment details' })
  @ApiResponse({ status: 200, description: 'Appointment details retrieved successfully' })
  async getAppointment(@Param('id') id: string, @Request() req) {
    const appointment = await this.bookingsService.findAppointmentForClinic(id, req.user.id, req.user.role);
    return {
      ...appointment,
      displayName: this.bookingsService.formatAppointmentDisplayName(appointment),
      serviceName: appointment.service?.treatment?.name,
      providerName: appointment.provider
        ? `${appointment.provider.firstName} ${appointment.provider.lastName}`
        : null,
    };
  }

  @Patch('appointments/:id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.SALESPERSON, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Update appointment status' })
  @ApiResponse({ status: 200, description: 'Appointment status updated successfully' })
  async updateAppointmentStatus(
    @Param('id') id: string,
    @Body() updateAppointmentStatusDto: UpdateAppointmentStatusDto,
    @Request() req,
  ) {
    // Paid appointments stay locked for salespeople; only an admin can change them.
    if (String(req.user?.role || '').toLowerCase() === UserRole.SALESPERSON) {
      const existing = await this.bookingsService.findById(id);
      if (Number(existing.amountPaid || 0) > 0) {
        throw new ForbiddenException('This appointment is paid. Only an admin can change it.');
      }
    }
    return this.bookingsService.updateAppointmentStatus(
      id,
      updateAppointmentStatusDto.status as AppointmentStatus,
      req.user.id,
      req.user.role,
      updateAppointmentStatusDto,
    );
  }

  @Post('appointments/validate-gift-card')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.SALESPERSON, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Validate a gift card for in-clinic redemption' })
  @ApiResponse({ status: 200, description: 'Gift card validated successfully' })
  async validateGiftCard(@Body() body: { code: string }) {
    return this.financialService.validateGiftCard(body.code);
  }

  @Patch('appointments/:id/complete')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.SALESPERSON, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Complete appointment with payment recording and completion report' })
  @ApiResponse({ status: 200, description: 'Appointment completed successfully' })
  async completeAppointment(
    @Param('id') id: string,
    @Body() body: {
      paymentData?: RecordPaymentDto;
      treatmentDetails?: any;
      completionReport?: {
        patientCame: boolean;
        servicePerformed: string;
        amountPaid: number;
        renewalDate?: string;
        notes?: string;
      };
      serviceId?: string;
      // Allow top-level fields for compatibility with some frontend components
      amountPaid?: number;
      paymentMethod?: string;
      totalAmount?: number;
      giftCardCode?: string;
    },
    @Request() req,
  ) {
    // Robustness: Map top-level fields to paymentData or completionReport if they are missing
    const paymentData = body.paymentData || (body.paymentMethod ? {
      paymentMethod: body.paymentMethod,
      amount: body.amountPaid || body.totalAmount || 0,
    } : undefined);


    const completionReport = body.completionReport || (body.amountPaid !== undefined ? {
      patientCame: true,
      servicePerformed: '',
      amountPaid: body.amountPaid,
      notes: '',
    } : undefined);

    return this.bookingsService.completeAppointmentWithPayment(
      id,
      req.user.id,
      req.user.role,
      paymentData,
      body.treatmentDetails,
      completionReport,
      body.serviceId,
      body.giftCardCode,
    );
  }

  // Availability Management
  @Get('availability')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.MANAGER, UserRole.DOCTOR, UserRole.SALESPERSON)
  @ApiOperation({ summary: 'Get clinic availability' })
  @ApiResponse({ status: 200, description: 'Availability retrieved successfully' })
  async getAvailability(@Query() query: any, @Request() req) {
    return this.availabilityService.getClinicAvailability(req.user.id, req.user.role, query);
  }

  @Put('availability')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.SALESPERSON, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Update clinic availability settings' })
  @ApiResponse({ status: 200, description: 'Availability settings updated successfully' })
  async updateAvailability(
    @Body() availabilitySettingsDto: AvailabilitySettingsDto,
    @Request() req,
  ) {
    if (availabilitySettingsDto.clinicId) {
      await this.clinicPatientsService.assertClinicAccess(req.user.id, req.user.role, availabilitySettingsDto.clinicId);
    }
    return this.clinicsService.updateClinicAvailability(
      req.user.id,
      availabilitySettingsDto,
    );
  }

  // Block Time Slot (Doctor unavailable time)
  @Post('availability/block-time-slot')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.DOCTOR, UserRole.SALESPERSON)
  @ApiOperation({ summary: 'Block a specific time slot (doctor unavailable)' })
  @ApiResponse({ status: 201, description: 'Time slot blocked successfully' })
  async blockTimeSlot(
    @Body() body: { providerId?: string; startTime: string; endTime: string; reason?: string; clinicId?: string },
    @Request() req,
  ) {
    let clinicId = body.clinicId;

    if (!clinicId) {
      // Only fall back to owner lookup when no clinicId was sent at all
      const clinic = await this.clinicsService.findByOwnerId(req.user.id);
      clinicId = clinic?.id;
    }

    if (!clinicId) {
      throw new BadRequestException('clinicId is required');
    }
    await this.clinicPatientsService.assertClinicAccess(req.user.id, req.user.role, clinicId);

    const effectiveProviderId = body.providerId || (req.user.role === UserRole.DOCTOR ? req.user.id : null);

    return this.availabilityService.blockTimeSlot(
      clinicId,
      effectiveProviderId,
      new Date(body.startTime),
      new Date(body.endTime),
      body.reason || 'Doctor unavailable',
      req.user.id,
    );
  }

  @Delete('availability/block-time-slot/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.SALESPERSON, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Unblock a time slot' })
  @ApiResponse({ status: 200, description: 'Time slot unblocked successfully' })
  async unblockTimeSlot(@Param('id') id: string, @Request() req) {
    await this.availabilityService.unblockTimeSlot(id, req.user.id, req.user.role);
    return { message: 'Time slot unblocked successfully' };
  }

  @Put('availability/block-time-slot/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.DOCTOR, UserRole.SALESPERSON)
  @ApiOperation({ summary: 'Update a blocked time slot' })
  @ApiResponse({ status: 200, description: 'Time slot updated successfully' })
  async updateBlockedTimeSlot(
    @Param('id') id: string,
    @Body() body: { startTime?: string; endTime?: string; reason?: string; providerId?: string | null },
    @Request() req
  ) {
    return this.availabilityService.updateBlockedTimeSlot(
      id,
      {
        startTime: body.startTime ? new Date(body.startTime) : undefined,
        endTime: body.endTime ? new Date(body.endTime) : undefined,
        reason: body.reason,
        providerId: body.providerId
      },
      req.user.id,
      req.user.role
    );
  }

  @Get('availability/blocked-slots')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.SALESPERSON, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get blocked time slots' })
  @ApiResponse({ status: 200, description: 'Blocked time slots retrieved successfully' })
  async getBlockedTimeSlots(
    @Query() query: { providerId?: string; startDate?: string; endDate?: string; clinicId?: string },
    @Request() req,
  ) {
    let clinic;
    if (query.clinicId) {
      await this.clinicPatientsService.assertClinicAccess(req.user.id, req.user.role, query.clinicId);
      clinic = await this.clinicsService.findById(query.clinicId);
    } else {
      clinic = await this.clinicsService.findByOwnerId(req.user.id);
    }
    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    // Without an explicit provider filter, return EVERY block of the clinic (clinic-wide and
    // per staff member) so calendars can show and delete them.
    const effectiveProviderId = query.providerId || null;

    return this.availabilityService.getBlockedTimeSlots(
      clinic.id,
      effectiveProviderId,
      query.startDate ? new Date(query.startDate) : undefined,
      query.endDate ? new Date(query.endDate) : undefined,
    );
  }

  // Payment Recording
  @Post('appointments/:id/payment')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Record payment for appointment' })
  @ApiResponse({ status: 201, description: 'Payment recorded successfully' })
  async recordPayment(
    @Param('id') id: string,
    @Body() recordPaymentDto: RecordPaymentDto,
    @Request() req,
  ) {
    // recordPayment itself does not scope by clinic; clinic accounts only pay their own appointments.
    await this.bookingsService.findAppointmentForClinic(id, req.user.id, String(req.user.role).toLowerCase());
    return this.bookingsService.recordPayment(
      id,
      req.user.id,
      recordPaymentDto,
    );
  }

  @Get('appointments/:id/payment-summary')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.DOCTOR, UserRole.SALESPERSON, UserRole.MANAGER)
  @ApiOperation({ summary: 'Total, paid, balance and every payment (with method) of an appointment' })
  async getAppointmentPaymentSummary(@Param('id') id: string, @Request() req) {
    await this.bookingsService.findAppointmentForClinic(id, req.user.id, req.user.role);
    return this.financialService.getAppointmentPaymentSummary(id);
  }

  @Get('appointments/:id/payments')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get appointment payment history' })
  @ApiResponse({ status: 200, description: 'Payment history retrieved successfully' })
  async getAppointmentPayments(@Param('id') id: string, @Request() req) {
    return this.bookingsService.getAppointmentPayments(id, req.user.id, req.user.role);
  }

  // Analytics and Reports
  @Get('analytics/appointments')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.SALESPERSON, UserRole.MANAGER, UserRole.DOCTOR)
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
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.SALESPERSON, UserRole.MANAGER, UserRole.DOCTOR)
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
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.SALESPERSON, UserRole.MANAGER, UserRole.DOCTOR)
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
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.SALESPERSON, UserRole.MANAGER, UserRole.DOCTOR)
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
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.SALESPERSON, UserRole.MANAGER, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get clinic clients' })
  @ApiResponse({ status: 200, description: 'Clients retrieved successfully' })
  async getClinicClients(
    @Query() query: { search?: string; limit?: number; offset?: number },
    @Request() req,
  ) {
    if (isClinicAccount(req.user.role)) {
      return this.clinicPatientsService.listPatients(req.user.id, req.user.role, query);
    }
    return this.bookingsService.getClinicClients(req.user.id, req.user.role, query);
  }

  @Get('clients/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.SALESPERSON, UserRole.MANAGER, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get client details and history' })
  @ApiResponse({ status: 200, description: 'Client details retrieved successfully' })
  async getClientDetails(@Param('id') id: string, @Request() req) {
    if (isClinicAccount(req.user.role)) {
      // Throws unless this is a patient of the account's own clinic
      await this.clinicPatientsService.getMedicalRecord(req.user.id, req.user.role, id);
    }
    return this.bookingsService.getClientDetails(id, req.user.id, req.user.role);
  }

  // Treatment/Service Management
  @Get('services')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.SALESPERSON)
  @ApiOperation({ summary: 'Get clinic services/treatments' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  async getClinicServices(
    @Query('clinicId') clinicId: string,
    @Request() req
  ) {
    return this.clinicsService.getClinicServices(req.user.id, req.user.role, clinicId);
  }

  @Post('services')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Create new service/treatment' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  async createService(
    @Body() createServiceDto: CreateServiceDto & { clinicId?: string },
    @Request() req,
  ) {
    return this.clinicsService.createService(req.user.id, req.user.role, createServiceDto);
  }

  @Put('services/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Update service/treatment' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  async updateService(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto & { clinicId?: string },
    @Request() req,
  ) {
    return this.clinicsService.updateService(req.user.id, req.user.role, id, updateServiceDto);
  }

  @Patch('services/:id/toggle')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Toggle service active status' })
  @ApiResponse({ status: 200, description: 'Service status updated successfully' })
  async toggleServiceStatus(
    @Param('id') id: string,
    @Query('clinicId') clinicId: string,
    @Request() req,
  ) {
    return this.clinicsService.toggleServiceStatus(req.user.id, req.user.role, id, clinicId);
  }

  @Delete('services/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Delete service/treatment' })
  @ApiResponse({ status: 204, description: 'Service deleted successfully' })
  async deleteService(
    @Param('id') id: string,
    @Query('clinicId') clinicId: string,
    @Request() req,
  ) {
    return this.clinicsService.deleteService(req.user.id, req.user.role, id, clinicId);
  }

  // Appointment Reschedule
  @Patch('appointments/:id/reschedule')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.SALESPERSON)
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
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Send notification to user' })
  @ApiResponse({ status: 201, description: 'Notification sent successfully' })
  async sendNotification(
    @Body() notificationDto: { recipientId: string; type: string; title: string; message: string; data?: any },
    @Request() req,
  ) {
    // Clinic accounts may only message their own patients.
    if (isClinicAccount(req.user.role)) {
      await this.clinicPatientsService.assertOwnPatient(req.user.id, req.user.role, notificationDto.recipientId);
    }
    return this.notificationsService.create(
      notificationDto.recipientId,
      notificationDto.type as any,
      notificationDto.title,
      notificationDto.message,
      // Tagged as a message so it appears in the client's inbox
      { ...(notificationDto.data || {}), category: 'message', senderId: req.user.id },
    );
  }

  @Post('notifications/send-bulk')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CLINIC_OWNER, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Send bulk notifications to multiple users' })
  @ApiResponse({ status: 201, description: 'Bulk notifications sent successfully' })
  async sendBulkNotifications(
    @Body() bulkNotificationDto: { recipientIds: string[]; type: string; title: string; message: string; data?: any },
    @Request() req,
  ) {
    // Clinic accounts may only message their own patients.
    if (isClinicAccount(req.user.role)) {
      for (const recipientId of bulkNotificationDto.recipientIds || []) {
        await this.clinicPatientsService.assertOwnPatient(req.user.id, req.user.role, recipientId);
      }
    }
    await this.notificationsService.sendBulk(
      bulkNotificationDto.recipientIds,
      bulkNotificationDto.type as any,
      bulkNotificationDto.title,
      bulkNotificationDto.message,
      { ...(bulkNotificationDto.data || {}), category: 'message', senderId: req.user.id },
    );
    return { message: 'Bulk notifications sent successfully' };
  }

  @Post('appointments/:id/send-reminder')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.DOCTOR)
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
        serviceName: appointment.service?.treatment?.name,
      },
    );
  }

  // Messaging to Platform/Broker
  @Post('messages/to-platform')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Send message to platform/broker (not clients)' })
  @ApiResponse({ status: 201, description: 'Message sent to platform successfully' })
  async sendMessageToPlatform(
    @Body() body: { title: string; message: string; appointmentId?: string; data?: any },
    @Request() req,
  ) {
    return this.notificationsService.sendToPlatformAdmins(
      body.title,
      body.message,
      {
        clinicUserId: req.user.id,
        clinicName: req.user.firstName + ' ' + req.user.lastName,
        appointmentId: body.appointmentId,
        ...body.data,
      },
    );
  }

  // Review Management
  @Get('reviews')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.SALESPERSON, UserRole.MANAGER, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get clinic reviews' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  async getClinicReviews(
    @Query() query: { limit?: number; offset?: number },
    @Request() req,
  ) {
    return this.clinicsService.getClinicReviews(req.user.id, query);
  }

  @Get('reviews/statistics')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.SECRETARIAT, UserRole.SALESPERSON, UserRole.MANAGER, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get review statistics' })
  @ApiResponse({ status: 200, description: 'Review statistics retrieved successfully' })
  async getReviewStatistics(@Request() req) {
    return this.clinicsService.getReviewStatistics(req.user.id);
  }

  @Post('reviews/:id/respond')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Respond to a review' })
  @ApiResponse({ status: 200, description: 'Response added successfully' })
  async respondToReview(
    @Param('id') id: string,
    @Body() body: { response: string },
    @Request() req,
  ) {
    return this.clinicsService.respondToReview(req.user.id, id, body.response);
  }

  // Hiding/publishing reviews is an admin action only (see PATCH /clinics/reviews/:id/moderate).

  // Staff Management (Clinic Owners can manage their doctors/staff)
  @Get('staff')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.MANAGER, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get clinic staff' })
  async getStaff(
    @Query('clinicId') clinicId: string,
    @Request() req
  ) {
    if (clinicId) {
      await this.clinicPatientsService.assertClinicAccess(req.user.id, req.user.role, clinicId);
    }
    return this.clinicsService.getClinicStaff(req.user.id, req.user.role, clinicId);
  }

  @Post('staff')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Create new staff member (Doctor, etc)' })
  async createStaff(
    @Body() staffData: any,
    @Request() req,
  ) {
    if (staffData?.clinicId) {
      await this.clinicPatientsService.assertClinicAccess(req.user.id, req.user.role, staffData.clinicId);
    }
    return this.clinicsService.createClinicStaff(req.user.id, req.user.role, staffData);
  }

  @Delete('staff/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Remove staff member from clinic' })
  async removeStaff(
    @Param('id') id: string,
    @Request() req,
  ) {
    const staff = await this.usersRepository.findOne({ where: { id: id } });
    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    // Clinic accounts only remove staff of their own clinic(s).
    if (isClinicAccount(req.user.role)) {
      if (!staff.assignedClinicId) throw new NotFoundException('Staff member not found');
      await this.clinicPatientsService.assertClinicAccess(req.user.id, req.user.role, staff.assignedClinicId);
    }

    let clinicToUse = staff.assignedClinicId;
    if (!clinicToUse) {
      try {
        const clinic = await this.clinicsService.findByOwnerId(req.user.id);
        clinicToUse = clinic?.id;
      } catch (err) {}
    }

    return this.clinicsService.removeStaffById(id, clinicToUse);
  }

  // Predefined Treatment Management
  @Get('treatment-categories')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Get predefined treatment categories' })
  async getCategories() {
    return this.clinicsService.getCategories();
  }

  @Get('treatments-by-category/:catId')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Get approved treatments for a category' })
  async getTreatmentsByCategory(@Param('catId') catId: string) {
    return this.clinicsService.getTreatmentsByCategory(catId);
  }

  @Post('manual-treatment')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Create a manual treatment (requires admin approval)' })
  async createManualTreatment(
    @Body() body: { name: string; categoryId: string; shortDescription?: string; fullDescription?: string },
  ) {
    return this.clinicsService.createManualTreatment(body);
  }

  @Post('manual-category')
  @Roles(UserRole.ADMIN, UserRole.CLINIC_OWNER, UserRole.DOCTOR, UserRole.SECRETARIAT)
  @ApiOperation({ summary: 'Create a manual category (requires admin approval)' })
  async createManualCategory(
    @Body() body: { name: string; description?: string },
  ) {
    return this.clinicsService.createManualCategory(body);
  }

  // Master Catalog Management (Admin Only)
  @Get('master/services/pending')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all pending services (Admin)' })
  async getPendingServices() {
    return this.clinicsService.getPendingServices();
  }

  @Patch('master/services/:id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Set service approval status' })
  async setServiceApprovalStatus(
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED' }
  ) {
    return this.clinicsService.setServiceApprovalStatus(id, body.status);
  }
  @Get('master/categories')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all categories (Admin)' })
  async getAllCategoriesAdmin(@Query() query: any) {
    return this.clinicsService.getAllCategories(query);
  }

  @Get('master/categories/tree')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get the full category tree incl. inactive (Admin)' })
  async getCategoryTreeAdmin() {
    return this.clinicsService.getCategoryTree(true);
  }

  @Post('master/categories')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create master category' })
  async createCategoryAdmin(@Body() body: CreateCategoryDto) {
    return this.clinicsService.createMasterCategory(body);
  }

  @Put('master/categories/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update master category' })
  async updateCategoryAdmin(@Param('id') id: string, @Body() body: UpdateCategoryDto) {
    return this.clinicsService.updateCategory(id, body);
  }

  @Delete('master/categories/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete master category' })
  async deleteCategoryAdmin(@Param('id') id: string) {
    return this.clinicsService.deleteCategory(id);
  }

  @Get('master/treatments')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all treatments master (Admin)' })
  async getAllTreatmentsAdmin(@Query() query: any) {
    return this.clinicsService.getAllTreatmentsMaster(query);
  }

  @Post('master/treatments')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create master treatment' })
  async createTreatmentAdmin(@Body() body: CreateTreatmentDto) {
    return this.clinicsService.createMasterTreatment(body);
  }

  @Put('master/treatments/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update master treatment' })
  async updateTreatmentAdmin(@Param('id') id: string, @Body() body: UpdateTreatmentDto) {
    return this.clinicsService.updateTreatment(id, body);
  }

  @Delete('master/treatments/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete master treatment' })
  async deleteTreatmentAdmin(@Param('id') id: string) {
    return this.clinicsService.deleteTreatment(id);
  }

  @Post('master/treatments/auto-connect-categories')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Auto-connect treatments to categories by name' })
  async autoConnectCategories() {
    return this.clinicsService.autoConnectTreatmentCategories();
  }
}


// Trigger backend reload
