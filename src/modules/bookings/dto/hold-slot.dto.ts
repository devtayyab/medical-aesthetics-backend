import { IsString, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HoldSlotDto {
  @ApiProperty()
  @IsUUID()
  clinicId: string;

  @ApiProperty()
  @IsUUID()
  serviceId: string;

  @ApiProperty()
  @IsUUID()
  providerId?: string;

  @ApiProperty({ example: '2025-01-20T10:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2025-01-20T11:00:00Z' })
  @IsDateString()
  endTime: string;
}