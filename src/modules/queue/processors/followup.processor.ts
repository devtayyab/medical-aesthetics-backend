import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor('followups')
export class FollowUpProcessor {
  private readonly logger = new Logger(FollowUpProcessor.name);

  @Process('lead-followup')
  async handleLeadFollowUp(job: Job) {
    const { leadId, taskType } = job.data;
    
    try {
      // Logic to create follow-up task
      this.logger.log(`Processing lead follow-up for ${leadId}, type: ${taskType}`);
      
      // Create task for sales person
      // await this.tasksService.create({
      //   title: `Follow up with lead`,
      //   type: taskType,
      //   customerId: leadId,
      //   dueDate: new Date(),
      // });
      
    } catch (error) {
      this.logger.error(`Failed to process lead follow-up: ${error.message}`);
      throw error;
    }
  }
}