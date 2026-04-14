import { Processor, Process } from '@nestjs/bull';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bull';
import { BookingsService } from '../../bookings/bookings.service';
import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';

@Processor('recurring')
export class RecurringAppointmentProcessor {
  private readonly logger = new Logger(RecurringAppointmentProcessor.name);

  constructor(
    @Inject(forwardRef(() => BookingsService))
    private readonly bookingsService: BookingsService,
  ) { }

  @Process('create-recurring-appointment')
  async handleRecurringAppointment(job: Job) {
    const { templateId, clientId, clinicId, providerId } = job.data;

    try {
      this.logger.log(`Creating recurring appointment for client ${clientId}, service ${templateId} in clinic ${clinicId} (Staff: ${providerId || 'unassigned'})`);

      // We use templateId as the serviceId
      // and we set the time for "Today at 9 AM"
      const now = new Date();
      const startTime = new Date(now.setHours(9, 0, 0, 0));
      const endTime = new Date(now.setHours(10, 0, 0, 0)); // Default 1 hour duration

      await this.bookingsService.createAppointment({
        clientId: clientId,
        clinicId: clinicId,
        serviceId: templateId,
        providerId: providerId || undefined,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: AppointmentStatus.CONFIRMED,
        paymentMethod: 'cash', // Default for recurring
        appointmentSource: 'platform_broker',
      });

      this.logger.log(`Successfully created recurring appointment for client ${clientId}`);

    } catch (error) {
      this.logger.error(`Failed to create recurring appointment: ${error.message}`);
      throw error;
    }
  }
}