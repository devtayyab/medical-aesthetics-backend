import {
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsUUID,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsUUID()
  clinicId: string;

  @ApiProperty()
  @IsUUID()
  serviceId: string;

  @ApiProperty()
  @IsUUID()
  providerId?: string;

  @ApiProperty()
  @IsUUID()
  clientId: string;

  @ApiProperty({ example: '2025-01-20T10:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2025-01-20T11:00:00Z' })
  @IsDateString()
  endTime: string;

  @ApiProperty({ enum: AppointmentStatus, required: false })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'cash', required: false })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @IsNumber()
  advancePaymentAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  holdId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  treatmentDetails?: any;
}