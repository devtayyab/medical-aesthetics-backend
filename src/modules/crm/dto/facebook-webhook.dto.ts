import { IsString, IsOptional, IsObject, IsEmail, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FacebookLeadFormDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  full_name?: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsOptional()
  first_name?: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsOptional()
  last_name?: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  @IsOptional()
  phone_number?: string;

  @ApiProperty({ example: { service_interest: 'Botox' } })
  @IsObject()
  @IsOptional()
  custom_fields?: Record<string, any>;
}

export class FacebookWebhookDto {
  @ApiProperty()
  @IsString()
  leadgen_id: string;

  @ApiProperty()
  @IsString()
  page_id: string;

  @ApiProperty()
  @IsString()
  form_id: string;

  @ApiProperty()
  @IsString()
  adgroup_id: string;

  @ApiProperty()
  @IsString()
  ad_id: string;

  @ApiProperty()
  @IsString()
  created_time: string;

  @ApiProperty({ type: FacebookLeadFormDto })
  field_data: FacebookLeadFormDto;
}
