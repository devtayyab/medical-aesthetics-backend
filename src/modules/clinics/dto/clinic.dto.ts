import { IsString, IsOptional, IsBoolean, IsObject, IsUUID, IsArray, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClinicProfileDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsObject()
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  businessHours?: {
    [day: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class UpdateClinicProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  businessHours?: {
    [day: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAppointmentStatusDto {
  @ApiProperty()
  @IsString()
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  treatmentDetails?: any;
}

export class RecordPaymentDto {
  @ApiProperty()
  @IsString()
  paymentMethod: string; // 'cash', 'pos', 'card', 'bank_transfer'

  @ApiProperty()
  @IsString()
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAdvancePayment?: boolean;
}

export class AvailabilitySettingsDto {
  @ApiProperty()
  @IsObject()
  businessHours: {
    [day: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString()
  blockedDates?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class ClinicAnalyticsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  serviceId?: string;
}
