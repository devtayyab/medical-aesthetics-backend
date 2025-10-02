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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { AvailabilityService } from './availability.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { HoldSlotDto } from './dto/hold-slot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppointmentStatus } from '@/common/enums/appointment-status.enum';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Bookings')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  @Public()
  @Get('availability')
  @ApiOperation({ summary: 'Get available slots (public)' })
  @ApiQuery({ name: 'clinicId', required: true })
  @ApiQuery({ name: 'serviceId', required: true })
  @ApiQuery({ name: 'providerId', required: true })
  @ApiQuery({ name: 'date', required: true, example: '2025-01-20' })
  getAvailability(@Query() query: any) {
    return this.availabilityService.getAvailableSlots(
      query.clinicId,
      query.serviceId,
      query.providerId,
      query.date,
    );
  }

  @Post('appointments/hold')
  @ApiOperation({ summary: 'Hold a slot temporarily' })
  holdSlot(@Body() holdSlotDto: HoldSlotDto) {
    return this.bookingsService.holdSlot(holdSlotDto);
  }

  @Post('appointments')
  @ApiOperation({ summary: 'Confirm appointment booking' })
  createAppointment(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.bookingsService.createAppointment(createAppointmentDto);
  }

  @Get('appointments/:id')
  @ApiOperation({ summary: 'Get appointment details' })
  getAppointment(@Param('id') id: string) {
    return this.bookingsService.findById(id);
  }

  @Patch('appointments/:id/reschedule')
  @ApiOperation({ summary: 'Reschedule appointment' })
  reschedule(
    @Param('id') id: string,
    @Body() body: { startTime: string; endTime: string },
  ) {
    return this.bookingsService.reschedule(
      id,
      new Date(body.startTime),
      new Date(body.endTime),
    );
  }

  @Patch('appointments/:id/cancel')
  @ApiOperation({ summary: 'Cancel appointment' })
  cancel(@Param('id') id: string) {
    return this.bookingsService.updateStatus(id, AppointmentStatus.CANCELLED);
  }

  @Patch('appointments/:id/complete')
  @ApiOperation({ summary: 'Mark appointment as completed' })
  complete(@Param('id') id: string, @Body() data: any) {
    return this.bookingsService.updateStatus(id, AppointmentStatus.COMPLETED, data);
  }

  @Get('appointments')
  @ApiOperation({ summary: 'Get user appointments' })
  getUserAppointments(@Request() req) {
    return this.bookingsService.findUserAppointments(req.user.id, req.user.role);
  }
}