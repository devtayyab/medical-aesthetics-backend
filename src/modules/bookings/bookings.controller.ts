import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { AvailabilityService } from './availability.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { HoldSlotDto } from './dto/hold-slot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { Public } from '../../common/decorators/public.decorator';
import { stripUserPersonalData, stripClinicBankData } from '../../common/utils/privacy.util';
import { UserRole } from '../../common/enums/user-role.enum';
import { FinancialService } from '../payments/financial.service';

const STAFF_ROLES = ['admin', 'super_admin', 'manager', 'salesperson', 'clinic_owner', 'doctor', 'secretariat'];
// BD sales staff: may not change or delete a confirmed/paid appointment (admins can).
const SALES_ROLES = [UserRole.SALESPERSON, UserRole.MANAGER].map(r => String(r).toLowerCase());

@ApiTags('Bookings')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly availabilityService: AvailabilityService,
    private readonly financialService: FinancialService,
  ) { }

  private isAdmin(user: any): boolean {
    return this.bookingsService.isAdminRole(user?.role);
  }

  // Lock stays for salespeople: once paid, only an admin may change or delete the appointment.
  private assertNotLockedForSales(appointment: any, user: any) {
    const role = String(user?.role || '').toLowerCase();
    if (SALES_ROLES.includes(role) && Number(appointment?.amountPaid || 0) > 0) {
      throw new ForbiddenException('This appointment is paid. Only an admin can change or delete it.');
    }
  }

  private isStaff(user: any): boolean {
    return STAFF_ROLES.includes((user?.role || '').toLowerCase());
  }

  // Owner-or-staff: a client may only touch their own appointment; clinic accounts only
  // appointments of their own clinic(s); BeautyDoctors staff may touch any.
  private async assertCanAccess(id: string, user: any) {
    const appointment = await this.bookingsService.findById(id);
    if (this.bookingsService.isClinicAccountRole(user?.role)) {
      // Throws NotFound unless the appointment belongs to one of the account's clinics.
      await this.bookingsService.findAppointmentForClinic(id, user.id, String(user.role).toLowerCase());
    } else if (!this.isStaff(user) && String(appointment.clientId) !== String(user?.id)) {
      throw new ForbiddenException('You do not have access to this appointment.');
    }
    return appointment;
  }

  // Staff-only management operations (complete / record payment / change status / edit details).
  private assertStaff(user: any) {
    if (!this.isStaff(user)) {
      throw new ForbiddenException('This action requires staff privileges.');
    }
  }

  @Public()
  @Get('availability') // Ensures this is treated as /bookings/availability or root level depending on controller mounting
  @ApiOperation({ summary: 'Get available slots (public)' })
  @ApiQuery({ name: 'clinicId', required: true })
  @ApiQuery({ name: 'serviceId', required: true })
  @ApiQuery({ name: 'providerId', required: false })
  @ApiQuery({ name: 'date', required: true, example: '2025-01-20' })
  async getAvailability(@Query() query: any, @Request() req: any) {
    try {
      // Past slots: only ADMIN / SUPER_ADMIN may see (and book) times that already passed.
      const wantsPast = query.allowPast === 'true' || query.allowPast === true;
      const serviceIds = [
        ...(Array.isArray(query.serviceId) ? query.serviceId : String(query.serviceId || '').split(',')),
        ...(Array.isArray(query.additionalServiceIds) ? query.additionalServiceIds : String(query.additionalServiceIds || '').split(',')),
      ].map((v: string) => String(v).trim()).filter(Boolean);
      const result: any = await this.availabilityService.getAvailableSlots(
        query.clinicId,
        serviceIds.length > 1 ? serviceIds : query.serviceId,
        query.providerId || null,
        query.date,
        wantsPast && this.isAdmin(req?.user),
        query.excludeAppointmentId || null
      );
      // Not logged in: no doctor names
      if (!req?.user && Array.isArray(result?.slots)) {
        result.slots = result.slots.map((slot: any) => ({ ...slot, providerName: null }));
      }
      return result;
    } catch (error) {
      // Log error for debugging
      console.error('Error getting availability:', error);
      throw error;
    }
  }

  @Public()
  @Post('appointments/hold')
  @ApiOperation({ summary: 'Hold a slot temporarily' })
  holdSlot(@Body() holdSlotDto: HoldSlotDto) {
    return this.bookingsService.holdSlot(holdSlotDto);
  }

  @Public()
  @Post('appointments')
  @ApiOperation({ summary: 'Confirm appointment booking' })
  async createAppointment(@Body() createAppointmentDto: CreateAppointmentDto, @Request() req: any) {
    try {
      const caller = req.user;
      const callerIsStaff = this.isStaff(caller);
      const bookedById = callerIsStaff
        ? (createAppointmentDto.bookedById || caller?.id)
        : undefined;
      const representativeId = createAppointmentDto.representativeId || (caller?.role === 'salesperson' ? caller.id : undefined);

      const payload: any = {
        ...createAppointmentDto,
        bookedById: bookedById || undefined,
        representativeId: representativeId || undefined,
      };
      // A public/non-staff caller must never dictate the appointment status (e.g. self-confirm
      // without paying). Only staff may pass an explicit status; otherwise it's derived server-side.
      // (Sending a bookedById must not lift this: only staff may set either.)
      if (!callerIsStaff) {
        delete payload.status;
      }
      // A logged-in client always books for themselves, never under another client's account.
      if (caller && String(caller.role || '').toLowerCase() === UserRole.CLIENT) {
        payload.clientId = caller.id;
      }
      // Clinic accounts only book into their own clinic(s).
      if (caller) {
        await this.bookingsService.assertClinicAccountCanUseClinic(caller.id, caller.role, payload.clinicId);
      }
      return await this.bookingsService.createAppointment(payload, caller ? { id: caller.id, role: caller.role } : null);
    } catch (error) {
      console.error('❌ [BookingsController] Create Appointment Error:', {
        message: error.message,
        response: error.response,
        // Only ID presence: the DTO carries clientDetails (name, email, phone).
        payload: {
          clientId: !!createAppointmentDto.clientId,
          clinicId: !!createAppointmentDto.clinicId,
          serviceId: !!createAppointmentDto.serviceId,
          hasClientDetails: !!createAppointmentDto.clientDetails,
        }
      });
      throw error;
    }
  }

  @Get('appointments/clinic')
  @ApiOperation({ summary: 'Get clinic appointments with filters' })
  getClinicAppointments(@Request() req, @Query() query: any) {
    return this.bookingsService.findClinicAppointments(req.user.id, req.user.role, query);
  }

  @Get('appointments/:id')
  @ApiOperation({ summary: 'Get appointment details' })
  async getAppointment(@Param('id') id: string, @Request() req) {
    const appointment = await this.assertCanAccess(id, req.user);
    const isStaffBooker = appointment.bookedBy &&
      appointment.bookedBy.role !== 'client' &&
      appointment.bookedBy.id !== appointment.clientId;
    const staffRepresentative = appointment.representative?.role !== 'client' ? appointment.representative : null;
    const booker = isStaffBooker ? appointment.bookedBy : staffRepresentative;

    const result: any = {
      ...appointment,
      displayName: this.bookingsService.formatAppointmentDisplayName(appointment),
      serviceName: appointment.service?.treatment?.name,
      providerName: appointment.provider
        ? `${appointment.provider.firstName} ${appointment.provider.lastName}`
        : null,
      bookedByInfo: booker ? {
        id: booker.id,
        name: `${booker.firstName || ''} ${booker.lastName || ''}`.trim(),
        role: booker.role || 'salesperson'
      } : (appointment.provider && (appointment.provider.role === 'SUPER_ADMIN' || appointment.provider.role === 'admin' || appointment.provider.role === 'salesperson') ? {
        id: appointment.provider.id,
        name: `${appointment.provider.firstName} ${appointment.provider.lastName}`,
        role: appointment.provider.role,
      } : null),
      executedByName: appointment.executedBy ? `${appointment.executedBy.firstName} ${appointment.executedBy.lastName}` : null,
      executedByInfo: appointment.executedBy ? {
        id: appointment.executedBy.id,
        name: `${appointment.executedBy.firstName} ${appointment.executedBy.lastName}`,
        role: appointment.executedBy.role,
      } : null,
    };

    // If pending payment, generate a fresh Viva Wallet redirect URL
    if (appointment.status === AppointmentStatus.PENDING_PAYMENT) {
      try {
        const redirectUrl = await this.bookingsService.generateVivaPaymentUrl(appointment);
        if (redirectUrl) result.redirectUrl = redirectUrl;
      } catch (err) {
        console.error('[Viva Wallet] Failed to regenerate payment URL:', err?.message);
      }
    }

    // Internal notes NEVER reach the client.
    // Staff personal email/phone/last login never go to clients.
    // Clinic bank columns are select: false, so they are not loaded here at all;
    // the client pays through Viva Wallet (redirectUrl) at the payment step.
    const callerIsStaff = this.isStaff(req.user);
    if (!callerIsStaff) {
      delete result.notes;
      delete result.clinicNotes;
      delete result.appointmentCompletionReport;

      for (const key of ['provider', 'bookedBy', 'executedBy', 'representative']) {
        if (result[key]) result[key] = stripUserPersonalData(result[key]);
      }
      if (result.clinic) result.clinic = stripClinicBankData(result.clinic);
    }

    return result;
  }

  @Patch('appointments/:id/reschedule')
  @ApiOperation({ summary: 'Reschedule appointment' })
  async reschedule(
    @Param('id') id: string,
    @Body() body: { startTime: string; endTime: string; notes?: string; reason?: string },
    @Request() req,
  ) {
    // Same access rule as every other appointment action (clinic accounts: own clinic only).
    const appointment = await this.assertCanAccess(id, req.user);
    
    console.log('[Reschedule Debug]', {
      userId: req.user.id,
      userRole: req.user.role,
      appointmentClientId: appointment.clientId,
      appointmentId: id
    });

    // Security check: Ensure clients can only reschedule their own appointments
    const isClient = req.user.role?.toLowerCase() === 'client' || !this.isStaff(req.user);
    if (isClient && String(appointment.clientId) !== String(req.user.id)) {
      console.warn(`[Reschedule Forbidden] User ${req.user.id} tried to reschedule appointment ${id} belonging to client ${appointment.clientId}`);
      throw new ForbiddenException('You can only reschedule your own appointments');
    }

    const start = new Date(body.startTime);
    const end = new Date(body.endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date provided');
    }

    try {
      if (!isClient) this.assertNotLockedForSales(appointment, req.user);
      return await this.bookingsService.reschedule(
        id,
        start,
        end,
        body.reason || body.notes,
        isClient,
        { id: req.user?.id, role: req.user?.role },
      );
    } catch (error) {
      console.error('[Reschedule error in controller]:', error);
      throw error;
    }
  }

  @Patch('appointments/:id/update')
  @ApiOperation({ summary: 'Update appointment details (provider, time, notes, price, services)' })
  async updateAppointment(
    @Param('id') id: string,
    @Body() body: { startTime?: string; endTime?: string; providerId?: string; clinicId?: string; serviceId?: string; notes?: string; totalAmount?: number; additionalServiceIds?: string[]; representativeId?: string; bookedById?: string },
    @Request() req,
  ) {
    // Editing appointment details (incl. price) is a staff action, and must be authorized.
    this.assertStaff(req.user);
    const existing = await this.assertCanAccess(id, req.user);
    this.assertNotLockedForSales(existing, req.user);

    // Explicit field whitelist — normalize empty-string ids to null so we never write '' to an FK.
    const updateData: any = {};
    if (body.startTime) updateData.startTime = new Date(body.startTime);
    if (body.endTime) updateData.endTime = new Date(body.endTime);
    if (body.providerId !== undefined) updateData.providerId = body.providerId || null;
    if (body.clinicId !== undefined) {
      // Clinic accounts cannot move an appointment to a clinic they don't work for.
      await this.bookingsService.assertClinicAccountCanUseClinic(req.user.id, req.user.role, body.clinicId);
      updateData.clinicId = body.clinicId || null;
    }
    if (body.serviceId !== undefined) updateData.serviceId = body.serviceId || null;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.totalAmount !== undefined) updateData.totalAmount = body.totalAmount;
    if (body.additionalServiceIds !== undefined) updateData.additionalServiceIds = body.additionalServiceIds;
    if (body.representativeId !== undefined) updateData.representativeId = body.representativeId || null;
    if (body.bookedById !== undefined) updateData.bookedById = body.bookedById || null;
    return this.bookingsService.updateAppointmentDetails(id, updateData, { id: req.user?.id, role: req.user?.role });
  }

  @Patch('appointments/:id/cancel')
  @ApiOperation({ summary: 'Cancel appointment' })
  async cancel(@Param('id') id: string, @Body() body: { refund?: boolean }, @Request() req) {
    const appointment = await this.assertCanAccess(id, req.user);
    if (this.isStaff(req.user)) this.assertNotLockedForSales(appointment, req.user);
    return this.bookingsService.updateStatus(
      id,
      AppointmentStatus.CANCELLED,
      { refund: body?.refund === true },
      req.user?.id,
      { role: req.user?.role },
    );
  }

  @Patch('appointments/:id/delete')
  @ApiOperation({ summary: 'Soft-delete appointment (status=DELETED, revenue voided)' })
  async softDelete(@Param('id') id: string, @Request() req) {
    this.assertStaff(req.user);
    const appointment = await this.assertCanAccess(id, req.user);
    this.assertNotLockedForSales(appointment, req.user);
    return this.bookingsService.softDeleteAppointment(id, req.user.id, req.user.role);
  }

  @Patch('appointments/:id/complete')
  @ApiOperation({ summary: 'Mark appointment as completed' })
  async complete(@Param('id') id: string, @Body() data: any, @Request() req) {
    this.assertStaff(req.user);
    await this.assertCanAccess(id, req.user);
    return this.bookingsService.updateStatus(id, AppointmentStatus.COMPLETED, data, req.user?.id, { role: req.user?.role });
  }

  @Post('appointments/:id/payment')
  @ApiOperation({ summary: 'Record payment for an appointment without completing it' })
  async recordPayment(
    @Param('id') id: string,
    @Body() body: { amount: number; method: string; notes?: string },
    @Request() req,
  ) {
    this.assertStaff(req.user);
    await this.assertCanAccess(id, req.user);
    return this.bookingsService.recordAppointmentPayment(id, body.amount, body.method, body.notes || '', req.user.id);
  }

  @Get('appointments/:id/payment-summary')
  @ApiOperation({ summary: 'Total, paid, balance and every payment (with method) of an appointment' })
  async getPaymentSummary(@Param('id') id: string, @Request() req) {
    this.assertStaff(req.user);
    await this.assertCanAccess(id, req.user);
    return this.financialService.getAppointmentPaymentSummary(id);
  }

  @Post('appointments/:id/payment-url')
  @ApiOperation({ summary: 'Generate Viva Wallet payment URL for an existing appointment (card payment)' })
  async generatePaymentUrl(@Param('id') id: string, @Request() req) {
    // Only the appointment's own client (or staff) may create its payment link
    const appointment = await this.assertCanAccess(id, req.user);
    const redirectUrl = await this.bookingsService.generateVivaPaymentUrl(appointment);
    return { redirectUrl };
  }

  @Patch('appointments/:id/status')
  @ApiOperation({ summary: 'Update appointment status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: AppointmentStatus | string; refund?: boolean; notes?: string },
    @Request() req,
  ) {
    this.assertStaff(req.user);
    const appointment = await this.assertCanAccess(id, req.user);
    this.assertNotLockedForSales(appointment, req.user);
    // Status input is normalized server-side ('completed' -> 'COMPLETED'); unknown values are rejected.
    const status = this.bookingsService.normalizeStatus(body.status);
    return this.bookingsService.updateAppointmentStatus(id, status, req.user.id, req.user.role, {
      refund: body.refund === true,
      notes: body.notes,
    });
  }


  @Get('appointments')
  @ApiOperation({ summary: 'Get user appointments' })
  getUserAppointments(@Request() req) {
    return this.bookingsService.findUserAppointments(req.user.id, req.user.role);
  }
  
  @Post('blocked-slots')
  @ApiOperation({ summary: 'Block a time slot' })
  async createBlockedSlot(@Body() body: any, @Request() req) {
    // Only staff (incl. salespeople) may block a clinic's calendar; clinic accounts only their own.
    this.assertStaff(req.user);
    await this.bookingsService.assertClinicAccountCanUseClinic(req.user.id, req.user.role, body?.clinicId);
    return this.availabilityService.blockTimeSlot(
      body.clinicId,
      body.providerId || null,
      new Date(body.startTime),
      new Date(body.endTime),
      body.reason || 'Blocked',
      req.user.id
    );
  }
}