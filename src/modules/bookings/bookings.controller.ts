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

@ApiTags('Bookings')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly availabilityService: AvailabilityService,
  ) { }

  @Public()
  @Get('availability') // Ensures this is treated as /bookings/availability or root level depending on controller mounting
  @ApiOperation({ summary: 'Get available slots (public)' })
  @ApiQuery({ name: 'clinicId', required: true })
  @ApiQuery({ name: 'serviceId', required: true })
  @ApiQuery({ name: 'providerId', required: false })
  @ApiQuery({ name: 'date', required: true, example: '2025-01-20' })
  async getAvailability(@Query() query: any) {
    try {
      const result = await this.availabilityService.getAvailableSlots(
        query.clinicId,
        query.serviceId,
        query.providerId || null,
        query.date,
        query.allowPast === 'true' || query.allowPast === true
      );
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
      const payload = {
        ...createAppointmentDto,
        bookedById: req.user?.id,
      };
      return await this.bookingsService.createAppointment(payload);
    } catch (error) {
      console.error('❌ [BookingsController] Create Appointment Error:', {
        message: error.message,
        response: error.response,
        payload: {
          ...createAppointmentDto,
          // Mask sensitive details but show ID presence
          clientId: !!createAppointmentDto.clientId,
          clinicId: !!createAppointmentDto.clinicId,
          serviceId: !!createAppointmentDto.serviceId,
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
  async getAppointment(@Param('id') id: string) {
    const appointment = await this.bookingsService.findById(id);
    const result: any = {
      ...appointment,
      displayName: this.bookingsService.formatAppointmentDisplayName(appointment),
      serviceName: appointment.service?.treatment?.name,
      providerName: appointment.provider
        ? `${appointment.provider.firstName} ${appointment.provider.lastName}`
        : null,
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

    return result;
  }

  @Patch('appointments/:id/reschedule')
  @ApiOperation({ summary: 'Reschedule appointment' })
  async reschedule(
    @Param('id') id: string,
    @Body() body: { startTime: string; endTime: string; notes?: string },
    @Request() req,
  ) {
    const appointment = await this.bookingsService.findById(id);
    
    console.log('[Reschedule Debug]', {
      userId: req.user.id,
      userRole: req.user.role,
      appointmentClientId: appointment.clientId,
      appointmentId: id
    });

    // Security check: Ensure clients can only reschedule their own appointments
    const isClient = req.user.role?.toLowerCase() === 'client';
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
      return await this.bookingsService.reschedule(
        id,
        start,
        end,
        body.notes
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
    @Body() body: { startTime?: string; endTime?: string; providerId?: string; clinicId?: string; serviceId?: string; notes?: string; totalAmount?: number; additionalServiceIds?: string[] },
    @Request() req,
  ) {
    const updateData: any = {};
    if (body.startTime) updateData.startTime = new Date(body.startTime);
    if (body.endTime) updateData.endTime = new Date(body.endTime);
    if (body.providerId !== undefined) updateData.providerId = body.providerId;
    if (body.clinicId !== undefined) updateData.clinicId = body.clinicId;
    if (body.serviceId !== undefined) updateData.serviceId = body.serviceId;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.totalAmount !== undefined) updateData.totalAmount = body.totalAmount;
    if (body.additionalServiceIds !== undefined) updateData.additionalServiceIds = body.additionalServiceIds;
    await this.bookingsService['appointmentsRepository'].update(id, updateData);
    return this.bookingsService.findById(id);
  }

  @Patch('appointments/:id/cancel')
  @ApiOperation({ summary: 'Cancel appointment' })
  async cancel(@Param('id') id: string, @Request() req) {
    return this.bookingsService.updateStatus(id, AppointmentStatus.CANCELLED, undefined, req.user?.id);
  }

  @Patch('appointments/:id/delete')
  @ApiOperation({ summary: 'Soft-delete appointment (status=DELETED, revenue voided)' })
  softDelete(@Param('id') id: string, @Request() req) {
    return this.bookingsService.softDeleteAppointment(id, req.user.id, req.user.role);
  }

  @Patch('appointments/:id/complete')
  @ApiOperation({ summary: 'Mark appointment as completed' })
  complete(@Param('id') id: string, @Body() data: any, @Request() req) {
    return this.bookingsService.updateStatus(id, AppointmentStatus.COMPLETED, data, req.user?.id);
  }

  @Patch('appointments/:id/status')
  @ApiOperation({ summary: 'Update appointment status' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: AppointmentStatus },
    @Request() req,
  ) {
    return this.bookingsService.updateAppointmentStatus(id, body.status, req.user.id, req.user.role);
  }


  @Get('appointments')
  @ApiOperation({ summary: 'Get user appointments' })
  getUserAppointments(@Request() req) {
    return this.bookingsService.findUserAppointments(req.user.id, req.user.role);
  }
  
  @Post('blocked-slots')
  @ApiOperation({ summary: 'Block a time slot' })
  createBlockedSlot(@Body() body: any, @Request() req) {
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