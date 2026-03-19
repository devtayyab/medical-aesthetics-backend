import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsEnum, IsOptional, IsDate, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateActionDto {
  @ApiProperty({ example: 'b3f1c2d0-8f4a-4d3e-a123-56789abcde01', required: false })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty({ example: 'd2e5f6a1-3b4c-4e5f-b678-12345fghij67', required: false })
  @IsOptional()
  @IsUUID()
  salespersonId?: string;

  @ApiProperty({
    example: 'call',
    enum: ['call', 'mobile_message', 'follow_up_call', 'email', 'appointment', 'confirmation_call_reminder', 'follow_up', 'phone_call'],
  })
  @IsString()
  @IsEnum(['call', 'mobile_message', 'follow_up_call', 'email', 'appointment', 'confirmation_call_reminder', 'follow_up', 'phone_call'])
  actionType: string;

  @ApiProperty({ example: 'Facial Therapy', required: false })
  @IsOptional()
  @IsString()
  therapy?: string;

  @ApiProperty({ example: 'Follow up with client', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'Call to confirm next session', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'pending', enum: ['pending', 'in_progress', 'completed', 'cancelled', 'missed'], required: false })
  @IsOptional()
  @IsEnum(['pending', 'in_progress', 'completed', 'cancelled', 'missed'])
  status?: string;

  @ApiProperty({ example: 'high', enum: ['low', 'medium', 'high', 'urgent'], required: false })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: string;

  @ApiProperty({ example: '2025-10-29T10:00:00Z', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date;

  @ApiProperty({ example: '2025-10-29T09:00:00Z', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  reminderDate?: Date;

  @ApiProperty({ example: '2025-10-30T12:00:00Z', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  completedAt?: Date;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  isRecurring?: boolean;

  @ApiProperty({ example: 'weekly', enum: ['daily', 'weekly', 'monthly', 'custom'], required: false })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly', 'custom'])
  recurrenceType?: string;

  @ApiProperty({ example: 7, required: false })
  @IsOptional()
  recurrenceInterval?: number;

  @ApiProperty({ example: 'b3f1c2d0-8f4a-4d3e-a123-56789abcde01', required: false })
  @IsOptional()
  @IsUUID()
  originalTaskId?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7g8h-9i0j-123456789abc', required: false })
  @IsOptional()
  @IsUUID()
  relatedAppointmentId?: string;

  @ApiProperty({ example: 'f0e1d2c3-b4a5-6c7d-8e9f-0123456789ab', required: false })
  @IsOptional()
  @IsUUID()
  relatedLeadId?: string;
  @ApiProperty({ example: 'Main Clinic', required: false })
  @IsOptional()
  @IsString()
  clinic?: string;

  @ApiProperty({ example: 'Facial Treatment', required: false })
  @IsOptional()
  @IsString()
  proposedTreatment?: string;

  @ApiProperty({ example: 'successful', enum: ['successful', 'failed', 'pending'], required: false })
  @IsOptional()
  @IsEnum(['successful', 'failed', 'pending'])
  callOutcome?: string;


  @ApiProperty({ example: 200.0, required: false })
  @IsOptional()
  cost?: number;

  @ApiProperty({ example: { outcome: 'successful', notes: 'Client confirmed next session' }, required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
