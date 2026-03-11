import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsNumber,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LeadStatus } from '../../../common/enums/lead-status.enum';

export class CreateLeadDto {
  @ApiProperty({ example: 'facebook_ads' })
  @IsString()
  source: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'jane.smith@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  facebookLeadId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  facebookFormId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  facebookCampaignId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  facebookAdSetId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  facebookAdId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  facebookLeadData?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  lastMetaFormSubmittedAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastMetaFormName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assignedSalesId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  estimatedValue?: number;

  @ApiProperty({
    enum: LeadStatus,
    required: false,
    default: LeadStatus.NEW,
    example: LeadStatus.NEW
  })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  facebookAdName?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsString({ each: true })
  multiOwnerIds?: string[];

  @ApiProperty({ required: false, type: 'array', items: { type: 'object' } })
  @IsOptional()
  clinicAffiliations?: Array<{ clinicId: string; status: LeadStatus }>;
}