import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../../payments/entities/payment-record.entity';

/**
 * Manual payment recorded by staff. Only these fields are accepted — `type`, `status`,
 * and `salespersonId` are intentionally NOT settable by the caller (they are derived
 * server-side) to prevent fabricating turnover or refund records.
 */
export class ManualPaymentDto {
  @ApiProperty({ example: 50 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
