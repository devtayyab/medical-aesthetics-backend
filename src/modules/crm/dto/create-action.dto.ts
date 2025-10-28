import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsEnum, IsOptional, IsDate, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateActionDto {
  @ApiProperty({ example: 'b3f1c2d0-8f4a-4d3e-a123-56789abcde01' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: 'd2e5f6a1-3b4c-4e5f-b678-12345fghij67' })
  @IsUUID()
  salespersonId: string;

  @ApiProperty({
    example: 'phone_call',
    enum: ['phone_call', 'email', 'follow_up', 'appointment_confirmation', 'meeting', 'treatment_reminder'],
  })
  @IsString()
  @IsEnum(['phone_call', 'email', 'follow_up', 'appointment_confirmation', 'meeting', 'treatment_reminder'])
  actionType: string;

  @ApiProperty({ example: 'Follow up with client' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Call to confirm next session', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'pending', enum: ['pending', 'completed', 'cancelled', 'missed'], required: false })
  @IsOptional()
  @IsEnum(['pending', 'completed', 'cancelled', 'missed'])
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

  @ApiProperty({ example: '2025-10-30T12:00:00Z', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  completedAt?: Date;

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
