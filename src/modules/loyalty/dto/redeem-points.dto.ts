import { IsInt, IsPositive, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RedeemPointsDto {
  @ApiProperty()
  @IsUUID()
  clientId: string;

  @ApiProperty()
  @IsUUID()
  clinicId: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @IsPositive()
  points: number;

  @ApiProperty({ example: 'Discount on treatment' })
  @IsString()
  description: string;
}