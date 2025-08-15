import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor('recurring')
export class RecurringAppointmentProcessor {
  private readonly logger = new Logger(RecurringAppointmentProcessor.name);

  @Process('create-recurring-appointment')
  async handleRecurringAppointment(job: Job) {
    const { templateId, clientId } = job.data;
    
    try {
      // Logic to create recurring appointment
      this.logger.log(`Creating recurring appointment for client ${clientId}, template ${templateId}`);
      
      // Find available slot and create appointment
      // This would integrate with BookingsService and AvailabilityService
      
    } catch (error) {
      this.logger.error(`Failed to create recurring appointment: ${error.message}`);
      throw error;
    }
  }
}